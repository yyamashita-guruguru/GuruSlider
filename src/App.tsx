import React, { useState, useEffect, useRef } from 'react';
import { Slide, SlideType, PresentationConfig, SlideBackground } from './types';
import { INITIAL_SLIDES, DEFAULT_CONFIG } from './initialData';
import { listDecks, getDeck, putDeck, deleteDeck, DeckRecord } from './deckStore';
import { SlideRenderer, getBgStyle, getThemeColorClasses } from './components/SlideRenderer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import pptxgen from 'pptxgenjs';
import {
  Play,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  Eye,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Maximize2,
  FileText,
  List,
  Sliders,
  Image as ImageIcon,
  Check,
  HelpCircle,
  Layers,
  Upload as UploadIcon,
  Save,
  FolderOpen,
  FilePlus
} from 'lucide-react';

const STORAGE_SLIDES_KEY = 'company_meeting_builder_slides';
const STORAGE_CONFIG_KEY = 'company_meeting_builder_config';
const STORAGE_UI_KEY = 'company_meeting_builder_ui';
const STORAGE_CURRENT_DECK_KEY = 'company_meeting_builder_current_deck';

export default function App() {
  // State for slides & configs
  const [slides, setSlides] = useState<Slide[]>(() => {
    const saved = localStorage.getItem(STORAGE_SLIDES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading slides', e);
      }
    }
    return INITIAL_SLIDES;
  });

  const [config, setConfig] = useState<PresentationConfig>(() => {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading config', e);
      }
    }
    return DEFAULT_CONFIG;
  });

  // Editor states
  const [selectedSlideId, setSelectedSlideId] = useState<string>(() => {
    return slides.length > 0 ? slides[0].id : '';
  });

  // Preview Mode state indicators
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  // Sequential preview layout tracker matching interstitial separators
  const [previewSteps, setPreviewSteps] = useState<{ slideId: string; mode: 'interstitial' | 'content'; slideTitle: string; subtitle: string }[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Background inspector menu toggles
  const [showBgConfig, setShowBgConfig] = useState<boolean>(false);
  const [imgUrlInput, setImgUrlInput] = useState<string>('');
  const [colorInput, setColorInput] = useState<string>('#1e293b');

  // Background edit target: the active slide, or a named preset (batch edit)
  const [bgEditMode, setBgEditMode] = useState<'slide' | 'preset'>('slide');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [applyTargetIds, setApplyTargetIds] = useState<string[]>([]);
  const [bgPanelTab, setBgPanelTab] = useState<'edit' | 'presets'>('edit');
  const bgBaseFileRef = useRef<HTMLInputElement>(null);
  const bgOverlayFileRef = useRef<HTMLInputElement>(null);

  // Font multi-select (common feature, controlled from the top toolbar)
  const [fontMultiMode, setFontMultiMode] = useState<boolean>(false);
  const [fontMultiKeys, setFontMultiKeys] = useState<string[]>([]);
  const fontApiRef = useRef<any>(null);

  // ── Deck library (save / load / delete multiple presentations) ──
  const [showLibrary, setShowLibrary] = useState<boolean>(false);
  const [savedDecks, setSavedDecks] = useState<DeckRecord[]>([]);
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(() => {
    try { const v = JSON.parse(localStorage.getItem(STORAGE_CURRENT_DECK_KEY) || 'null'); return v && typeof v.id === 'string' ? v.id : null; } catch { return null; }
  });
  const [currentDeckName, setCurrentDeckName] = useState<string>(() => {
    try { const v = JSON.parse(localStorage.getItem(STORAGE_CURRENT_DECK_KEY) || 'null'); return v && typeof v.name === 'string' ? v.name : ''; } catch { return ''; }
  });
  // JSON snapshot of the last saved / loaded state — used to detect unsaved changes.
  const savedSnapshotRef = useRef<string>('');
  // Ref for the library dropdown container, used to close it on outside click.
  const libraryMenuRef = useRef<HTMLDivElement>(null);

  // Guarded localStorage write: warns once if the quota is exceeded instead of throwing.
  const storageWarnedRef = useRef(false);
  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('localStorage save failed:', e);
      if (!storageWarnedRef.current) {
        storageWarnedRef.current = true;
        alert('データの自動保存に失敗しました。ブラウザの保存容量の上限に達した可能性があります。画像の枚数やサイズを減らすか、不要なスライドを削除してください（作業中の内容は画面上には保持されています）。');
      }
    }
  };

  // Resizable + persisted left sidebar size (height of slide list, and sidebar width)
  const loadUiPrefs = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_UI_KEY) || '{}') || {}; } catch { return {}; }
  };
  const [listHeight, setListHeight] = useState<number>(() => {
    const v = loadUiPrefs().listHeight;
    return typeof v === 'number' ? v : 560;
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const v = loadUiPrefs().sidebarWidth;
    return typeof v === 'number' ? v : 320;
  });

  // Persist UI layout preferences
  useEffect(() => {
    safeSetItem(STORAGE_UI_KEY, JSON.stringify({ listHeight, sidebarWidth }));
  }, [listHeight, sidebarWidth]);

  const startListResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = listHeight;
    const onMove = (ev: MouseEvent) => {
      const max = Math.max(180, window.innerHeight - 340);
      const next = Math.min(Math.max(140, startH + (ev.clientY - startY)), max);
      setListHeight(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(640, Math.max(220, startW + (ev.clientX - startX)));
      setSidebarWidth(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Export State parameters
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportType, setExportType] = useState<'PDF' | 'PowerPoint' | null>(null);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportTotal, setExportTotal] = useState<number>(0);

  // File Upload reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop reorder state for the slide sequence sidebar
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync to local storage (guarded against quota-exceeded errors)
  useEffect(() => {
    safeSetItem(STORAGE_SLIDES_KEY, JSON.stringify(slides));
  }, [slides]);

  useEffect(() => {
    safeSetItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // Remember which library deck is currently open (survives page reloads).
  useEffect(() => {
    safeSetItem(STORAGE_CURRENT_DECK_KEY, JSON.stringify({ id: currentDeckId, name: currentDeckName }));
  }, [currentDeckId, currentDeckName]);

  // Load the saved-deck list on startup so the library dropdown is populated.
  useEffect(() => {
    listDecks().then(setSavedDecks).catch((err) => console.error('deck list load failed', err));
  }, []);

  // Close the library dropdown when clicking outside of it.
  useEffect(() => {
    if (!showLibrary) return;
    const onDown = (e: MouseEvent) => {
      if (libraryMenuRef.current && !libraryMenuRef.current.contains(e.target as Node)) {
        setShowLibrary(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showLibrary]);

  // Clear font multi-selection when switching slides (keys are per-slide)
  useEffect(() => {
    setFontMultiKeys([]);
  }, [selectedSlideId]);

  // Active slide calculation helper
  const activeSlide = slides.find(s => s.id === selectedSlideId) || slides[0];

  useEffect(() => {
    if (activeSlide && activeSlide.background) {
      if (activeSlide.background.type === 'solid') {
        setColorInput(activeSlide.background.value);
      } else if (activeBgStyle?.type === 'image') {
        setImgUrlInput(activeBgStyle.value);
      }
    }
  }, [selectedSlideId]);

  // Prepare Presentation Steps hierarchy (incorporating optional Interstitial Divider slides)
  const enterPresentation = () => {
    if (slides.length === 0) return;
    const steps: typeof previewSteps = [];
    
    slides.forEach(slide => {
      // If a slide has 'showInterstitial' enabled, we inject a divider screen first
      if (slide.showInterstitial) {
        steps.push({
          slideId: slide.id,
          mode: 'interstitial',
          slideTitle: slide.title,
          subtitle: slide.interstitialSubtitle || 'CHAPTER'
        });
      }
      // Then show the slide itself
      steps.push({
        slideId: slide.id,
        mode: 'content',
        slideTitle: slide.title,
        subtitle: ''
      });
    });

    setPreviewSteps(steps);

    // Start presentation at the active selected slide's content step if possible, otherwise at 0
    const matchingStepIdx = steps.findIndex(step => step.slideId === selectedSlideId && step.mode === 'content');
    setCurrentStepIndex(matchingStepIdx !== -1 ? matchingStepIdx : 0);
    setIsPreviewMode(true);
  };

  const handleNextStep = () => {
    if (currentStepIndex < previewSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation for Presenter Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPreviewMode) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsPreviewMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode, currentStepIndex, previewSteps]);

  // Core editing actions
  const handleUpdateSlideContent = (slideId: string, updatedContent: any) => {
    setSlides(prev => prev.map(slide => {
      if (slide.id === slideId) {
        return {
          ...slide,
          content: updatedContent
        };
      }
      return slide;
    }));
  };

  const handleUpdateSlideField = (slideId: string, fieldKey: keyof Slide, value: any) => {
    setSlides(prev => prev.map(slide => {
      if (slide.id === slideId) {
        return {
          ...slide,
          [fieldKey]: value
        };
      }
      return slide;
    }));
  };

  const handleAddSlide = (type: SlideType) => {
    const newId = `slide-${Date.now()}`;
    
    // Custom template structure fields for perfect default visual loading
    let defaultContent: any = {};
    let defaultTitle = '新規スライド';

    switch (type) {
      case 'title':
        defaultTitle = '表紙タイトル';
        defaultContent = {
          badgeLabel: '',
          titleMain: '',
          dateText: '',
          companyName: '',
          address: '',
          websiteUrl: '',
          badgeColor: '#0f172a'
        };
        break;
      case 'vision':
        defaultTitle = '企業ビジョン';
        defaultContent = {
          visionStatement: '',
          visionSubtitle: '',
          philosophyPoints: [
            { id: 'p1', title: '', text: '', icon: 'Users' },
            { id: 'p2', title: '', text: '', icon: 'Lightbulb' },
            { id: 'p3', title: '', text: '', icon: 'Handshake' }
          ],
          visionLayout: 'centered'
        };
        break;
      case 'toc':
        defaultTitle = '目次情報';
        defaultContent = {};
        break;
      case 'staff':
        defaultTitle = 'スタッフ紹介';
        defaultContent = {
          staffList: [
            { id: 's1', name: '', role: '', description: '', iconType: 'User' },
            { id: 's2', name: '', role: '', description: '', iconType: 'Palette' }
          ]
        };
        break;
      case 'financial_past3':
        defaultTitle = '決算報告-3期';
        defaultContent = {
          pastTermsUnit: '百万円',
          pastTerms: [
            { term: '第22期 (2024)', revenue: 1000, profit: 120 },
            { term: '第23期 (2025)', revenue: 1500, profit: 200 },
            { term: '第24期 (2026)', revenue: 2000, profit: 340 }
          ]
        };
        break;
      case 'financial_monthly':
        defaultTitle = '決算報告 (月次推移)';
        defaultContent = {
          monthlySalesUnit: '百万円',
          monthlySales: [
            { month: '4月', revenue: 100, target: 110 },
            { month: '5月', revenue: 120, target: 115 },
            { month: '6月', revenue: 130, target: 120 },
            { month: '7月', revenue: 125, target: 125 },
            { month: '8月', revenue: 140, target: 130 },
            { month: '9月', revenue: 160, target: 140 },
            { month: '10月', revenue: 155, target: 145 },
            { month: '11月', revenue: 170, target: 150 },
            { month: '12月', revenue: 195, target: 160 },
            { month: '1月', revenue: 160, target: 155 },
            { month: '2月', revenue: 175, target: 160 },
            { month: '3月', revenue: 210, target: 180 }
          ]
        };
        break;
      case 'financial_summary':
        defaultTitle = '予想目標と総括';
        defaultContent = {
          summaryRevenue: 1800,
          summaryProfit: 300,
          forecastRevenue: 2200,
          forecastProfit: 410,
          financialReportType: 'interim',
          reportText: '',
          futureOutlook: ''
        };
        break;
      case 'project_list':
        defaultTitle = 'プロジェクト一覧';
        defaultContent = {
          projects: [
            { id: 'p1', name: '', phase: 'development', startMonth: 4, endMonth: 9, progress: 65, color: '#4f46e5' },
            { id: 'p2', name: '', phase: 'future', startMonth: 10, endMonth: 12, progress: 0, color: '#f59e0b' }
          ]
        };
        break;
      case 'project_detail':
        defaultTitle = 'プロジェクト詳細';
        defaultContent = {
          projectDetail: {
            phase: 'development',
            releaseDate: '',
            description: '',
            imageUrl: '',
            links: [
              { id: 'l1', label: '', url: '' }
            ],
            videoUrl: '',
            summary: ''
          }
        };
        break;
      case 'future_initiatives':
        defaultTitle = '今後の取り組みと展望';
        defaultContent = {
          introText: '',
          initiatives: [
            { id: 'i1', title: '', description: '' },
            { id: 'i2', title: '', description: '' }
          ]
        };
        break;
      case 'announcements':
        defaultTitle = 'お知らせ日程';
        defaultContent = {
          announcementsList: [
            { id: 'a1', date: '', title: '', text: '' }
          ],
          closingMessage: ''
        };
        break;
    }

    const newSlide: Slide = {
      id: newId,
      type,
      title: defaultTitle,
      showInterstitial: false,
      interstitialSubtitle: 'NEXT CHAPTER',
      ...(type === 'title' ? { background: { type: 'solid', value: '#ffffff' } } : {}),
      content: defaultContent
    };

    // Append new slide to deck
    setSlides(prev => [...prev, newSlide]);
    setSelectedSlideId(newId);
  };

  const handleDeleteSlide = (slideId: string) => {
    if (slides.length <= 1) {
      alert('これ以上スライドを削除できません。最低1つのスライドが必要です。');
      return;
    }
    const filtered = slides.filter(s => s.id !== slideId);
    
    // Choose adjacent sibling to select
    const currIdx = slides.findIndex(s => s.id === slideId);
    const nextSelectIdx = currIdx === 0 ? 0 : currIdx - 1;
    
    setSlides(filtered);
    setSelectedSlideId(filtered[nextSelectIdx].id);
  };

  // Reorder slides via drag & drop (move item from one position to another)
  const handleReorderSlides = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex == null || toIndex == null ||
      fromIndex === toIndex ||
      fromIndex < 0 || toIndex < 0 ||
      fromIndex >= slides.length || toIndex >= slides.length
    ) return;

    setSlides(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // Duplicate a slide (deep copy) and insert it right after the original
  const handleDuplicateSlide = (slideId: string) => {
    const idx = slides.findIndex(s => s.id === slideId);
    if (idx === -1) return;

    const original = slides[idx];
    const newId = `slide-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const cloned: Slide = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      title: `${original.title} (コピー)`
    };

    const newSlides = [...slides];
    newSlides.splice(idx + 1, 0, cloned);
    setSlides(newSlides);
    setSelectedSlideId(newId);
  };

  // Reset to default sample material
  const handleResetToDefault = () => {
    if (window.confirm('これまでの編集内容をすべて消去し、初期サンプル資料にリセットします。よろしいですか？')) {
      localStorage.removeItem(STORAGE_SLIDES_KEY);
      localStorage.removeItem(STORAGE_CONFIG_KEY);
      setSlides(INITIAL_SLIDES);
      setConfig(DEFAULT_CONFIG);
      setSelectedSlideId(INITIAL_SLIDES[0].id);
    }
  };

  // ── Deck library handlers ──
  const deckSnapshot = () => JSON.stringify({ slides, config });
  const isDeckDirty = () => deckSnapshot() !== savedSnapshotRef.current;

  const refreshDeckList = () => {
    listDecks()
      .then(setSavedDecks)
      .catch((err) => {
        console.error('deck list failed', err);
        alert('保存済みデッキの読み込みに失敗しました。ブラウザの設定（プライベートモード等）で保存が無効になっている可能性があります。');
      });
  };

  const persistDeck = (id: string, name: string) => {
    const rec: DeckRecord = { id, name, updatedAt: Date.now(), slideCount: slides.length, slides, config };
    return putDeck(rec).then(() => {
      setCurrentDeckId(id);
      setCurrentDeckName(name);
      savedSnapshotRef.current = deckSnapshot();
    });
  };

  const handleSaveAsNewDeck = () => {
    const defaultName = currentDeckName || ('デッキ ' + new Date().toLocaleDateString('ja-JP'));
    const name = window.prompt('保存するデッキ（スライド一式）の名前を入力してください。', defaultName);
    if (name === null) return; // cancelled
    const finalName = name.trim() || defaultName;
    const id = 'deck-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    persistDeck(id, finalName)
      .then(() => { refreshDeckList(); alert('「' + finalName + '」として保存しました。'); })
      .catch((err) => { console.error(err); alert('保存に失敗しました。'); });
  };

  const handleSaveDeck = () => {
    if (currentDeckId) {
      const name = currentDeckName || '無題のデッキ';
      persistDeck(currentDeckId, name)
        .then(() => { refreshDeckList(); alert('「' + name + '」を上書き保存しました。'); })
        .catch((err) => { console.error(err); alert('保存に失敗しました。'); });
    } else {
      handleSaveAsNewDeck();
    }
  };

  const applyDeck = (full: DeckRecord) => {
    setSlides(full.slides);
    setConfig(full.config);
    setSelectedSlideId(full.slides.length > 0 ? full.slides[0].id : '');
    setCurrentDeckId(full.id);
    setCurrentDeckName(full.name);
    savedSnapshotRef.current = JSON.stringify({ slides: full.slides, config: full.config });
  };

  const handleLoadDeck = (rec: DeckRecord) => {
    if (isDeckDirty() && !window.confirm('保存していない変更があります。「' + rec.name + '」を開くと現在の内容は失われます。よろしいですか？')) return;
    getDeck(rec.id)
      .then((full) => {
        if (!full) { alert('デッキが見つかりませんでした。'); return; }
        applyDeck(full);
        setShowLibrary(false);
      })
      .catch((err) => { console.error(err); alert('デッキの読み込みに失敗しました。'); });
  };

  const handleDeleteDeck = (rec: DeckRecord) => {
    if (!window.confirm('「' + rec.name + '」を削除します。元に戻せません。よろしいですか？')) return;
    deleteDeck(rec.id)
      .then(() => {
        if (currentDeckId === rec.id) { setCurrentDeckId(null); setCurrentDeckName(''); }
        refreshDeckList();
      })
      .catch((err) => { console.error(err); alert('削除に失敗しました。'); });
  };

  const handleRenameDeck = (rec: DeckRecord) => {
    const name = window.prompt('新しい名前を入力してください。', rec.name);
    if (name === null) return;
    const finalName = name.trim() || rec.name;
    putDeck({ ...rec, name: finalName, updatedAt: Date.now() })
      .then(() => { if (currentDeckId === rec.id) setCurrentDeckName(finalName); refreshDeckList(); })
      .catch((err) => { console.error(err); alert('名前の変更に失敗しました。'); });
  };

  const handleNewDeck = () => {
    if (isDeckDirty() && !window.confirm('保存していない内容が消えます。新しい空のスライドを作成しますか？')) return;
    const fresh = JSON.parse(JSON.stringify(INITIAL_SLIDES));
    const freshConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    setSlides(fresh);
    setConfig(freshConfig);
    setSelectedSlideId(fresh.length > 0 ? fresh[0].id : '');
    setCurrentDeckId(null);
    setCurrentDeckName('');
    savedSnapshotRef.current = JSON.stringify({ slides: fresh, config: freshConfig });
  };

  // File IO: Export Presentation as JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ slides, config }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `all-hands-meeting-deck-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // File IO: Import Presentation from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.slides && Array.isArray(parsed.slides)) {
          setSlides(parsed.slides);
          if (parsed.config) {
            setConfig(parsed.config);
          }
          if (parsed.slides.length > 0) {
            setSelectedSlideId(parsed.slides[0].id);
          }
          alert('全体会議スライドファイルを正常に読み込みました。');
        } else {
          alert('無効なスライドデータ形式です。必要な構造が不足しています。');
        }
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
      }
    };
    reader.readAsText(file);
  };

  // Generate a flat list of pages to export, factoring in chapters/interstitial slides
  const getExportSteps = () => {
    const steps: { slideId: string; mode: 'interstitial' | 'content'; title: string; subtitle: string; slide: Slide }[] = [];
    slides.forEach(slide => {
      if (slide.showInterstitial) {
        steps.push({
          slideId: slide.id,
          mode: 'interstitial',
          title: slide.title,
          subtitle: slide.interstitialSubtitle || 'CHAPTER',
          slide
        });
      }
      steps.push({
        slideId: slide.id,
        mode: 'content',
        title: slide.title,
        subtitle: '',
        slide
      });
    });
    return steps;
  };

  // Compile Slide snapshots and compile documents via client jsPDF / pptxgenjs
  const handleExportDocs = async (format: 'pdf' | 'pptx') => {
    const steps = getExportSteps();
    if (steps.length === 0) return;

    setIsExporting(true);
    setExportType(format === 'pdf' ? 'PDF' : 'PowerPoint');
    setExportProgress(0);
    setExportTotal(steps.length);

    // Give DOM 500ms to mount hide container and structure elements
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const images: string[] = [];

      for (let i = 0; i < steps.length; i++) {
        setExportProgress(i + 1);
        const el = document.getElementById(`capture-step-${i}`);
        if (el) {
          // Micro delay to ensure charts are fully drawn on hidden layout container
          await new Promise(resolve => setTimeout(resolve, 150));
          
          const canvas = await html2canvas(el, {
            width: 1024,
            height: 576,
            scale: 2, // 2x high-resolution capture!
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#030712'
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.92);
          images.push(imgData);
        }
      }

      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [1024, 576]
        });

        images.forEach((imgData, idx) => {
          if (idx > 0) {
            pdf.addPage([1024, 576], 'landscape');
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, 1024, 576);
        });

        pdf.save(`${config.companyName || 'meeting'}-presentation-${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        const pptx = new pptxgen();
        pptx.layout = 'LAYOUT_16x9';

        images.forEach((imgData, idx) => {
          const slide = pptx.addSlide();
          slide.addImage({
            data: imgData,
            x: 0,
            y: 0,
            w: 10,
            h: 5.625
          });
        });

        await pptx.writeFile({
          fileName: `${config.companyName || 'meeting'}-presentation-${new Date().toISOString().split('T')[0]}.pptx`
        });
      }
    } catch (error) {
      console.error('Export compiled build failed', error);
      alert('書き出し処理中にエラーが発生しました。時間をあけて再度お試しください。');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Slide specific background state settings
  const updateSlideBg = (newBg: SlideBackground | null) => {
    if (!activeSlide) return;
    if (newBg === null) {
      // Revert to global background theme
      const updated = { ...activeSlide };
      delete updated.background;
      setSlides(prev => prev.map(s => s.id === activeSlide.id ? updated : s));
    } else {
      handleUpdateSlideField(activeSlide.id, 'background', newBg);
    }
  };

  // ── Image upload: compress + resize into a data URL (keeps localStorage small) ──
  const compressImageFile = (file: File, maxDim = 1600, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            const scale = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(reader.result as string); return; }
          ctx.drawImage(img, 0, 0, w, h);
          const keepAlpha = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif';
          resolve(canvas.toDataURL(keepAlpha ? 'image/png' : 'image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ── Background editing target abstraction (active slide OR a preset) ──
  const editingPreset = (config.backgroundPresets || []).find(p => p.id === editingPresetId) || null;
  const currentBg: SlideBackground | undefined =
    bgEditMode === 'preset' ? editingPreset?.background : activeSlide?.background;

  // Write a complete background to the current target. Editing a slide directly
  // strips any preset link (override). Editing a preset propagates to all linked slides.
  const setBgValue = (newBg: SlideBackground) => {
    if (bgEditMode === 'preset' && editingPresetId) {
      const linked = { ...newBg, presetId: editingPresetId };
      setConfig(prev => ({
        ...prev,
        backgroundPresets: (prev.backgroundPresets || []).map(p =>
          p.id === editingPresetId ? { ...p, background: linked } : p
        )
      }));
      setSlides(prev => prev.map(s =>
        s.background?.presetId === editingPresetId ? { ...s, background: linked } : s
      ));
    } else {
      if (!activeSlide) return;
      const overridden = { ...newBg };
      delete (overridden as any).presetId; // direct edit overrides / unlinks
      handleUpdateSlideField(activeSlide.id, 'background', overridden);
    }
  };

  // Merge a partial change onto the current target background.
  // When a slide has no own background yet, inherit the global one so that
  // adding only an overlay logo doesn't wipe out the existing base look.
  const patchBg = (patch: Partial<SlideBackground>) => {
    const fallback: SlideBackground = bgEditMode === 'preset'
      ? { type: 'solid', value: '#ffffff' }
      : (activeSlide?.background || config.globalBackground || { type: 'solid', value: '#ffffff' });
    const base: SlideBackground = currentBg || fallback;
    setBgValue({ ...base, ...patch });
  };

  // Upload handlers (base full background image / overlay logo image)
  const handleUploadBaseImage = async (file?: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 1600, 0.82);
      patchBg({ type: 'image', value: dataUrl });
    } catch { alert('画像の読み込みに失敗しました。'); }
  };
  const handleUploadOverlayImage = async (file?: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 1000, 0.92);
      patchBg({
        overlayImage: dataUrl,
        overlayX: currentBg?.overlayX ?? 80,
        overlayY: currentBg?.overlayY ?? 28,
        overlaySize: currentBg?.overlaySize ?? 30,
        overlayOpacity: currentBg?.overlayOpacity ?? 100
      });
    } catch { alert('画像の読み込みに失敗しました。'); }
  };

  // ── Background presets (save / apply / edit / delete) ──
  const slidesLinkedTo = (presetId: string | null) =>
    presetId ? slides.filter(s => s.background?.presetId === presetId).length : 0;

  const handleSaveCurrentAsPreset = () => {
    const bg = currentBg;
    if (!bg) { alert('先に背景を設定してください。'); return; }
    const id = `preset-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const count = (config.backgroundPresets || []).length + 1;
    const cleaned = { ...bg };
    delete (cleaned as any).presetId;
    const newPreset = { id, name: `背景プリセット ${count}`, background: { ...cleaned, presetId: id } };
    setConfig(prev => ({ ...prev, backgroundPresets: [...(prev.backgroundPresets || []), newPreset] }));
  };

  const handleRenamePreset = (presetId: string, name: string) => {
    setConfig(prev => ({
      ...prev,
      backgroundPresets: (prev.backgroundPresets || []).map(p => p.id === presetId ? { ...p, name } : p)
    }));
  };

  const handleDeletePreset = (presetId: string) => {
    setSlides(prev => prev.map(s =>
      s.background?.presetId === presetId ? { ...s, background: { ...s.background, presetId: undefined } } : s
    ));
    setConfig(prev => ({ ...prev, backgroundPresets: (prev.backgroundPresets || []).filter(p => p.id !== presetId) }));
    if (editingPresetId === presetId) { setEditingPresetId(null); setBgEditMode('slide'); }
  };

  const handleEditPreset = (presetId: string) => {
    setEditingPresetId(presetId);
    setBgEditMode('preset');
    setBgPanelTab('edit');
  };

  const handleApplyPresetToTargets = (presetId: string) => {
    const preset = (config.backgroundPresets || []).find(p => p.id === presetId);
    if (!preset) return;
    const targets = applyTargetIds.length ? applyTargetIds : (activeSlide ? [activeSlide.id] : []);
    if (!targets.length) { alert('適用先のスライドを選択してください。'); return; }
    setSlides(prev => prev.map(s =>
      targets.includes(s.id) ? { ...s, background: { ...preset.background, presetId } } : s
    ));
  };

  const handleApplyCurrentToTargets = () => {
    const bg = activeSlide?.background;
    if (!bg) { alert('このスライドに背景が設定されていません。'); return; }
    if (!applyTargetIds.length) { alert('適用先のスライドを選択してください。'); return; }
    const copy = { ...bg };
    delete (copy as any).presetId;
    setSlides(prev => prev.map(s => applyTargetIds.includes(s.id) ? { ...s, background: { ...copy } } : s));
  };

  const toggleApplyTarget = (id: string) => {
    setApplyTargetIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Parse a "x% y%" CSS background-position into numbers (fallback 50/50)
  const parseBgPos = (pos?: string) => {
    const m = (pos || '').match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 50 };
  };
  const parseBgSize = (size?: string) => {
    const m = (size || '').match(/(\d+(?:\.\d+)?)%/);
    return m ? parseFloat(m[1]) : 100;
  };

  const getSlideTypeName = (type: SlideType) => {
    switch (type) {
      case 'title': return '表紙タイトル';
      case 'vision': return '企業ビジョン';
      case 'toc': return '目次インデックス';
      case 'staff': return 'メンバー紹介';
      case 'financial_past3': return '決算報告-3期';
      case 'financial_monthly': return '決算: 月次売上推移';
      case 'financial_summary': return '決算: 予想＆総括';
      case 'project_list': return 'プロジェクト一覧';
      case 'project_detail': return 'プロジェクト詳細';
      case 'future_initiatives': return '今後の取り組み詳細';
      case 'announcements': return '日程・お知らせ';
      default: return 'スライド';
    }
  };

  const activeTheme = getThemeColorClasses(config.themeColor);
  const activeBgStyle = activeSlide?.background || config.globalBackground;

  // Unsplash high quality slide design backgrounds presets for rapid assignment
  const PRESET_BACKGROUND_IMAGES = [
    { title: 'Cosmic Tech Deep', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200' },
    { title: 'Executive Modern Board', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200' },
    { title: 'Calming Nature', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200' },
    { title: 'Neon Cyberpunk Lab', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200' },
  ];

  return (
    <div className="h-screen overflow-hidden bg-slate-950 flex flex-col font-sans select-none text-slate-100">

      {/* 入力欄プレースホルダーの色をここに同梱（index.css の反映が不安定でも確実に効くように）。
          明るい背景のスライド＝濃いグレー、暗い背景（.ph-dark）＝白系。 */}
      <style>{`
        input::placeholder, textarea::placeholder { color: #334155 !important; opacity: 1 !important; }
        .ph-dark input::placeholder, .ph-dark textarea::placeholder { color: rgba(255,255,255,0.92) !important; }
      `}</style>

      {/* ────────────────────────────────────────── HEADER BAR ────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-lg">
        
        {/* App Logo & Context */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
            <span className="text-xl font-bold font-display">会</span>
          </div>
          <div>
            <h1 className="text-sm font-black font-display tracking-wider">BOARDROOM MEETING BUILDER</h1>
            <p className="text-[10px] text-slate-400 font-mono">
              {currentDeckName
                ? <>編集中: <span className="text-emerald-400 font-bold">{currentDeckName}</span></>
                : '社内全体会議資料作成 ＆ プレゼン環境'}
            </p>
          </div>
        </div>

        {/* Global Deck Settings and Imports */}
        <div className="hidden lg:flex items-center space-x-6">
          
          {/* Company Name editor */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 px-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-indigo-400 font-mono">COMPANY:</span>
            <input
              type="text"
              id="globalCompanyNameInput"
              className="bg-transparent font-medium text-xs text-white outline-none w-48 border-0"
              value={config.companyName}
              onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="会社・グループ組織名"
            />
          </div>

          {/* Theme Color Picker */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 px-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-indigo-400 font-mono mr-1">THEME:</span>
            {(['slate', 'indigo', 'emerald', 'amber', 'rose', 'sky', 'violet'] as const).map(color => (
              <button
                key={color}
                id={`theme-${color}`}
                onClick={() => setConfig(prev => ({ ...prev, themeColor: color }))}
                className={`w-4.5 h-4.5 rounded-full border transform hover:scale-110 active:scale-95 transition ${
                  color === 'indigo' ? 'bg-indigo-600' :
                  color === 'emerald' ? 'bg-emerald-600' :
                  color === 'amber' ? 'bg-amber-500' :
                  color === 'rose' ? 'bg-rose-600' :
                  color === 'sky' ? 'bg-sky-500' :
                  color === 'violet' ? 'bg-violet-600' :
                  'bg-slate-700'
                } ${config.themeColor === color ? 'border-white scale-110 ring-2 ring-indigo-500/40' : 'border-transparent'}`}
                title={`テーマ: ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Quick Commands Bar (Export/Import/Play) */}
        <div className="flex items-center space-x-3">

          {/* Deck controls: new / overwrite-save / save-as / library dropdown */}
          <button
            id="new-deck-btn"
            onClick={handleNewDeck}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer"
            title="新しい空のスライドを作成（未保存の内容は確認します）"
          >
            <FilePlus className="w-4 h-4" />
            <span>新規</span>
          </button>

          <button
            id="save-deck-btn"
            onClick={handleSaveDeck}
            disabled={!currentDeckId}
            className={`flex items-center space-x-1.5 bg-emerald-950/30 text-emerald-300 border border-emerald-800/40 font-bold text-xs py-2 px-3 rounded-xl transition ${currentDeckId ? 'hover:bg-emerald-900/40 hover:border-emerald-500 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
            title={currentDeckId ? '現在のデッキに上書き保存します' : 'まだ保存されていません。「別名保存」で保存してください'}
          >
            <Save className="w-4 h-4" />
            <span>上書き保存</span>
          </button>

          <button
            id="saveas-deck-btn"
            onClick={handleSaveAsNewDeck}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer"
            title="新しい名前を付けて別のデッキとして保存します"
          >
            <Copy className="w-4 h-4" />
            <span>別名保存</span>
          </button>

          {/* Library dropdown (list / switch / rename / delete) */}
          <div className="relative" ref={libraryMenuRef}>
            <button
              id="open-library-btn"
              onClick={() => { if (!showLibrary) refreshDeckList(); setShowLibrary((v) => !v); }}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer"
              title="保存したスライドを一覧から呼び出す・名前変更・削除"
            >
              <FolderOpen className="w-4 h-4" />
              <span>ライブラリ</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLibrary ? 'rotate-180' : ''}`} />
            </button>

            {showLibrary && (
              <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2">
                <div className="px-2 py-1.5 text-[11px] text-slate-500 font-mono">保存済みスライド（{savedDecks.length}）</div>
                {savedDecks.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-6 px-2 leading-relaxed">
                    保存されたスライドはありません。<br />「別名保存」から追加できます。
                  </div>
                ) : (
                  savedDecks.map((rec) => (
                    <div
                      key={rec.id}
                      className={`group flex items-center justify-between px-2 py-2 rounded-lg ${currentDeckId === rec.id ? 'bg-indigo-950/40' : 'hover:bg-slate-800'}`}
                    >
                      <button
                        onClick={() => handleLoadDeck(rec)}
                        className="min-w-0 flex-1 text-left mr-2 cursor-pointer"
                        title="このスライドに切り替え"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{rec.name}</span>
                          {currentDeckId === rec.id && (
                            <span className="text-[8px] bg-indigo-600 text-white px-1 py-0.5 rounded font-bold shrink-0">編集中</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{rec.slideCount}枚 ・ {new Date(rec.updatedAt).toLocaleDateString('ja-JP')}</div>
                      </button>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => handleRenameDeck(rec)} title="名前を変更" className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 cursor-pointer"><Settings className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteDeck(rec)} title="削除" className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          {/* F5-style Playback launch trigger */}
          <button
            id="start-presentation-btn"
            onClick={enterPresentation}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 font-bold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer text-white shadow-indigo-600/20 active:scale-98 transition duration-200"
            title="プレゼンテーションを全画面再生"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>再生する (F5)</span>
          </button>

          {/* Import / Export actions */}
          <div className="h-6 w-px bg-slate-800"></div>
          
          <button
            id="export-pdf-btn"
            onClick={() => handleExportDocs('pdf')}
            className="flex items-center space-x-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500 font-bold text-xs py-2 px-3 rounded-xl transition duration-150 cursor-pointer"
            title="全スライドをPDFファイルとして高解像度一括エクスポート"
          >
            <FileText className="w-4 h-4 text-red-500" />
            <span>PDF出力</span>
          </button>

          <button
            id="export-pptx-btn"
            onClick={() => handleExportDocs('pptx')}
            className="flex items-center space-x-1.5 bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-400 hover:text-indigo-300 border border-indigo-900/30 hover:border-indigo-500 font-bold text-xs py-2 px-3 rounded-xl transition duration-150 cursor-pointer"
            title="全スライドをKeynote/PowerPoint (PPTX) 形式でフルカラー書き出し"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>PPTX出力</span>
          </button>

          <div className="h-6 w-px bg-slate-800"></div>
          
          <button
            id="export-json-btn"
            onClick={handleExportJSON}
            className="bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 rounded-lg border border-slate-700 block transition"
            title="スライドデータをJSONファイルとしてダウンロード（バックアップ・引き継ぎ用）"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            id="import-json-btn"
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 rounded-lg border border-slate-700 block transition"
            title="保存したスライドJSONファイルを読み込んで復元"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          <button
            id="reset-template-btn"
            onClick={handleResetToDefault}
            className="bg-slate-800 hover:bg-slate-700 p-2 text-amber-500 hover:text-amber-400 rounded-lg border border-slate-700 block transition"
            title="初期サンプル資料へ初期化"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────── MAIN WORKSPACE ────────────────────────────────────────── */}
      <div className="flex-grow min-h-0 flex overflow-hidden">

        {/* 1. LEFT SIDEBAR: Slide sequence manager */}
        <aside className="bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-full overflow-hidden" style={{ width: `clamp(180px, ${sidebarWidth}px, 42vw)` }}>

          {/* Sidebar title */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-black font-display tracking-widest text-slate-400 uppercase">SLIDES SEQUENCE ({slides.length})</span>
            <span className="text-[10px] bg-slate-950 font-mono text-indigo-400 border border-indigo-500/25 py-0.5 px-2 rounded-full">
              LOCALPERSIST
            </span>
          </div>

          {/* Scrollable list card representation of slides (resizable height, scales with window) */}
          <div className="overflow-y-auto p-4 space-y-3 shrink-0" style={{ height: `min(${listHeight}px, 58vh)` }}>
            {slides.map((slide, index) => {
              const active = slide.id === selectedSlideId;
              const displayIndex = String(index + 1).padStart(2, '0');

              return (
                <div
                  key={slide.id}
                  id={`slide-card-${slide.id}`}
                  draggable
                  onClick={() => setSelectedSlideId(slide.id)}
                  onDragStart={(e) => {
                    dragIndexRef.current = index;
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverIndex !== index) setDragOverIndex(index);
                  }}
                  onDragLeave={() => {
                    if (dragOverIndex === index) setDragOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndexRef.current !== null) {
                      handleReorderSlides(dragIndexRef.current, index);
                    }
                    dragIndexRef.current = null;
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    dragIndexRef.current = null;
                    setDragOverIndex(null);
                  }}
                  className={`p-3 rounded-xl cursor-pointer border relative group transform transition ${
                    active
                      ? 'bg-indigo-900/20 border-indigo-500 ring-2 ring-indigo-500/25 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-950 hover:border-slate-700'
                  } ${
                    dragOverIndex === index && dragIndexRef.current !== null && dragIndexRef.current !== index
                      ? 'ring-2 ring-indigo-400/70 border-indigo-400'
                      : ''
                  }`}
                >
                  {/* Left slide number badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0" />
                      <span className={`text-xs font-mono font-black ${active ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {displayIndex}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 truncate max-w-32 uppercase font-mono">
                        {slide.type}
                      </span>
                    </div>

                    {/* Slide actions: duplicate / delete (appear on hover) */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition duration-150">
                      <button
                        id={`duplicate-btn-${slide.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateSlide(slide.id);
                        }}
                        className="p-0.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-indigo-500/10 transition"
                        title="このスライドを複製"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-btn-${slide.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide(slide.id);
                        }}
                        className="p-0.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-500/10 transition"
                        title="このスライドを削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Slide Main Editable Title */}
                  <div className="pr-6">
                    <input
                      type="text"
                      className="bg-transparent text-xs font-semibold text-white w-full border-b border-transparent focus:border-indigo-500 outline-none py-0.5"
                      value={slide.title}
                      onChange={(e) => handleUpdateSlideField(slide.id, 'title', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Interstitial description separator selector toggle checkbox */}
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <label
                      className="flex items-center space-x-1 text-[9px] text-slate-400 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                        checked={slide.showInterstitial}
                        onChange={(e) => handleUpdateSlideField(slide.id, 'showInterstitial', e.target.checked)}
                      />
                      <span>【区切り間仕切り】を挿入</span>
                    </label>

                    {slide.showInterstitial && (
                      <input
                        type="text"
                        className="bg-transparent text-[8.5px] font-mono text-indigo-400 outline-none w-20 text-right border-b border-transparent focus:border-indigo-600"
                        value={slide.interstitialSubtitle}
                        placeholder="CHAPTER"
                        onChange={(e) => handleUpdateSlideField(slide.id, 'interstitialSubtitle', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drag handle to resize the slide-list height */}
          <div
            onMouseDown={startListResize}
            className="h-3 shrink-0 cursor-row-resize flex items-center justify-center group border-y border-slate-800/60 bg-slate-900"
            title="ドラッグでスライド一覧の高さを調整"
          >
            <div className="w-10 h-1 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition" />
          </div>

          {/* Spacer keeps the add section pinned to the bottom and always visible */}
          <div className="flex-1 min-h-0" />

          {/* Dropdown container to insert different types of pages */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-2 shrink-0">
            <span className="text-[10px] font-black font-display tracking-widest text-slate-500 block mb-1">
              ＋ 各種スライドを新規追加する
            </span>
            
            <div className="grid grid-cols-2 gap-1.5 text-left text-[11px]">
              <button
                id="add-title-slide"
                onClick={() => handleAddSlide('title')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">表紙ページ</span>
              </button>

              <button
                id="add-vision-slide"
                onClick={() => handleAddSlide('vision')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">企業ビジョン</span>
              </button>

              <button
                id="add-toc-slide"
                onClick={() => handleAddSlide('toc')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">目次インデックス</span>
              </button>

              <button
                id="add-staff-slide"
                onClick={() => handleAddSlide('staff')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">チーム紹介</span>
              </button>

              <button
                id="add-past3-slide"
                onClick={() => handleAddSlide('financial_past3')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">決算報告-3期</span>
              </button>

              <button
                id="add-monthly-slide"
                onClick={() => handleAddSlide('financial_monthly')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">今期月次売上</span>
              </button>

              <button
                id="add-summary-slide"
                onClick={() => handleAddSlide('financial_summary')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">予想・総括</span>
              </button>

              <button
                id="add-timeline-slide"
                onClick={() => handleAddSlide('project_list')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate">プロジェクト一覧</span>
              </button>

              <button
                id="add-detail-slide"
                onClick={() => handleAddSlide('project_detail')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate">詳細(マルチ可)</span>
              </button>

              <button
                id="add-initiatives-slide"
                onClick={() => handleAddSlide('future_initiatives')}
                className="flex items-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate">今後の取り組み</span>
              </button>

              <button
                id="add-announcements-slide"
                onClick={() => handleAddSlide('announcements')}
                className="flex items-center col-span-2 space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition justify-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>お知らせ・日程ページ</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Sidebar width resize handle (drag left/right; the editor area shrinks/grows) */}
        <div
          onMouseDown={startSidebarResize}
          className="w-1.5 shrink-0 cursor-col-resize bg-slate-800 hover:bg-indigo-500 transition group relative"
          title="ドラッグで左サイドバーの幅を調整"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* 2. CENTRAL WORKING AREA AND CANVASES */}
        <main className="flex-grow min-h-0 flex flex-col overflow-hidden bg-slate-950 px-4 py-2 relative">

          {/* Quick Toolbar above Canvas board — split into "slide" group and "common features" group */}
          <div className="flex items-center justify-between gap-3 mb-2 shrink-0 bg-slate-900 border border-slate-800 p-2 rounded-xl">

            {/* ── スライド（このスライド固有）グループ ── */}
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="text-[9px] font-bold tracking-wider text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded shrink-0">スライド</span>
              <span className="text-slate-400 shrink-0 hidden sm:inline">選択中:</span>
              <span className="font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg truncate">
                {activeSlide ? getSlideTypeName(activeSlide.type) : '未選択'}
              </span>
              <span className="text-slate-500 font-mono text-[10px] shrink-0 hidden lg:inline">
                Type ID: {activeSlide?.type}
              </span>
            </div>

            {/* ── 共通機能（全スライド共通）グループ ── */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-bold tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded shrink-0">共通機能</span>

              {/* 文字サイズ：複数選択してまとめて変更 */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1.5 py-1 text-[11px]">
                <span className="text-slate-400 shrink-0 hidden md:inline">文字サイズ</span>
                <button
                  onClick={() => { setFontMultiMode(m => !m); setFontMultiKeys([]); }}
                  className={`px-2 py-0.5 rounded transition ${fontMultiMode ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
                  title="複数の入力欄を選んでまとめて文字サイズを変更"
                >
                  複数選択{fontMultiMode ? `中(${fontMultiKeys.length})` : ''}
                </button>
                {fontMultiMode && (
                  <>
                    <button onClick={() => fontApiRef.current?.adjust(-2)} disabled={!fontMultiKeys.length} className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 font-bold text-base leading-none" title="小さく">－</button>
                    <button onClick={() => fontApiRef.current?.adjust(2)} disabled={!fontMultiKeys.length} className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 font-bold text-base leading-none" title="大きく">＋</button>
                    <button onClick={() => fontApiRef.current?.reset()} disabled={!fontMultiKeys.length} className="px-2 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-[10px]" title="標準に戻す">リセット</button>
                  </>
                )}
              </div>

              {/* 背景を編集する */}
              <button
                id="toggle-bg-settings-btn"
                onClick={() => {
                  setBgEditMode('slide');
                  setEditingPresetId(null);
                  setShowBgConfig(!showBgConfig);
                }}
                className={`flex items-center space-x-1.5 text-xs py-1.5 px-3 rounded-lg border transition ${
                  showBgConfig
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="背景を設定・編集（全スライド共通の機能）"
              >
                <Sliders className="w-4 h-4" />
                <span>背景を編集する</span>
              </button>

              {/* Edit the preset this slide is linked to (batch edit applied slides) */}
              {activeSlide?.background?.presetId && (config.backgroundPresets || []).some(p => p.id === activeSlide.background?.presetId) && (
                <button
                  id="edit-applied-bg-btn"
                  onClick={() => {
                    handleEditPreset(activeSlide.background!.presetId!);
                    setShowBgConfig(true);
                  }}
                  className="flex items-center space-x-1.5 text-xs py-1.5 px-3 rounded-lg border border-amber-600/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition"
                  title="このスライドに適用されたプリセット背景をまとめて編集"
                >
                  <Layers className="w-4 h-4" />
                  <span>適用された背景を編集</span>
                </button>
              )}
            </div>
          </div>

          {/* Floating Slide Background Customizer Inspector panel */}
          {showBgConfig && (activeSlide || bgEditMode === 'preset') && (() => {
            const baseType = currentBg?.type;
            const pos = parseBgPos(currentBg?.position);
            const sizePct = parseBgSize(currentBg?.size);
            const isCover = !currentBg?.size || currentBg?.size === 'cover';
            return (
            <div className="absolute top-20 right-10 w-[380px] max-h-[80vh] overflow-y-auto bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-2xl z-30 space-y-4 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
              <input ref={bgBaseFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleUploadBaseImage(e.target.files?.[0]); e.target.value = ''; }} />
              <input ref={bgOverlayFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleUploadOverlayImage(e.target.files?.[0]); e.target.value = ''; }} />

              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="font-bold text-white text-sm">背景の設定・編集</span>
                  <div className="text-[10px] mt-0.5">
                    {bgEditMode === 'preset'
                      ? <span className="text-amber-400">対象: プリセット「{editingPreset?.name}」（{slidesLinkedTo(editingPresetId)}枚に連動）</span>
                      : <span className="text-slate-400">対象: このスライド</span>}
                  </div>
                </div>
                <button onClick={() => setShowBgConfig(false)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bgEditMode === 'preset' && (
                <button onClick={() => { setBgEditMode('slide'); setEditingPresetId(null); }} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-1.5 text-[11px]">← このスライドの編集に戻る</button>
              )}

              {bgEditMode === 'slide' && (
                <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg">
                  <span className="text-slate-400 text-[10px]">全体設定の背景へ統一する</span>
                  <button onClick={() => { updateSlideBg(null); }} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded text-[10px] transition">適用を解除</button>
                </div>
              )}

              {/* Tab switch: edit vs presets (clear screen change) */}
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg">
                <button onClick={() => setBgPanelTab('edit')} className={`py-1.5 rounded-md text-[11px] font-semibold transition ${bgPanelTab === 'edit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>背景を編集</button>
                <button onClick={() => setBgPanelTab('presets')} className={`py-1.5 rounded-md text-[11px] font-semibold transition ${bgPanelTab === 'presets' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>プリセット ({(config.backgroundPresets || []).length})</button>
              </div>

              {bgPanelTab === 'edit' && (<>
              {/* BASE LAYER */}
              <div className="space-y-3">
                <span className="font-semibold text-slate-300 block pb-1 border-b border-slate-800/45">ベース背景</span>

                {/* Thumbnail of the base background currently in use */}
                <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-lg">
                  <span className="text-slate-500 text-[10px] shrink-0">使用中:</span>
                  <span
                    className="w-12 h-7 rounded border border-slate-700 shrink-0 overflow-hidden bg-center bg-cover"
                    style={
                      baseType === 'solid' ? { backgroundColor: currentBg?.value } :
                      baseType === 'gradient' ? { backgroundImage: currentBg?.value } :
                      baseType === 'image' ? { backgroundImage: `url("${currentBg?.value}")` } :
                      { backgroundColor: '#0f172a' }
                    }
                  />
                  <span className="text-slate-400 text-[10px] truncate">
                    {baseType === 'image' ? '画像' : baseType === 'gradient' ? 'グラデーション' : baseType === 'solid' ? '単色' : '全体設定の背景'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 w-16">単色:</span>
                  <input type="color" value={baseType === 'solid' ? (currentBg?.value || '#ffffff') : '#ffffff'} onChange={(e) => patchBg({ type: 'solid', value: e.target.value })} className="w-10 h-6 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
                  <input type="text" value={baseType === 'solid' ? (currentBg?.value || '') : ''} onChange={(e) => patchBg({ type: 'solid', value: e.target.value })} placeholder="#ffffff" className="bg-slate-950 border border-slate-800 text-white rounded px-2 py-0.5 w-24 text-[11px] font-mono" />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
                  <span className="text-slate-500">背景画像:</span>
                  <div className="flex space-x-1.5">
                    <input type="text" className="bg-slate-950 border border-slate-800 text-white rounded p-1.5 flex-grow font-mono text-[10px]" value={baseType === 'image' && !(currentBg?.value || '').startsWith('data:') ? (currentBg?.value || '') : ''} onChange={(e) => patchBg({ type: 'image', value: e.target.value })} placeholder="画像URL" />
                    <button onClick={() => bgBaseFileRef.current?.click()} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2 text-[10px] shrink-0"><UploadIcon className="w-3 h-3" />アップロード</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_BACKGROUND_IMAGES.map((preset, idx) => (
                      <button key={idx} onClick={() => patchBg({ type: 'image', value: preset.url })} className="p-1 px-1.5 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-left truncate text-[9.5px] text-slate-400 hover:text-white" title={preset.title}>🌄 {preset.title}</button>
                    ))}
                  </div>

                  {baseType === 'image' && (
                    <div className="space-y-2.5 pt-2 mt-1 border-t border-slate-800/40 bg-slate-950/25 p-2 rounded-lg">
                      <span className="font-semibold text-slate-300 block">画像の位置・サイズ（シークバー）</span>
                      <div>
                        <div className="flex justify-between text-slate-500 text-[10px]"><span>横位置 X</span><span className="text-indigo-400 font-mono">{pos.x}%</span></div>
                        <input type="range" min="0" max="100" step="1" value={pos.x} onChange={(e) => patchBg({ position: `${e.target.value}% ${pos.y}%` })} className="w-full accent-indigo-500 h-1.5 cursor-pointer" />
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-500 text-[10px]"><span>縦位置 Y</span><span className="text-indigo-400 font-mono">{pos.y}%</span></div>
                        <input type="range" min="0" max="100" step="1" value={pos.y} onChange={(e) => patchBg({ position: `${pos.x}% ${e.target.value}%` })} className="w-full accent-indigo-500 h-1.5 cursor-pointer" />
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-500 text-[10px]"><span>サイズ</span><span className="text-indigo-400 font-mono">{isCover ? 'COVER' : `${sizePct}%`}</span></div>
                        <input type="range" min="50" max="300" step="5" value={isCover ? 100 : sizePct} onChange={(e) => patchBg({ size: `${e.target.value}%` })} className="w-full accent-indigo-500 h-1.5 cursor-pointer" />
                        <button onClick={() => patchBg({ size: 'cover' })} className={`mt-1 text-[9px] px-2 py-0.5 rounded border ${isCover ? 'bg-indigo-600/40 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>全体に合わせる (Cover)</button>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-500 text-[10px]"><span>暗さフィルター</span><span className="text-indigo-400 font-mono">{currentBg?.opacity !== undefined ? currentBg.opacity : 40}%</span></div>
                        <input type="range" min="0" max="95" step="5" value={currentBg?.opacity !== undefined ? currentBg.opacity : 40} onChange={(e) => patchBg({ opacity: parseInt(e.target.value) })} className="w-full accent-indigo-500 h-1.5 cursor-pointer" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
                  <span className="text-slate-500 block">グラデーション:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { v: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)', label: '🌌 藍紫コスモス', cls: 'border-indigo-700/50 text-indigo-300' },
                      { v: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', label: '🎛 暗黒メタル', cls: 'border-slate-700 text-slate-300' },
                      { v: 'linear-gradient(135deg, #062f4f 0%, #000000 100%)', label: '🖥️ 深海ブルー', cls: 'border-slate-800 text-slate-400' },
                      { v: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', label: '🤍 クリーンホワイト', cls: 'border-slate-300 text-slate-800' }
                    ].map((g, i) => (
                      <button key={i} onClick={() => patchBg({ type: 'gradient', value: g.v })} className={`p-1.5 text-[10px] rounded text-left border ${g.cls}`} style={{ backgroundImage: g.v }}>{g.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* OVERLAY LAYER */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-semibold text-slate-300 block">重ねる画像</span>

                {/* Thumbnail of the overlay image currently in use (default = triangle mark on the title slide) */}
                <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-lg">
                  <span className="text-slate-500 text-[10px] shrink-0">使用中:</span>
                  <span className="w-12 h-7 rounded border border-slate-700 shrink-0 overflow-hidden flex items-center justify-center bg-white">
                    {currentBg?.overlayImage ? (
                      <img src={currentBg.overlayImage} alt="" className="w-full h-full object-contain" />
                    ) : (bgEditMode === 'slide' && activeSlide?.type === 'title') ? (
                      <svg viewBox="0 0 240 210" className="w-6 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="18" strokeLinejoin="round" strokeLinecap="round">
                        <path d="M120 38 L208 182 L32 182 Z" />
                        <path d="M120 92 L172 178 L68 178 Z" />
                        <circle cx="206" cy="46" r="14" fill="currentColor" stroke="none" />
                      </svg>
                    ) : (
                      <span className="text-slate-300 text-[8px]">なし</span>
                    )}
                  </span>
                  <span className="text-slate-400 text-[10px] truncate">
                    {currentBg?.overlayImage ? '設定済みの画像' : (bgEditMode === 'slide' && activeSlide?.type === 'title') ? '既定のロゴ（三角マーク）' : '未設定'}
                  </span>
                </div>

                <div className="flex space-x-1.5">
                  <input type="text" className="bg-slate-950 border border-slate-800 text-white rounded p-1.5 flex-grow font-mono text-[10px]" value={(currentBg?.overlayImage || '').startsWith('data:') ? '' : (currentBg?.overlayImage || '')} onChange={(e) => patchBg({ overlayImage: e.target.value, overlayX: currentBg?.overlayX ?? 80, overlayY: currentBg?.overlayY ?? 28, overlaySize: currentBg?.overlaySize ?? 30, overlayOpacity: currentBg?.overlayOpacity ?? 100 })} placeholder="ロゴ画像URL" />
                  <button onClick={() => bgOverlayFileRef.current?.click()} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2 text-[10px] shrink-0"><UploadIcon className="w-3 h-3" />アップロード</button>
                  {currentBg?.overlayImage && (
                    <button onClick={() => patchBg({ overlayImage: '' })} className="bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 rounded px-2 text-[10px] shrink-0">クリア</button>
                  )}
                </div>
                {currentBg?.overlayImage && (
                  <div className="space-y-2.5 pt-1 bg-slate-950/25 p-2 rounded-lg">
                    <div>
                      <div className="flex justify-between text-slate-500 text-[10px]"><span>横位置 X</span><span className="text-indigo-400 font-mono">{currentBg?.overlayX ?? 80}%</span></div>
                      <input type="range" min="0" max="100" step="1" value={currentBg?.overlayX ?? 80} onChange={(e) => patchBg({ overlayX: parseInt(e.target.value) })} className="w-full accent-indigo-500 h-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-500 text-[10px]"><span>縦位置 Y</span><span className="text-indigo-400 font-mono">{currentBg?.overlayY ?? 28}%</span></div>
                      <input type="range" min="0" max="100" step="1" value={currentBg?.overlayY ?? 28} onChange={(e) => patchBg({ overlayY: parseInt(e.target.value) })} className="w-full accent-indigo-500 h-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-500 text-[10px]"><span>サイズ</span><span className="text-indigo-400 font-mono">{currentBg?.overlaySize ?? 30}%</span></div>
                      <input type="range" min="5" max="100" step="1" value={currentBg?.overlaySize ?? 30} onChange={(e) => patchBg({ overlaySize: parseInt(e.target.value) })} className="w-full accent-indigo-500 h-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-500 text-[10px]"><span>透明度</span><span className="text-indigo-400 font-mono">{currentBg?.overlayOpacity ?? 100}%</span></div>
                      <input type="range" min="10" max="100" step="5" value={currentBg?.overlayOpacity ?? 100} onChange={(e) => patchBg({ overlayOpacity: parseInt(e.target.value) })} className="w-full accent-indigo-500 h-1.5 cursor-pointer" />
                    </div>
                  </div>
                )}
              </div>
              </>)}

              {/* PRESETS & APPLY */}
              {bgPanelTab === 'presets' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">背景プリセット</span>
                  <button onClick={handleSaveCurrentAsPreset} className="bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white px-2 py-1 rounded text-[10px]">＋ 現在の背景を保存</button>
                </div>

                {(config.backgroundPresets || []).length === 0 ? (
                  <p className="text-slate-600 text-[10px]">プリセットはまだありません。背景を設定して「現在の背景を保存」で作成できます。</p>
                ) : (
                  <div className="space-y-1.5">
                    {(config.backgroundPresets || []).map((p) => (
                      <div key={p.id} className={`flex items-center gap-1.5 bg-slate-950 border rounded-lg p-1.5 ${editingPresetId === p.id ? 'border-amber-500/60' : 'border-slate-800'}`}>
                        <span className="w-5 h-5 rounded border border-slate-700 shrink-0" style={p.background.type === 'solid' ? { backgroundColor: p.background.value } : p.background.type === 'gradient' ? { backgroundImage: p.background.value } : { backgroundImage: `url(${p.background.value})`, backgroundSize: 'cover' }} />
                        <input value={p.name} onChange={(e) => handleRenamePreset(p.id, e.target.value)} className="bg-transparent text-white text-[11px] flex-grow min-w-0 outline-none border-b border-transparent focus:border-slate-600" />
                        <span className="text-slate-500 text-[9px] shrink-0">{slidesLinkedTo(p.id)}枚</span>
                        <button onClick={() => handleApplyPresetToTargets(p.id)} className="text-indigo-400 hover:text-white text-[10px] px-1 shrink-0" title="選択スライドに適用">適用</button>
                        <button onClick={() => handleEditPreset(p.id)} className="text-amber-400 hover:text-white text-[10px] px-1 shrink-0" title="このプリセットを編集">編集</button>
                        <button onClick={() => handleDeletePreset(p.id)} className="text-slate-500 hover:text-rose-400 text-[10px] px-1 shrink-0" title="削除">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 mt-1 border-t border-slate-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">適用先スライド（複数選択）</span>
                    <div className="flex gap-1">
                      <button onClick={() => setApplyTargetIds(slides.map(s => s.id))} className="text-[9px] text-slate-400 hover:text-white px-1">全選択</button>
                      <button onClick={() => setApplyTargetIds([])} className="text-[9px] text-slate-400 hover:text-white px-1">解除</button>
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-0.5 bg-slate-950 rounded-lg p-1.5 border border-slate-800">
                    {slides.map((s, i) => (
                      <label key={s.id} className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer hover:bg-slate-800/60 rounded px-1 py-0.5">
                        <input type="checkbox" checked={applyTargetIds.includes(s.id)} onChange={() => toggleApplyTarget(s.id)} className="w-3 h-3 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0" />
                        <span className="font-mono text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                        <span className="truncate">{s.title}</span>
                        {s.background?.presetId && <span className="ml-auto text-amber-400/70 text-[8px] shrink-0">連動</span>}
                      </label>
                    ))}
                  </div>
                  <button onClick={handleApplyCurrentToTargets} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg py-1.5 text-[10px]">選択スライドに「このスライドの背景」をコピー適用</button>
                </div>
              </div>
              )}
            </div>
            );
          })()}

          {/* Main Visual Slide Sandbox Editor canvas viewport */}
          <div className="flex-grow min-h-0 flex items-center justify-center relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-1.5 slide-glow shadow-inner">
            {activeSlide ? (
              // Aspect ratio constraint container (slides are standard 16:9 box ratio)
              <div className="w-full max-w-full max-h-full aspect-16/9 bg-slate-800 border border-slate-705/30 rounded-xl overflow-hidden shadow-2xl relative select-text transition hover:border-slate-600/40">
                
                {/* Visual indicator that this is editing in place */}
                <div className="absolute top-3 left-4 bg-slate-900/85 text-[9px] font-mono tracking-widest text-indigo-200 px-2 py-0.5 rounded border border-indigo-300/30 uppercase z-20 flex items-center space-x-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping"></span>
                  <span>Interactive Editor Mode（直接文字をタップして編集できます）</span>
                </div>

                {/* Master renderer call (guarded so a single bad slide doesn't blank the app) */}
                {/* key on the boundary so switching slides rebuilds it and clears a stale error state */}
                <ErrorBoundary key={activeSlide.id} compact>
                  <SlideRenderer
                    slide={activeSlide}
                    allSlides={slides}
                    isEditable={true}
                    onUpdateContent={(content) => handleUpdateSlideContent(activeSlide.id, content)}
                    globalBackground={config.globalBackground}
                    themeColor={config.themeColor}
                    fontMultiMode={fontMultiMode}
                    fontMultiKeys={fontMultiKeys}
                    onFontMultiKeysChange={setFontMultiKeys}
                    fontApiRef={fontApiRef}
                  />
                </ErrorBoundary>
              </div>
            ) : (
              <div className="text-center py-20 min-h-64">
                <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-2 animate-bounce" />
                <p className="text-slate-400 font-medium">作成済みのスライドを選択するか、左メニューから追加してください。</p>
              </div>
            )}
          </div>

          {/* Quick instructions and helper details */}
          <div className="mt-2 flex flex-wrap justify-between items-center text-[10px] text-slate-400 px-2 shrink-0">
            <p>※ 全ての内容は自動セーブされ、ブラウザに保存されます。スライド上のテキストや数値を上書きすると、表組みやグラフの表示もその場で追従します。</p>
            <div className="flex space-x-4">
              <span>🔲 F5キーでプレゼン開始</span>
              <span>↔️ キー左右 / スペースで進行</span>
              <span>💾 JSON保存＆読み込み対応</span>
            </div>
          </div>
        </main>
      </div>

      {/* ────────────────────────────────────────── 3. FULL SCREEN PRESENTATION PORTAL (IF CLIKED) ────────────────────────────────────────── */}
      {isPreviewMode && previewSteps.length > 0 && (
        <div
          id="presentation-theatre-overlay"
          className="fixed inset-0 bg-slate-950 z-50 flex flex-col justify-between select-none p-6 md:p-12 animate-in fade-in zoom-in-95 duration-200"
          style={(() => {
            const step = previewSteps[currentStepIndex];
            const slide = slides.find(s => s.id === step.slideId);
            // Interstitial divider theme defaults to beautiful deep dark, but slide content can follow exact user customized background style!
            if (activeSlide && step.mode === 'content') {
              const exactSlide = slides.find(s => s.id === step.slideId);
              return getBgStyle(exactSlide?.background, config.globalBackground);
            }
            // For Interstitials, default to elegant global Indigo background theme
            return { backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #030712 100%)' };
          })()}
        >
          {/* Header layout: Esc closing instructions and slide path */}
          <header className="flex items-center justify-between text-xs backdrop-blur-sm bg-black/10 py-2.5 px-4 rounded-xl border border-white/5 mx-auto w-full max-w-7xl">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-indigo-400">{config.companyName || '全体方針発表'}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/80 font-medium">
                {previewSteps[currentStepIndex]?.mode === 'interstitial'
                  ? '【区切り扉絵】' + previewSteps[currentStepIndex].slideTitle
                  : previewSteps[currentStepIndex].slideTitle}
              </span>
            </div>

            {/* Steps Progress Percentage indicator pill */}
            <div className="flex items-center space-x-4">
              <span className="font-mono text-[11px] text-white/50">
                PAGES: {currentStepIndex + 1} / {previewSteps.length}
              </span>
              <button
                id="exit-presentation-btn"
                onClick={() => setIsPreviewMode(false)}
                className="flex items-center space-x-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10.5px] border border-white/10 transition cursor-pointer"
                title="編集モードに戻る"
              >
                <X className="w-3.5 h-3.5" />
                <span>終了する (ESC)</span>
              </button>
            </div>
          </header>

          {/* Central stage body */}
          <main className="flex-grow flex items-center justify-center max-w-7xl mx-auto w-full relative">
            
            {/* Step rendering branch */}
            {(() => {
              const step = previewSteps[currentStepIndex];
              const slide = slides.find(s => s.id === step.slideId);

              if (!slide) return <p className="text-white">スライドが見つかりません</p>;

              // A: If it's the interstitial break divider slide
              if (step.mode === 'interstitial') {
                return (
                  <div className="text-center space-y-6 max-w-3xl animate-in fade-in zoom-in-95 duration-500 py-12 px-6">
                    <span className="text-indigo-400 font-mono tracking-widest text-xs font-black bg-indigo-501/20 border border-indigo-400/20 px-4 py-1.5 rounded-full uppercase inline-block">
                      {step.subtitle || 'CHAPTER'}
                    </span>
                    <h2 className="text-white font-extrabold tracking-tight font-display text-4xl sm:text-6xl pt-4">
                      {step.slideTitle}
                    </h2>
                    <p className="text-slate-400 font-light text-base max-w-md mx-auto">
                      こちらより詳細な項目についてご説明します。
                    </p>
                    <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full mt-6"></div>
                  </div>
                );
              }

              // B: Render full normal slide components
              return (
                <div className="w-full h-full select-text py-4">
                  <SlideRenderer
                    slide={slide}
                    allSlides={slides}
                    isEditable={false}
                    globalBackground={config.globalBackground}
                    themeColor={config.themeColor}
                  />
                </div>
              );
            })()}
          </main>

          {/* Navigation drawer controls below */}
          <footer className="flex items-center justify-between font-mono text-xs text-white/50 backdrop-blur-sm bg-black/10 py-3 px-6 rounded-xl border border-white/5 mx-auto w-full max-w-7xl">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px]">TAP / SPACE / MOUSE CLICKS TO NAVIGATE</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="present-prev-btn"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className={`p-2 bg-white/5 hover:bg-white/15 rounded-lg border border-white/10 text-white transition cursor-pointer ${
                  currentStepIndex === 0 ? 'opacity-20 cursor-not-allowed' : ''
                }`}
                title="前のステップへ"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                id="present-next-btn"
                onClick={handleNextStep}
                disabled={currentStepIndex === previewSteps.length - 1}
                className={`p-2 bg-white/5 hover:bg-white/15 rounded-lg border border-white/10 text-white transition cursor-pointer ${
                  currentStepIndex === previewSteps.length - 1 ? 'opacity-20 cursor-not-allowed' : ''
                }`}
                title="次のステップへ"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* ────────────────────────────────────────── EXPORT HIDDEN RENDER STAGE ────────────────────────────────────────── */}
      {isExporting && (
        <div 
          id="export-hidden-container" 
          className="absolute"
          style={{ left: '-9999px', top: '-9999px', width: '1024px', zIndex: -100 }}
        >
          {getExportSteps().map((step, idx) => (
            <div
              key={`${step.slideId}-${step.mode}-${idx}`}
              id={`capture-step-${idx}`}
              className="relative overflow-hidden bg-slate-950 flex flex-col justify-between"
              style={{ 
                width: '1024px', 
                height: '576px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {step.mode === 'interstitial' ? (
                <div 
                  className="w-full h-full text-center flex flex-col items-center justify-center space-y-6 px-12 relative"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #030712 100%)',
                    width: '1024px',
                    height: '576px'
                  }}
                >
                  <span className="text-indigo-400 font-mono tracking-widest text-xs font-black bg-indigo-500/20 border border-indigo-400/20 px-4 py-1.5 rounded-full uppercase inline-block">
                    {step.subtitle || 'CHAPTER'}
                  </span>
                  <h2 className="text-white font-extrabold tracking-tight font-display text-5xl pt-4">
                    {step.title}
                  </h2>
                  <p className="text-slate-400 font-light text-sm max-w-md mx-auto">
                    こちらより詳細な項目についてご説明します。
                  </p>
                  <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full mt-6"></div>
                </div>
              ) : (
                <div style={{ width: '1024px', height: '576px' }} className="w-full h-full relative">
                  <SlideRenderer
                    slide={step.slide}
                    allSlides={slides}
                    isEditable={false}
                    globalBackground={config.globalBackground}
                    themeColor={config.themeColor}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ────────────────────────────────────────── EXPORT PROGRESS MODAL ────────────────────────────────────────── */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800/85 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-white text-lg font-sans">
                {exportType} 形式に書き出し中...
              </h3>
              <p className="text-slate-400 text-xs font-light tracking-wide leading-relaxed">
                スライドの高解像度レンダリングとデータ生成を行っています。ブラウザを閉じずにそのままお待ちください。
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                <span>進行状況:</span>
                <span className="text-indigo-400 font-bold">{exportProgress} / {exportTotal} ページ</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(exportProgress / (exportTotal || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 tracking-wider uppercase font-mono">
              boardroom presentation compiler v2.0
            </div>
          </div>
        </div>
      )}

    </div>
  );
}