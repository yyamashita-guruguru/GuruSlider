import React, { useState, useRef, useEffect } from 'react';
import { Slide, StaffMember, PastTermData, MonthlySalesData, ProjectListItem, SlideBackground } from '../types';
import * as Icons from 'lucide-react';
import { renderSlideBody } from './SlideTypes';

interface SlideRendererProps {
  slide: Slide;
  allSlides?: Slide[];
  isEditable?: boolean;
  onUpdateContent?: (updatedContent: any) => void;
  globalBackground?: SlideBackground;
  themeColor?: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  // Font multi-select is controlled from the App toolbar (common feature)
  fontMultiMode?: boolean;
  fontMultiKeys?: string[];
  onFontMultiKeysChange?: (keys: string[]) => void;
  fontApiRef?: React.MutableRefObject<any>;
}

// DynamicIcon now lives in ./SlideTypes (re-exported for compatibility)
export { DynamicIcon } from './SlideTypes';

export const getBgStyle = (bg?: SlideBackground, fallbackBg?: SlideBackground): React.CSSProperties => {
  const activeBg = bg || fallbackBg;
  if (!activeBg) return { backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' };
  
  if (activeBg.type === 'solid') {
    return { backgroundColor: activeBg.value };
  } else if (activeBg.type === 'gradient') {
    return { backgroundImage: activeBg.value };
  } else if (activeBg.type === 'image') {
    return {
      backgroundImage: `url("${activeBg.value}")`,
      backgroundSize: activeBg.size || 'cover',
      backgroundPosition: activeBg.position || 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  return {};
};

// Helper for theme styles
export const getThemeColorClasses = (theme?: string) => {
  switch (theme) {
    case 'indigo':
      return {
        bg: 'bg-indigo-600',
        text: 'text-indigo-600',
        border: 'border-indigo-600',
        bgLight: 'bg-indigo-50',
        accent: 'indigo'
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-600',
        text: 'text-emerald-600',
        border: 'border-emerald-600',
        bgLight: 'bg-emerald-50',
        accent: 'emerald'
      };
    case 'amber':
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-500',
        border: 'border-amber-500',
        bgLight: 'bg-amber-50',
        accent: 'amber'
      };
    case 'rose':
      return {
        bg: 'bg-rose-600',
        text: 'text-rose-600',
        border: 'border-rose-600',
        bgLight: 'bg-rose-50',
        accent: 'rose'
      };
    case 'sky':
      return {
        bg: 'bg-sky-500',
        text: 'text-sky-500',
        border: 'border-sky-500',
        bgLight: 'bg-sky-50',
        accent: 'sky'
      };
    case 'violet':
      return {
        bg: 'bg-violet-600',
        text: 'text-violet-600',
        border: 'border-violet-600',
        bgLight: 'bg-violet-50',
        accent: 'violet'
      };
    case 'slate':
    default:
      return {
        bg: 'bg-slate-800',
        text: 'text-slate-800',
        border: 'border-slate-800',
        bgLight: 'bg-slate-100',
        accent: 'slate'
      };
  }
};

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  allSlides = [],
  isEditable = false,
  onUpdateContent,
  globalBackground,
  themeColor = 'indigo',
  fontMultiMode = false,
  fontMultiKeys = [],
  onFontMultiKeysChange,
  fontApiRef
}) => {
  const theme = getThemeColorClasses(themeColor);
  const slideBg = slide.background || globalBackground;
  const isDarkBg = slideBg?.type === 'image' || (slideBg?.type === 'gradient' && (slideBg.value.includes('#1e1b4b') || slideBg.value.includes('#311042') || slideBg.value.includes('#062f4f') || slideBg.value.includes('#000000')));

  const textPrimaryClass = isDarkBg ? 'text-white' : 'text-slate-900';
  const textSecondaryClass = isDarkBg ? 'text-slate-300' : 'text-slate-600';
  const cardBgClass = isDarkBg ? 'bg-white/10 backdrop-blur-md border border-white/10' : 'bg-white shadow-sm border border-slate-100';

  // Helper value modifier
  const updateField = (key: string, val: any) => {
    if (onUpdateContent) {
      onUpdateContent({
        ...slide.content,
        [key]: val
      });
    }
  };

  // ───────────────────────── Per-field font size adjustment ─────────────────────────
  // Font-size overrides (px) are stored per field key in content._fontPx and applied
  // generically to every input/textarea via a container-level effect (no per-field wiring).
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fontPopover, setFontPopover] = useState<{ key: string; x: number; y: number } | null>(null);
  const fontPx: Record<string, number> = (slide.content && slide.content._fontPx) || {};

  // Data-driven font-size override for presentation/export elements.
  // Edit-mode inputs are still handled by the effect below (keyed by the input id),
  // so the SAME id string used here maps 1:1 to the stored size. Returns undefined
  // when there is no override, letting the element's default classes apply.
  const fkStyle = (key: string, extra?: React.CSSProperties): React.CSSProperties | undefined => {
    const px = fontPx[key];
    if (!px) return extra;
    return { ...(extra || {}), fontSize: px + 'px' };
  };

  // Tag every editable text field, apply stored sizes, and draw selection outlines.
  useEffect(() => {
    if (!isEditable) return;
    const c = contentRef.current;
    if (!c) return;
    try {
      const els = c.querySelectorAll('textarea, input[type="text"], input:not([type])');
      els.forEach((raw, i) => {
        const node = raw as HTMLElement;
        const key = node.id || ('fk-' + i);
        node.dataset.fontkey = key;
        const px = fontPx[key];
        if (px) node.style.fontSize = px + 'px';
        else node.style.removeProperty('font-size');
        if (fontMultiMode && fontMultiKeys.indexOf(key) !== -1) {
          node.style.outline = '2px solid #6366f1';
          node.style.outlineOffset = '1px';
        } else {
          node.style.removeProperty('outline');
          node.style.removeProperty('outline-offset');
        }
      });
    } catch (e) { /* non-fatal: font sizing is best-effort */ }
  });

  const persistFontPx = (updates: Record<string, number>) => {
    if (!onUpdateContent) return;
    onUpdateContent({ ...slide.content, _fontPx: { ...fontPx, ...updates } });
  };

  const adjustFontSize = (keys: string[], delta: number) => {
    const c = contentRef.current;
    const updates: Record<string, number> = {};
    keys.forEach((key) => {
      let cur = fontPx[key] || 16;
      if (c) {
        const el = c.querySelector('[data-fontkey="' + key + '"]') as HTMLElement | null;
        if (el) {
          const measured = parseFloat(getComputedStyle(el).fontSize);
          if (!isNaN(measured)) cur = measured;
        }
      }
      updates[key] = Math.min(120, Math.max(8, Math.round(cur + delta)));
    });
    if (Object.keys(updates).length) persistFontPx(updates);
  };

  const resetFontSize = (keys: string[]) => {
    if (!onUpdateContent) return;
    const next = { ...fontPx };
    keys.forEach((k) => { delete next[k]; });
    onUpdateContent({ ...slide.content, _fontPx: next });
  };

  // Expose adjust/reset for the selected fields so the App toolbar can drive them
  if (fontApiRef) {
    fontApiRef.current = {
      adjust: (delta: number) => adjustFontSize(fontMultiKeys, delta),
      reset: () => resetFontSize(fontMultiKeys),
    };
  }

  const handleFieldFocusCapture = (e: React.FocusEvent) => {
    if (!isEditable) return;
    const t = e.target as HTMLElement;
    if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
    const key = t.dataset.fontkey || t.id;
    if (!key) return;
    if (fontMultiMode) {
      // In multi-select mode, selection is toggled by click; focus does nothing here.
      return;
    }
    const w = wrapperRef.current;
    if (!w) return;
    const r = t.getBoundingClientRect();
    const cr = w.getBoundingClientRect();
    setFontPopover({ key, x: r.left - cr.left, y: r.top - cr.top });
  };

  // Safe parses for YouTube URLs to embedded formats
  const getEmbedVideoUrl = (url: string) => {
    if (!url) return '';
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const renderContent = () => renderSlideBody({
    slide, allSlides, isEditable, theme, isDarkBg,
    textPrimaryClass, textSecondaryClass, cardBgClass,
    updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl,
  });

  return (
    <div
      ref={wrapperRef}
      className={`w-full h-full relative font-sans overflow-hidden p-6 flex flex-col justify-between ${isDarkBg ? 'ph-dark' : 'ph-light'}`}
      style={getBgStyle(slide.background, globalBackground)}
    >
      {/* Background Graphic overlay for depth or image opacity overlay */}
      {slideBg?.type === 'gradient' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_40%)] pointer-events-none"></div>
      )}
      {slideBg?.type === 'image' && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: (slideBg.opacity !== undefined ? slideBg.opacity : 40) / 100 }}
        />
      )}

      {/* Overlay image layer (logo / decoration) on top of the base background */}
      {slideBg?.overlayImage ? (
        <img
          src={slideBg.overlayImage}
          alt=""
          crossOrigin="anonymous"
          className="absolute pointer-events-none object-contain -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${slideBg.overlayX !== undefined ? slideBg.overlayX : 50}%`,
            top: `${slideBg.overlayY !== undefined ? slideBg.overlayY : 50}%`,
            width: `${slideBg.overlaySize !== undefined ? slideBg.overlaySize : 40}%`,
            opacity: (slideBg.overlayOpacity !== undefined ? slideBg.overlayOpacity : 100) / 100,
          }}
        />
      ) : (
        slide.type === 'title' && (
          /* Default faint geometric watermark for the title slide when no overlay image is set */
          <div className="absolute right-8 top-14 text-slate-200 pointer-events-none">
            <svg viewBox="0 0 240 210" className="w-[400px] h-[350px]" fill="none" stroke="currentColor" strokeWidth="15" strokeLinejoin="round" strokeLinecap="round">
              <path d="M120 38 L208 182 L32 182 Z" />
              <path d="M120 92 L172 178 L68 178 Z" />
              <circle cx="206" cy="46" r="12" fill="currentColor" stroke="none" />
              <circle cx="233" cy="38" r="8" fill="currentColor" stroke="none" />
            </svg>
          </div>
        )
      )}

      {/* Actual Slide content box */}
      <div
        ref={contentRef}
        className="h-full w-full z-10 select-text flex flex-col justify-between"
        onFocusCapture={handleFieldFocusCapture}
        onClickCapture={(e) => {
          if (!isEditable || !fontMultiMode) return;
          const t = e.target as HTMLElement;
          if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
          const key = t.dataset.fontkey || t.id;
          if (!key || !onFontMultiKeysChange) return;
          onFontMultiKeysChange(fontMultiKeys.indexOf(key) !== -1 ? fontMultiKeys.filter((k) => k !== key) : [...fontMultiKeys, key]);
        }}
      >
        {renderContent()}
      </div>

      {/* Page number on every slide. The title slide already has its own, so skip it there.
          Color adapts to the background brightness. */}
      {slide.type !== 'title' && (() => {
        const _pi = allSlides.findIndex((s) => s.id === slide.id);
        const _pageNumber = _pi >= 0 ? _pi + 1 : 1;
        return (
          <div className={`absolute bottom-3 right-5 z-20 text-sm font-semibold pointer-events-none ${isDarkBg ? 'text-white/85' : 'text-slate-700'}`}>
            {_pageNumber}
          </div>
        );
      })()}

      {/* Hint shown while multi-select mode is active (control lives in the top toolbar) */}
      {isEditable && fontMultiMode && (
        <div className="absolute left-1.5 bottom-1.5 z-[60] bg-indigo-600/90 text-white rounded-lg px-2 py-1 text-[10px] shadow-lg pointer-events-none">
          文字サイズ：変更したい入力欄をクリックで選択（上のツールバーの＋／－で変更）
        </div>
      )}

      {/* Per-field popover (single field, appears near the clicked field) */}
      {isEditable && !fontMultiMode && fontPopover && (
        <div
          className="absolute z-[60] flex items-center gap-1 bg-slate-900 text-white rounded-lg border border-slate-700 px-1 py-0.5 text-[11px] shadow-xl"
          style={{ left: fontPopover.x, top: Math.max(0, fontPopover.y - 30) }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="text-slate-400 px-0.5">文字</span>
          <button onClick={() => adjustFontSize([fontPopover.key], -2)} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700">A－</button>
          <button onClick={() => adjustFontSize([fontPopover.key], 2)} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700">A＋</button>
          <button onClick={() => resetFontSize([fontPopover.key])} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700">リセット</button>
          <button onClick={() => setFontPopover(null)} className="px-1 py-0.5 rounded text-slate-400 hover:text-white">×</button>
        </div>
      )}
    </div>
  );
};