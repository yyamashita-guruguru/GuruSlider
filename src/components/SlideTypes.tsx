import React from 'react';
import * as Icons from 'lucide-react';
import { Slide, StaffMember, PastTermData, MonthlySalesData, ProjectListItem, SlideBackground } from '../types';

// Helper to render lucide-react icons dynamically by string name
export const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.HelpCircle className={className} />;
  return <IconComponent className={className} />;
};

// Shared render context passed from SlideRenderer to each per-type render function.
export interface SlideCtx {
  slide: Slide;
  allSlides: Slide[];
  isEditable: boolean;
  theme: any;
  isDarkBg: boolean;
  textPrimaryClass: string;
  textSecondaryClass: string;
  cardBgClass: string;
  updateField: (key: string, val: any) => void;
  fkStyle: (key: string, extra?: React.CSSProperties) => React.CSSProperties | undefined;
  getEmbedVideoUrl: (url: string) => string;
  isYouTubeUrl: (url: string) => boolean;
}

// ── title ──
export const TitleSlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const badgeLabel = slide.content.badgeLabel || (isEditable ? '' : '2026年度');
        const titleMain = slide.content.titleMain || (isEditable ? '' : 'タイトルを入力');
        const dateText = slide.content.dateText || (isEditable ? '' : '2026年 7月 3日');
        const companyName = slide.content.companyName || (isEditable ? '' : '株式会社ぐるぐる');
        const address = slide.content.address || (isEditable ? '' : '住所');
        const websiteUrl = slide.content.websiteUrl || (isEditable ? '' : 'https://example.com/');
        const badgeColor = slide.content.badgeColor || '#0f172a';
        const pageIdx = allSlides.findIndex(s => s.id === slide.id);
        const pageNumber = pageIdx >= 0 ? pageIdx + 1 : 1;

        return (
          <div className="relative h-full w-full select-none text-slate-900">
            <div className="relative z-10 h-full w-full flex flex-col px-6">
              {/* TOP: presentation date + rule */}
              <div className="pt-1">
                <div className="flex justify-end items-baseline gap-2 text-base md:text-lg font-bold tracking-wide">
                  <span>発表日：</span>
                  {isEditable ? (
                    <input
                      type="text"
                      id={`dateText-${slide.id}`}
                      className="text-right font-bold bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-900 w-56"
                      value={dateText}
                      onChange={(e) => updateField('dateText', e.target.value)}
                      placeholder="2026年 7月 3日"
                    />
                  ) : (
                    <span className="font-bold" style={fkStyle(`dateText-${slide.id}`)}>{dateText}</span>
                  )}
                </div>
                <div className="mt-2 border-t-2 border-slate-900" />
              </div>

              {/* MIDDLE: year badge + main title */}
              <div className="my-auto">
                <div className="inline-flex items-center gap-2 mb-5">
                  <div className="inline-flex px-5 py-1.5" style={{ backgroundColor: badgeColor }}>
                    {isEditable ? (
                      <input
                        type="text"
                        id={`badgeLabel-${slide.id}`}
                        className="bg-transparent text-white text-lg md:text-2xl font-bold tracking-wide outline-none w-40"
                        value={badgeLabel}
                        onChange={(e) => updateField('badgeLabel', e.target.value)}
                        placeholder="2026年度"
                      />
                    ) : (
                      <span className="text-white text-lg md:text-2xl font-bold tracking-wide" style={fkStyle(`badgeLabel-${slide.id}`)}>{badgeLabel}</span>
                    )}
                  </div>
                  {isEditable && (
                    <input
                      type="color"
                      value={badgeColor}
                      onChange={(e) => updateField('badgeColor', e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border border-slate-200 bg-white p-0.5"
                      title="バッジの下地の色を変更"
                    />
                  )}
                </div>

                {isEditable ? (
                  <textarea
                    id={`titleMain-${slide.id}`}
                    rows={1}
                    ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } }}
                    className="block w-full text-5xl md:text-7xl font-black tracking-tight leading-none resize-none overflow-hidden bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-slate-900"
                    value={titleMain}
                    onChange={(e) => updateField('titleMain', e.target.value)}
                    placeholder="タイトルを入力"
                  />
                ) : (
                  <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none" style={fkStyle(`titleMain-${slide.id}`)}>{titleMain}</h1>
                )}
              </div>

              {/* BOTTOM: contact block + thick rule + page number */}
              <div className="pb-1">
                <div className="border-t border-slate-300 mb-4" />
                <div className="flex items-end justify-between gap-6">
                  {/* Company name */}
                  <div className="text-lg md:text-2xl font-bold shrink-0">
                    {isEditable ? (
                      <input
                        type="text"
                        id={`companyName-${slide.id}`}
                        className="font-bold bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-900 w-72"
                        value={companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        placeholder="株式会社ぐるぐる"
                      />
                    ) : (
                      <span style={fkStyle(`companyName-${slide.id}`)}>{companyName}</span>
                    )}
                  </div>

                  {/* Address + website */}
                  <div className="space-y-1.5 text-xs md:text-sm text-slate-500 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <Icons.MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                      {isEditable ? (
                        <input
                          type="text"
                          id={`address-${slide.id}`}
                          className="bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-900 w-80 text-slate-500"
                          value={address}
                          onChange={(e) => updateField('address', e.target.value)}
                          placeholder="住所"
                        />
                      ) : (
                        <span style={fkStyle(`address-${slide.id}`)}>{address}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icons.Globe className="w-4 h-4 shrink-0 text-slate-400" />
                      {isEditable ? (
                        <input
                          type="text"
                          id={`websiteUrl-${slide.id}`}
                          className="bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-900 w-80 text-slate-500"
                          value={websiteUrl}
                          onChange={(e) => updateField('websiteUrl', e.target.value)}
                          placeholder="https://example.com/"
                        />
                      ) : (
                        <span style={fkStyle(`websiteUrl-${slide.id}`)}>{websiteUrl}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thick bottom rule + page number */}
                <div className="mt-4 border-t-4 border-double border-slate-900" />
                <div className="flex justify-end pt-1.5 text-sm font-semibold text-slate-700">{pageNumber}</div>
              </div>
            </div>
          </div>
        );
};

// ── title_only ──
export const TitleOnlySlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const titleMain = slide.content.titleMain || slide.title || '重要テーマ / 目標';
        const subtitle = slide.content.subtitle || (isEditable ? '' : 'サブタイトル');

        return (
          <div className="flex flex-col items-center justify-center h-full py-16 px-12 text-center select-none relative overflow-hidden">
            {/* Decorative Elegant Background Circles or Lines Matching themes */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.12] dark:opacity-[0.25]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-dashed border-slate-400"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-dashed border-indigo-400"></div>
              <div className="absolute top-12 bottom-12 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-slate-400 to-transparent"></div>
              <div className="absolute left-12 right-12 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              {/* Subtle top decoration badge */}
              <div className="flex items-center justify-center space-x-2">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-indigo-500"></div>
                {isEditable ? (
                  <input
                    type="text"
                    id={`subtitle-${slide.id}`}
                    className={`text-xs font-mono tracking-widest font-black uppercase py-0.5 px-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full ${theme.text} text-center outline-none`}
                    value={subtitle}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    placeholder="サブタイトル"
                  />
                ) : (
                  subtitle && (
                    <span className={`text-xs font-mono tracking-widest font-black uppercase py-0.5 px-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full ${theme.text}`} style={fkStyle(`subtitle-${slide.id}`)}>
                      {subtitle}
                    </span>
                  )
                )}
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-indigo-500"></div>
              </div>

              <div className="space-y-4">
                {isEditable ? (
                  <textarea
                    rows={2}
                    id={`titleMain-${slide.id}`}
                    className="w-full text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-center resize-none bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:ring-0 outline-none px-4"
                    style={{ color: isDarkBg ? '#fff' : '#0f172a' }}
                    value={titleMain}
                    onChange={(e) => {
                      updateField('titleMain', e.target.value);
                    }}
                    placeholder="中央に大きく表示するタイトル"
                  />
                ) : (
                  <h1
                    className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display leading-tight py-2"
                    style={fkStyle(`titleMain-${slide.id}`, {
                      color: isDarkBg ? '#fff' : '#0f172a',
                      textShadow: isDarkBg ? '0 4px 20px rgba(99, 102, 241, 0.25)' : 'none'
                    })}
                  >
                    {titleMain}
                  </h1>
                )}
              </div>

              {/* Dynamic decorative base bar */}
              <div className="flex items-center justify-center space-x-2 pt-4">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                <div className="h-[2px] w-16 bg-gradient-to-r from-indigo-500 to-transparent"></div>
                <div className="h-[2px] w-16 bg-gradient-to-l from-indigo-500 to-transparent"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              </div>
            </div>
          </div>
        );
};

// ── vision ──
export const VisionSlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const visionStatement = slide.content.visionStatement || (isEditable ? '' : 'メインとなるビジョンステートメントを入力');
        const visionSubtitle = slide.content.visionSubtitle || (isEditable ? '' : '');
        const philosophyPoints = slide.content.philosophyPoints || [];
        const visionLayout = slide.content.visionLayout || 'centered';
        const coreMessageLabel = slide.content.coreMessageLabel || 'CORE MESSAGE';

        // Monochrome ink palette matching the corporate vision deck (#1B1B1B on light).
        const ink = isDarkBg ? '#ffffff' : '#1B1B1B';
        const logoInk = isDarkBg ? '#1B1B1B' : '#ffffff';
        const muted = isDarkBg ? 'rgba(255,255,255,0.70)' : 'rgba(27,27,27,0.66)';
        const softBg = isDarkBg ? 'rgba(255,255,255,0.06)' : 'rgba(27,27,27,0.035)';
        const hair = isDarkBg ? 'rgba(255,255,255,0.18)' : 'rgba(27,27,27,0.16)';

        // Default icons echo the reference deck (players / innovation / integrity).
        const DEFAULT_POINT_ICONS = ['Users', 'Lightbulb', 'Handshake'];
        const pointIcon = (point: any, index: number) => point.icon || DEFAULT_POINT_ICONS[index] || 'Sparkles';
        const iconChoices = ['Users', 'Lightbulb', 'Handshake', 'Sparkles', 'Heart', 'Rocket', 'Target', 'Star', 'Gamepad2', 'Zap'];

        // The corporate mark (nested triangles + two dots), rendered inside the header block.
        const LogoMark = ({ color, className }: { color: string; className?: string }) => (
          <svg viewBox="0 0 240 210" className={className} fill="none" stroke={color} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round">
            <path d="M120 38 L208 182 L32 182 Z" />
            <path d="M120 92 L172 178 L68 178 Z" />
            <circle cx="206" cy="46" r="12" fill={color} stroke="none" />
            <circle cx="233" cy="38" r="8" fill={color} stroke="none" />
          </svg>
        );

        // A pair of thin ink rules — the deck's signature top/bottom divider.
        const DoubleRule = ({ className }: { className?: string }) => (
          <div className={className}>
            <div style={{ borderTop: `1.5px solid ${ink}` }} />
            <div style={{ borderTop: `1.5px solid ${ink}`, marginTop: '3px' }} />
          </div>
        );

        // A plain line icon (no badge) that inherits the ink colour; edit mode adds a picker.
        const PointIcon = (point: any, index: number, iconCls: string) => (
          <div className="relative group inline-flex shrink-0" style={{ color: ink }}>
            <DynamicIcon name={pointIcon(point, index)} className={iconCls} />
            {isEditable && (
              <div className="absolute hidden group-hover:flex flex-wrap gap-1 bg-white p-2 rounded-lg shadow-lg border border-slate-200 z-30 w-44 top-full mt-1 left-1/2 -translate-x-1/2">
                {iconChoices.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      const updated = [...philosophyPoints];
                      updated[index] = { ...point, icon: iconName };
                      updateField('philosophyPoints', updated);
                    }}
                    className={`p-1 rounded hover:bg-slate-100 ${pointIcon(point, index) === iconName ? 'bg-slate-100 border border-slate-300' : ''}`}
                    style={{ color: '#1B1B1B' }}
                  >
                    <DynamicIcon name={iconName} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );

        // Supporting sub-message under the main statement (shared by every layout).
        const SubtitleField = (idSuffix: string, alignCls: string) => {
          if (isEditable) {
            return (
              <textarea
                id={`visionSubtitle-${idSuffix}-${slide.id}`}
                rows={1}
                className={`w-full text-sm sm:text-base leading-relaxed outline-none border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-500 bg-transparent resize-none overflow-hidden ${alignCls}`}
                style={{ color: muted }}
                value={visionSubtitle}
                onChange={(e) => updateField('visionSubtitle', e.target.value)}
                placeholder="補足のサブメッセージ（任意）"
              />
            );
          }
          if (!visionSubtitle) return null;
          return (
            <p className={`text-sm sm:text-base leading-relaxed ${alignCls}`} style={fkStyle(`visionSubtitle-${idSuffix}-${slide.id}`, { color: muted })}>
              {visionSubtitle}
            </p>
          );
        };

        // Editable heading / body for a single philosophy point.
        const PointTitle = (point: any, index: number, cls: string, alignCls: string) => (
          isEditable ? (
            <input
              type="text"
              id={`phi-title-${point.id}`}
              className={`outline-none bg-transparent border-b border-transparent focus:border-slate-300 w-full ${cls} ${alignCls}`}
              style={{ color: ink }}
              value={point.title}
              onChange={(e) => {
                const updated = [...philosophyPoints];
                updated[index] = { ...point, title: e.target.value };
                updateField('philosophyPoints', updated);
              }}
              placeholder="ビジョンの見出し"
            />
          ) : (
            <h4 className={`${cls} ${alignCls}`} style={fkStyle(`phi-title-${point.id}`, { color: ink })}>{point.title || 'ビジョンの見出し'}</h4>
          )
        );

        const PointText = (point: any, index: number, cls: string, rows: number) => (
          isEditable ? (
            <textarea
              id={`phi-text-${point.id}`}
              rows={rows}
              className={`w-full outline-none bg-transparent border border-transparent border-dashed hover:border-slate-300 focus:border-slate-400 p-1 resize-none leading-relaxed ${cls}`}
              style={{ color: muted }}
              value={point.text}
              onChange={(e) => {
                const updated = [...philosophyPoints];
                updated[index] = { ...point, text: e.target.value };
                updateField('philosophyPoints', updated);
              }}
              placeholder="説明文を入力"
            />
          ) : (
            <p className={`leading-relaxed ${cls}`} style={fkStyle(`phi-text-${point.id}`, { color: muted })}>{point.text || '説明文を入力'}</p>
          )
        );

        return (
          <div className="flex flex-col h-full py-5 px-10" style={{ color: ink }}>
            {/* Header: top double rule, corporate mark block, and title */}
            <div className="shrink-0">
              <DoubleRule className="mb-3" />
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ backgroundColor: ink }}>
                    <LogoMark color={logoInk} className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black leading-tight truncate" style={{ color: ink }}>{slide.title}</h2>
                </div>

                {isEditable && (
                  <div className="flex items-center space-x-1 bg-slate-100 dark:bg-white/10 p-1 rounded-lg text-[11px] shadow-sm border border-slate-200/50 dark:border-white/5 select-none shrink-0">
                    <span className="text-slate-400 px-1 font-sans font-medium">レイアウト:</span>
                    {(['centered', 'split', 'grid', 'editorial'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => updateField('visionLayout', l)}
                        className={`px-2 py-1 rounded-md mb-0 transition font-medium ${
                          visionLayout === l
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-750'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        {l === 'centered' && '中央揃え'}
                        {l === 'split' && '左右分割'}
                        {l === 'grid' && 'グリッド'}
                        {l === 'editorial' && '大人の上品'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Centered: statement + subtitle above three plain-icon columns (reference layout) ── */}
            {visionLayout === 'centered' && (
              <div className="flex-1 flex flex-col justify-center gap-9 py-2">
                <div className="text-center max-w-4xl mx-auto w-full">
                  <div className="grid max-w-full">
                    {isEditable ? (
                      <textarea
                        id={`visionStatement-${slide.id}`}
                        rows={1}
                        className="col-start-1 row-start-1 w-full text-2xl sm:text-3xl font-black text-center leading-snug outline-none border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-500 bg-transparent resize-none overflow-hidden"
                        style={{ color: ink }}
                        value={visionStatement}
                        onChange={(e) => updateField('visionStatement', e.target.value)}
                        placeholder="メインとなるビジョンステートメントを入力"
                      />
                    ) : (
                      <p className="col-start-1 row-start-1 text-2xl sm:text-3xl font-black text-center leading-snug" style={fkStyle(`visionStatement-${slide.id}`, { color: ink })}>
                        {visionStatement}
                      </p>
                    )}
                    <span aria-hidden="true" className="col-start-1 row-start-1 invisible whitespace-pre-wrap break-words text-2xl sm:text-3xl font-black text-center leading-snug">
                      {slide.content.visionStatement || 'メインとなるビジョンステートメントを入力'}
                    </span>
                  </div>
                  <div className="mt-3 max-w-2xl mx-auto">
                    {SubtitleField('centered', 'text-center')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 max-w-5xl mx-auto w-full">
                  {philosophyPoints.map((point: any, index: number) => (
                    <div key={point.id} className="flex flex-col items-center px-2">
                      {PointIcon(point, index, 'w-16 h-16')}
                      <div className="mt-4 w-full">
                        {PointTitle(point, index, 'font-black text-base sm:text-lg', 'text-center')}
                      </div>
                      <div className="mt-2 w-full">
                        {PointText(point, index, 'text-xs sm:text-sm text-left', 3)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Split: statement block on the left, icon list on the right ── */}
            {visionLayout === 'split' && (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4">
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <div className="p-6 rounded-xl" style={{ backgroundColor: softBg, border: `1px solid ${hair}` }}>
                    {isEditable ? (
                      <textarea
                        id={`visionStatement-split-${slide.id}`}
                        rows={4}
                        className="w-full text-lg sm:text-2xl font-black leading-relaxed outline-none border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-500 bg-transparent resize-none"
                        style={{ color: ink }}
                        value={visionStatement}
                        onChange={(e) => updateField('visionStatement', e.target.value)}
                        placeholder="メインとなるビジョンステートメントを入力"
                      />
                    ) : (
                      <p className="text-lg sm:text-2xl font-black leading-relaxed" style={fkStyle(`visionStatement-split-${slide.id}`, { color: ink })}>
                        {visionStatement}
                      </p>
                    )}
                    <div className="mt-3">
                      {SubtitleField('split', 'text-left')}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col space-y-4 justify-center">
                  {philosophyPoints.map((point: any, index: number) => (
                    <div key={point.id} className="p-4 flex items-start gap-4" style={{ borderBottom: index !== philosophyPoints.length - 1 ? `1px solid ${hair}` : 'none' }}>
                      {PointIcon(point, index, 'w-9 h-9 mt-0.5')}
                      <div className="flex-grow">
                        <div className="mb-1">
                          {PointTitle(point, index, 'font-black text-sm sm:text-base', 'text-left')}
                        </div>
                        {PointText(point, index, 'text-xs sm:text-sm text-left', 2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Grid: full-width statement banner over a three-cell grid ── */}
            {visionLayout === 'grid' && (
              <div className="flex-1 flex flex-col justify-center gap-5 py-2">
                <div className="p-5 rounded-xl text-center" style={{ backgroundColor: softBg, border: `1px solid ${hair}` }}>
                  <div className="px-8 max-w-3xl mx-auto">
                    {isEditable ? (
                      <textarea
                        id={`visionStatement-grid-${slide.id}`}
                        rows={2}
                        className="w-full text-lg sm:text-2xl font-black leading-relaxed text-center outline-none border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-500 bg-transparent resize-none"
                        style={{ color: ink }}
                        value={visionStatement}
                        onChange={(e) => updateField('visionStatement', e.target.value)}
                        placeholder="メインとなるビジョンステートメントを入力"
                      />
                    ) : (
                      <p className="text-lg sm:text-2xl font-black leading-relaxed" style={fkStyle(`visionStatement-grid-${slide.id}`, { color: ink })}>
                        {visionStatement}
                      </p>
                    )}
                    <div className="mt-2">
                      {SubtitleField('grid', 'text-center')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${hair}` }}>
                  {philosophyPoints.map((point: any, index: number) => (
                    <div key={point.id} className="p-5 flex flex-col min-h-[140px]" style={{ borderRight: index !== philosophyPoints.length - 1 ? `1px solid ${hair}` : 'none' }}>
                      <div className="flex items-center gap-3 mb-3">
                        {PointIcon(point, index, 'w-8 h-8')}
                        <div className="flex-grow">
                          {PointTitle(point, index, 'font-black text-sm sm:text-base', 'text-left')}
                        </div>
                      </div>
                      {PointText(point, index, 'text-xs sm:text-sm text-left', 3)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Editorial: refined statement on the left, quiet numbered list on the right ── */}
            {visionLayout === 'editorial' && (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center py-2">
                <div className="lg:col-span-6 flex flex-col justify-center">
                  {isEditable ? (
                    <input
                      type="text"
                      id={`coreMessageLabel-${slide.id}`}
                      className="text-[10px] font-sans font-bold tracking-widest uppercase mb-3 block bg-transparent outline-none border-b border-transparent focus:border-slate-300 w-full"
                      style={{ color: muted }}
                      value={coreMessageLabel}
                      onChange={(e) => updateField('coreMessageLabel', e.target.value)}
                      placeholder="ラベル"
                    />
                  ) : (
                    <span className="text-[10px] font-sans font-bold tracking-widest uppercase mb-3 block" style={fkStyle(`coreMessageLabel-${slide.id}`, { color: muted })}>{coreMessageLabel}</span>
                  )}
                  {isEditable ? (
                    <textarea
                      id={`visionStatement-editorial-${slide.id}`}
                      rows={4}
                      className="w-full text-xl sm:text-3xl font-light italic leading-relaxed outline-none border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-500 bg-transparent resize-none"
                      style={{ color: ink }}
                      value={visionStatement}
                      onChange={(e) => updateField('visionStatement', e.target.value)}
                      placeholder="メインとなるビジョンステートメントを入力"
                    />
                  ) : (
                    <p className="text-xl sm:text-3xl font-light italic leading-relaxed" style={fkStyle(`visionStatement-editorial-${slide.id}`, { color: ink })}>
                      {visionStatement}
                    </p>
                  )}
                  <div className="mt-4 max-w-md">
                    {SubtitleField('editorial', 'text-left')}
                  </div>
                </div>

                <div className="lg:col-span-6 flex flex-col justify-center gap-5">
                  {philosophyPoints.map((point: any, index: number) => (
                    <div key={point.id} className="flex items-start gap-4 pb-4" style={{ borderBottom: index !== philosophyPoints.length - 1 ? `1px solid ${hair}` : 'none' }}>
                      {PointIcon(point, index, 'w-9 h-9 mt-0.5')}
                      <div className="flex-grow">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-serif italic text-sm font-light shrink-0" style={{ color: muted }}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-grow">
                            {PointTitle(point, index, 'font-black text-sm sm:text-base tracking-wide', 'text-left')}
                          </div>
                        </div>
                        {PointText(point, index, 'text-xs sm:text-sm text-left', 2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer: bottom double rule (page number sits below, added by the renderer) */}
            <DoubleRule className="shrink-0 mt-3" />
          </div>
        );
};

// ── toc ──
export const TocSlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        // Table of Contents dynamically lists other slides in order
        const eligibleSlides = allSlides.filter(s => s.type !== 'title' && s.type !== 'toc');
        const tocScale = slide.content._tocFontScale || 1;
        const setTocScale = (v: number) => updateField('_tocFontScale', Math.min(3, Math.max(0.5, Math.round(v * 100) / 100)));

        return (
          <div className="flex flex-col justify-between h-full py-8 px-10">
            <div>
              <span className={`text-xs font-mono tracking-widest ${theme.text} uppercase block mb-1`}>TABLE OF CONTENTS</span>
              <h2 className={`text-3xl font-extra-bold font-display ${textPrimaryClass}`}>{slide.title}</h2>
              <p className={`text-xs ${textSecondaryClass} mt-1`}>※ スライドリストの内容に応じて自動で更新されます</p>
              {isEditable && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px]" onMouseDown={(e) => e.preventDefault()}>
                  <span className="text-slate-500">目次一覧のサイズ</span>
                  <button onClick={() => setTocScale(tocScale - 0.1)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-base leading-none" title="小さくする">－</button>
                  <span className="text-slate-500 font-mono w-11 text-center">{Math.round(tocScale * 100)}%</span>
                  <button onClick={() => setTocScale(tocScale + 0.1)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-base leading-none" title="大きくする">＋</button>
                  <button onClick={() => updateField('_tocFontScale', 1)} className="px-2 h-6 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 text-[10px]" title="標準サイズに戻す">リセット</button>
                </div>
              )}
            </div>

            <div className="my-auto py-4">
              {eligibleSlides.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl bg-slate-50/50">
                  <p className="text-slate-400 text-sm">他のスライドを左メニューから追加すると、ここに目次として一覧化されます。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 max-w-4xl mx-auto">
                  {eligibleSlides.map((s, idx) => {
                    const displayNum = String(idx + 1).padStart(2, '0');
                    return (
                      <div key={s.id} className={`flex items-center py-2 px-3 border-b ${isDarkBg ? 'border-white/10' : 'border-slate-100'} transition hover:bg-slate-500/5 rounded group`}>
                        <span className={`font-mono font-black mr-4 ${theme.text} group-hover:scale-110 transition`} style={{ fontSize: `${16 * tocScale}px` }}>
                          {displayNum}
                        </span>
                        <span className={`tracking-wide font-medium flex-grow truncate ${textPrimaryClass}`} style={{ fontSize: `${14 * tocScale}px` }}>
                          {s.title}
                        </span>
                        <span className={`text-xs opacity-50 font-mono ${textSecondaryClass}`}>
                          SLIDE
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`text-center text-xs opacity-40 font-mono ${textSecondaryClass}`}>
              {allSlides.length} Pages Deck
            </div>
          </div>
        );
};

// ── staff ──
export const StaffSlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const staffList = slide.content.staffList || [];

        return (
          <div className="flex flex-col justify-between h-full py-6 px-10">
            <div>
              <span className={`text-xs font-mono tracking-widest ${theme.text} uppercase block mb-1`}>MEMBERS</span>
              <h2 className={`text-2xl font-bold font-display ${textPrimaryClass}`}>{slide.title}</h2>
            </div>

            <div className="my-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {staffList.map((member: StaffMember, index: number) => {
                  const availableIcons = ['Crown', 'Code', 'Palette', 'Megaphone', 'Briefcase', 'User', 'Heart', 'Smile', 'Cpu', 'Globe'];
                  return (
                    <div key={member.id} className={`p-6 rounded-2xl ${cardBgClass} border relative transition hover:shadow-md hover:scale-101 flex flex-col items-center text-center`}>
                      {isEditable && (
                        <button
                          id={`del-staff-${member.id}`}
                          onClick={() => {
                            const updated = staffList.filter((s: StaffMember) => s.id !== member.id);
                            updateField('staffList', updated);
                          }}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="スタッフ情報を削除"
                        >
                          <Icons.X className="w-4 h-4" />
                        </button>
                      )}

                      {/* Icon or Photo Avatar */}
                      <div className="mb-4 relative w-20 h-20 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/15 shadow-inner overflow-hidden shrink-0 group">
                        {member.imageUrl ? (
                          <img
                            referrerPolicy="no-referrer"
                            src={member.imageUrl}
                            className="w-full h-full object-cover"
                            alt={member.name}
                          />
                        ) : (
                          <div className={`w-full h-full rounded-full flex items-center justify-center ${isDarkBg ? 'bg-white/10 text-white' : theme.bgLight + ' ' + theme.text}`}>
                            <DynamicIcon name={member.iconType || 'User'} className="w-8 h-8" />
                          </div>
                        )}
                        
                        {isEditable && !member.imageUrl && (
                          <div className="absolute hidden group-hover:flex flex-wrap gap-1 bg-white p-2 rounded-lg shadow-lg border border-slate-200 z-10 w-44 -bottom-16 left-1/2 transform -translate-x-1/2">
                            {availableIcons.map(iconName => (
                              <button
                                key={iconName}
                                onClick={() => {
                                  const updated = [...staffList];
                                  updated[index] = { ...member, iconType: iconName };
                                  updateField('staffList', updated);
                                }}
                                className={`p-1 rounded hover:bg-slate-100 ${member.iconType === iconName ? 'bg-indigo-50 border border-indigo-200' : ''}`}
                              >
                                <DynamicIcon name={iconName} className="w-4 h-4 text-slate-705" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Image URL text entry (visible in edit mode) */}
                      {isEditable && (
                        <div className="w-full mb-3 px-1">
                          <div className="flex items-center space-x-1 bg-slate-950/10 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded px-2 py-1">
                            <Icons.Link className="w-3 h-3 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              className="w-full text-[9px] bg-transparent outline-none border-0 text-slate-400 focus:text-indigo-400 p-0 font-mono"
                              placeholder="写真URL (https://...)"
                              aria-label="Staff Photo URL"
                              value={member.imageUrl || ''}
                              onChange={(e) => {
                                const updated = [...staffList];
                                updated[index] = { ...member, imageUrl: e.target.value };
                                updateField('staffList', updated);
                              }}
                            />
                            {member.imageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...staffList];
                                  updated[index] = { ...member, imageUrl: '' };
                                  updateField('staffList', updated);
                                }}
                                className="text-[9px] text-rose-500 hover:text-rose-600 font-bold shrink-0"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Name / Role */}
                      <div className="w-full mb-3">
                        {isEditable ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              id={`staff-role-${member.id}`}
                              className="w-full text-xs text-center border-b border-transparent hover:border-slate-300 focus:border-slate-500 outline-none text-slate-400 select-all"
                              value={member.role}
                              onChange={(e) => {
                                const updated = [...staffList];
                                updated[index] = { ...member, role: e.target.value };
                                updateField('staffList', updated);
                              }}
                              placeholder="役職"
                            />
                            <input
                              type="text"
                              id={`staff-name-${member.id}`}
                              className={`w-full font-bold text-center border-b border-transparent hover:border-slate-300 focus:border-slate-500 outline-none text-base ${textPrimaryClass} select-all`}
                              value={member.name}
                              onChange={(e) => {
                                const updated = [...staffList];
                                updated[index] = { ...member, name: e.target.value };
                                updateField('staffList', updated);
                              }}
                              placeholder="名前"
                            />
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-mono font-medium tracking-wide text-indigo-400 dark:text-indigo-300 uppercase block" style={fkStyle(`staff-role-${member.id}`)}>
                              {member.role || '役職'}
                            </span>
                            <h4 className={`font-bold font-display text-base mt-0.5 ${textPrimaryClass}`} style={fkStyle(`staff-name-${member.id}`)}>{member.name || '名前'}</h4>
                          </>
                        )}
                      </div>

                      {/* Bio */}
                      <div className="w-full text-left">
                        {isEditable ? (
                          <textarea
                            id={`staff-desc-${member.id}`}
                            rows={3}
                            className={`w-full text-xs outline-none bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 p-1 resize-none leading-relaxed text-center ${textSecondaryClass}`}
                            value={member.description}
                            onChange={(e) => {
                              const updated = [...staffList];
                              updated[index] = { ...member, description: e.target.value };
                              updateField('staffList', updated);
                            }}
                            placeholder="経歴や担当などの説明を記載してください"
                          />
                        ) : (
                          <p className={`text-xs leading-relaxed text-center ${textSecondaryClass}`} style={fkStyle(`staff-desc-${member.id}`)}>{member.description || '経歴や担当などの説明を記載してください'}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isEditable && (
                <div className="flex justify-center mt-6">
                  <button
                    id={`add-staff-${slide.id}`}
                    onClick={() => {
                      const newStaff: StaffMember = {
                        id: `staff-${Date.now()}`,
                        name: '新しいスタッフ',
                        role: 'プロジェクト担当員',
                        description: 'ここに紹介文や経歴を記入してください。サンプルの文章です。',
                        iconType: 'User'
                      };
                      updateField('staffList', [...staffList, newStaff]);
                    }}
                    className={`flex items-center space-x-1.5 text-xs py-1.5 px-3 rounded-lg border border-dashed ${isDarkBg ? 'border-white/30 text-white hover:bg-white/10' : 'border-slate-300 text-slate-600 hover:bg-slate-50'} transition`}
                  >
                    <Icons.Plus className="w-4 h-4" />
                    <span>スタッフカードを追加</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-4"></div>
          </div>
        );
};

// ── financial_past3 ──
export const FinancialPast3Slide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const pastTerms = slide.content.pastTerms || [];
        const pastTermsUnit = slide.content.pastTermsUnit || '百万円';

        // Calculate maximum value for custom SVG bar heights
        const maxVal = Math.max(...pastTerms.map((t: PastTermData) => Math.max(t.revenue, t.profit || 0)), 100);

        return (
          <div className="flex flex-col justify-between h-full py-6 px-10">
            <div>
              <span className={`text-xs font-mono tracking-widest ${theme.text} uppercase block mb-1`}>FINANCIAL REPORT 1</span>
              <h2 className={`text-2xl font-bold font-display ${textPrimaryClass}`}>{slide.title}</h2>
            </div>

            <div className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Interactive Table Grid */}
              {isEditable && (
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-xl overflow-hidden border border-slate-100 bg-white/50 backdrop-blur-sm shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`${isDarkBg ? 'bg-white/15' : 'bg-slate-100'} font-semibold text-slate-500`}>
                          <th className="p-2.5">期 (年度)</th>
                          <th className="p-2.5 text-right">売上 ({pastTermsUnit})</th>
                          <th className="p-2.5 text-right">純利益 ({pastTermsUnit})</th>
                          <th className="p-2.5">動作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pastTerms.map((term: PastTermData, idx: number) => (
                          <tr key={idx} className={isDarkBg ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                            <td className="p-2 text-slate-700">
                              <input
                                type="text"
                                className="w-full outline-none bg-transparent hover:border-b hover:border-slate-300 font-medium"
                                style={{ color: isDarkBg ? '#fff' : '#000' }}
                                value={term.term}
                                placeholder="第22期 など"
                                onChange={(e) => {
                                  const updated = [...pastTerms];
                                  updated[idx] = { ...term, term: e.target.value };
                                  updateField('pastTerms', updated);
                                }}
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                className="w-20 text-right outline-none bg-transparent hover:border-b hover:border-slate-300 select-all font-mono"
                                style={{ color: isDarkBg ? '#fff' : '#000' }}
                                value={term.revenue}
                                onChange={(e) => {
                                  const updated = [...pastTerms];
                                  updated[idx] = { ...term, revenue: Number(e.target.value) || 0 };
                                  updateField('pastTerms', updated);
                                }}
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                className="w-20 text-right outline-none bg-transparent hover:border-b hover:border-slate-300 select-all font-mono"
                                style={{ color: isDarkBg ? '#fff' : '#000' }}
                                value={term.profit}
                                onChange={(e) => {
                                  const updated = [...pastTerms];
                                  updated[idx] = { ...term, profit: Number(e.target.value) || 0 };
                                  updateField('pastTerms', updated);
                                }}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => {
                                  const updated = pastTerms.filter((_, i) => i !== idx);
                                  updateField('pastTerms', updated);
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Icons.Trash className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const newTerm = {
                          term: `第${pastTerms.length + 22}期 (2026)`,
                          revenue: 2500,
                          profit: 400
                        };
                        updateField('pastTerms', [...pastTerms, newTerm]);
                      }}
                      className="text-xs text-indigo-500 flex items-center space-x-1"
                    >
                      <Icons.PlusCircle className="w-4 h-4" />
                      <span>行を追加</span>
                    </button>
                    <div className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                      <span>単位:</span>
                      <input
                        type="text"
                        className="w-12 bg-transparent border-b outline-none text-center"
                        value={pastTermsUnit}
                        onChange={(e) => updateField('pastTermsUnit', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Right Column: Custom SVG bar charts */}
              <div className={isEditable ? "lg:col-span-7 flex flex-col items-center justify-center p-4" : "lg:col-span-12 flex flex-col items-center justify-center p-4"}>
                <div className={`w-full ${isEditable ? 'max-w-md' : 'max-w-3xl'} p-6 rounded-2xl ${isDarkBg ? 'bg-white/5 border border-white/10' : 'bg-slate-50'} shadow-xs`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-sm font-bold ${textPrimaryClass}`}>推移グラフ (比較表示)</h3>
                    <div className="flex space-x-4 text-xs font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-3 bg-indigo-500 rounded-xs"></span>
                        <span className={textSecondaryClass}>売上</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-3 bg-emerald-500 rounded-xs"></span>
                        <span className={textSecondaryClass}>純利益</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Bar Visualizer */}
                  <div className="flex items-end justify-around h-48 w-full border-b border-slate-300 pb-2 relative font-mono">
                    {pastTerms.map((t: PastTermData, index: number) => {
                      // Heights in percentage (relative to container)
                      const revPct = maxVal > 0 ? (t.revenue / maxVal) * 80 : 0;
                      const profPct = maxVal > 0 ? (t.profit / maxVal) * 80 : 0;

                      return (
                        <div key={index} className="flex flex-col items-center w-24">
                          <div className="flex items-end space-x-2 h-36 w-full justify-center">
                            {/* Revenue Bar */}
                            <div className="flex flex-col items-center group relative">
                              {isEditable && (
                                <span className="absolute -top-6 hidden group-hover:block bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded z-10 whitespace-nowrap">
                                  売上: {t.revenue.toLocaleString()}
                                </span>
                              )}
                              <div
                                className="w-6 bg-indigo-500 hover:bg-indigo-600 rounded-t-sm transition-all duration-500 cursor-pointer"
                                style={{ height: `${Math.max(revPct, 4)}%` }}
                              ></div>
                            </div>

                            {/* Profit Bar */}
                            <div className="flex flex-col items-center group relative">
                              {isEditable && (
                                <span className="absolute -top-6 hidden group-hover:block bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded z-10 whitespace-nowrap">
                                  利益: {t.profit?.toLocaleString()}
                                </span>
                              )}
                              <div
                                className="w-6 bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all duration-500 cursor-pointer"
                                style={{ height: `${Math.max(profPct, 4)}%` }}
                              ></div>
                            </div>
                          </div>
                          {/* Label */}
                          <div className={`text-[10px] mt-2 font-sans truncate text-center w-full ${textSecondaryClass}`}>
                            {t.term.split(' ')[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="h-4"></div>
          </div>
        );
};

// ── financial_monthly ──
export const FinancialMonthlySlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const monthlySales = slide.content.monthlySales || [];
        const monthlySalesUnit = slide.content.monthlySalesUnit || '百万円';

        // Custom monthly high-contrast graph calculations
        const maxVal = Math.max(...monthlySales.map((m: MonthlySalesData) => Math.max(m.revenue, m.target)), 100);

        return (
          <div className="flex flex-col justify-between h-full py-6 px-10">
            <div>
              <span className={`text-xs font-mono tracking-widest ${theme.text} uppercase block mb-1`}>FINANCIAL REPORT 2</span>
              <h2 className={`text-2xl font-bold font-display ${textPrimaryClass}`}>{slide.title}</h2>
            </div>

            <div className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Panel: 12-Month Sales Input Grid */}
              {isEditable && (
                <div className="lg:col-span-4 max-h-80 overflow-y-auto pr-2">
                  <div className="rounded-xl overflow-hidden border border-slate-100 bg-white shadow-xs text-xs">
                    <div className="grid grid-cols-3 bg-slate-100 p-2 font-semibold text-slate-500 sticky top-0">
                      <div>月度</div>
                      <div className="text-right">実績({monthlySalesUnit})</div>
                      <div className="text-right">目標({monthlySalesUnit})</div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {monthlySales.map((monthData: MonthlySalesData, idx: number) => (
                        <div key={idx} className="grid grid-cols-3 p-1.5 items-center hover:bg-slate-50">
                          <div className="font-medium text-slate-700">{monthData.month}</div>
                          <div className="text-right">
                            <input
                              type="number"
                              className="w-16 text-right outline-none bg-transparent hover:bg-slate-100 focus:bg-white select-all border rounded border-transparent focus:border-indigo-500"
                              value={monthData.revenue}
                              onChange={(e) => {
                                const updated = [...monthlySales];
                                updated[idx] = { ...monthData, revenue: Number(e.target.value) || 0 };
                                updateField('monthlySales', updated);
                              }}
                            />
                          </div>
                          <div className="text-right">
                            <input
                              type="number"
                              className="w-16 text-right outline-none bg-transparent hover:bg-slate-100 focus:bg-white select-all border rounded border-transparent focus:border-indigo-500"
                              value={monthData.target}
                              onChange={(e) => {
                                const updated = [...monthlySales];
                                updated[idx] = { ...monthData, target: Number(e.target.value) || 0 };
                                updateField('monthlySales', updated);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Right Panel: Styled SVG area/line graph */}
              <div className={isEditable ? "lg:col-span-8 flex flex-col justify-center items-center" : "lg:col-span-12 flex flex-col justify-center items-center"}>
                <div className={`w-full p-4 rounded-2xl ${isDarkBg ? 'bg-white/5 border border-white/10' : 'bg-slate-50'} shadow-xs`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-xs font-bold ${textPrimaryClass}`}>月次売上推移グラフ (対ターゲット)</h3>
                    <div className="flex space-x-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                        <span className={textSecondaryClass}>実績値</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 border-t-2 border-dashed border-rose-400 w-3 inline-block"></span>
                        <span className={textSecondaryClass}>目標値</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Area Layout */}
                  <div className="w-full h-44 relative bg-transparent p-1">
                    <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="#e2e8f0" strokeOpacity={0.4} strokeDasharray="3 3" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="#e2e8f0" strokeOpacity={0.4} strokeDasharray="3 3" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="#cbd5e1" strokeOpacity={2} />

                      {/* Convert monthly values to coordinates */}
                      {(() => {
                        const widthStep = 500 / (monthlySales.length - 1 || 1);
                        const pointsActive: string[] = [];
                        const pointsTarget: string[] = [];
                        
                        monthlySales.forEach((m: MonthlySalesData, i: number) => {
                          const x = i * widthStep;
                          // Graph is bounded from y=10 to y=150
                          const yActive = 150 - (m.revenue / maxVal) * 130;
                          const yTarget = 150 - (m.target / maxVal) * 130;
                          
                          pointsActive.push(`${x},${yActive}`);
                          pointsTarget.push(`${x},${yTarget}`);
                        });

                        const activePathD = `M ${pointsActive.join(' L ')}`;
                        const targetPathD = `M ${pointsTarget.join(' L ')}`;
                        const areaPathD = `${activePathD} L 500,150 L 0,150 Z`;

                        return (
                          <>
                            {/* Area shader */}
                            <path d={areaPathD} fill="url(#indigoGrad)" opacity="0.15" />
                            
                            {/* Target line */}
                            <path d={targetPathD} fill="none" stroke="#fb7185" strokeWidth="2" strokeDasharray="4 4" />
                            
                            {/* Active Line */}
                            <path d={activePathD} fill="none" stroke="#4f46e5" strokeWidth="3" />

                            {/* Node Points */}
                            {monthlySales.map((m: MonthlySalesData, i: number) => {
                              const x = i * widthStep;
                              const y = 150 - (m.revenue / maxVal) * 130;
                              return (
                                <g key={i} className="group/node cursor-pointer">
                                  <circle cx={x} cy={y} r="4" fill="#4f46e5" stroke="#fff" strokeWidth="1.5" />
                                  <circle cx={x} cy={y} r="8" fill="#4f46e5" opacity="0.3" className="hidden group-hover/node:block" />
                                </g>
                              );
                            })}

                            {/* Gradients def */}
                            <defs>
                              <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4f46e5" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                          </>
                        );
                      })()}
                    </svg>

                    {/* Bottom Labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[9px] font-sans text-slate-400">
                      {monthlySales.map((m: MonthlySalesData, i: number) => (
                        <span key={i} className="w-8 text-center">{m.month}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-4"></div>
          </div>
        );
};

// ── financial_summary ──
export const FinancialSummarySlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const summaryRevenue = slide.content.summaryRevenue || 0;
        const summaryProfit = slide.content.summaryProfit || 0;
        const forecastRevenue = slide.content.forecastRevenue || 0;
        const forecastProfit = slide.content.forecastProfit || 0;
        const reportType = slide.content.financialReportType || 'interim';
        const reportText = slide.content.reportText || (isEditable ? '' : '決算報告のまとめ文を入力してください');
        const futureOutlook = slide.content.futureOutlook || (isEditable ? '' : '今後の見通しや戦略等を入力してください');

        return (
          <div className="flex flex-col justify-between h-full py-6 px-10">
            <div>
              <span className={`text-xs font-mono tracking-widest ${theme.text} uppercase block mb-1`}>FINANCIAL REPORT 3</span>
              <div className="flex items-center space-x-3">
                <h2 className={`text-2xl font-bold font-display ${textPrimaryClass}`}>{slide.title}</h2>
                {isEditable ? (
                  <select
                    id={`report-select-${slide.id}`}
                    className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded cursor-pointer font-medium"
                    value={reportType}
                    onChange={(e) => updateField('financialReportType', e.target.value)}
                  >
                    <option value="interim">中間報告</option>
                    <option value="final">最終報告</option>
                  </select>
                ) : (
                  <span className={`text-xs px-2.5 py-1.5 rounded-full font-bold ${theme.bg} text-white shadow-xs`}>
                    {reportType === 'interim' ? '📋 中間決算報告' : '🏅 通期決算報告'}
                  </span>
                )}
              </div>
            </div>

            <div className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* KPIs Bento Box Grid */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl ${cardBgClass} flex flex-col justify-center border hover:shadow-md transition`}>
                  <span className={`text-[10px] font-bold block ${textSecondaryClass}`}>今期売上総計</span>
                  <div className="flex items-baseline mt-1 space-x-0.5">
                    {isEditable ? (
                      <input
                        type="number"
                        className="w-full text-xl font-extrabold outline-none bg-transparent select-all border-b border-dashed"
                        style={{ color: isDarkBg ? '#fff' : '#000' }}
                        value={summaryRevenue}
                        onChange={(e) => updateField('summaryRevenue', Number(e.target.value) || 0)}
                      />
                    ) : (
                      <span className="text-xl font-black font-display text-indigo-600">{summaryRevenue.toLocaleString()}</span>
                    )}
                    <span className={`text-[10px] font-medium ${textSecondaryClass}`}>百万円</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${cardBgClass} flex flex-col justify-center border hover:shadow-md transition`}>
                  <span className={`text-[10px] font-bold block ${textSecondaryClass}`}>今期当期純利益</span>
                  <div className="flex items-baseline mt-1 space-x-0.5">
                    {isEditable ? (
                      <input
                        type="number"
                        className="w-full text-xl font-extrabold outline-none bg-transparent select-all border-b border-dashed"
                        style={{ color: isDarkBg ? '#fff' : '#000' }}
                        value={summaryProfit}
                        onChange={(e) => updateField('summaryProfit', Number(e.target.value) || 0)}
                      />
                    ) : (
                      <span className="text-xl font-black font-display text-emerald-600">{summaryProfit.toLocaleString()}</span>
                    )}
                    <span className={`text-[10px] font-medium ${textSecondaryClass}`}>百万円</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl col-span-2 ${isDarkBg ? 'bg-indigo-900/20 text-white' : 'bg-indigo-50/70 border border-indigo-100'} p-4 rounded-xl flex flex-col justify-center shadow-xs transition`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-500 tracking-wider">通期最終予測目標</span>
                    <span className="text-[9px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-black">FORECAST</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2 border-t border-indigo-100/40 pt-2 text-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-400 block">売上高予想</span>
                      <div className="flex items-baseline space-x-0.5">
                        {isEditable ? (
                          <input
                            type="number"
                            className="w-full font-bold outline-none bg-transparent font-display select-all text-xs border-b border-dashed border-indigo-300"
                            value={forecastRevenue}
                            onChange={(e) => updateField('forecastRevenue', Number(e.target.value) || 0)}
                          />
                        ) : (
                          <span className="font-exrabold font-display text-sm" style={{ color: isDarkBg ? '#fff' : '#1e1b4b' }}>{forecastRevenue.toLocaleString()}</span>
                        )}
                        <span className="text-[9px] text-slate-400">百万円</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">純利益予想</span>
                      <div className="flex items-baseline space-x-0.5">
                        {isEditable ? (
                          <input
                            type="number"
                            className="w-full font-bold outline-none bg-transparent font-display select-all text-xs border-b border-dashed border-indigo-300"
                            value={forecastProfit}
                            onChange={(e) => updateField('forecastProfit', Number(e.target.value) || 0)}
                          />
                        ) : (
                          <span className="font-extrabold font-display text-sm text-emerald-600">{forecastProfit.toLocaleString()}</span>
                        )}
                        <span className="text-[9px] text-slate-400">百万円</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Narrative Column */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                    <Icons.TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                    <span>決算総括 ・ 中間状況</span>
                  </h4>
                  {isEditable ? (
                    <textarea
                      id={`reportText-${slide.id}`}
                      rows={3}
                      className={`w-full text-xs outline-none bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 p-1.5 resize-none leading-relaxed rounded ${textPrimaryClass}`}
                      value={reportText}
                      onChange={(e) => updateField('reportText', e.target.value)}
                      placeholder="決算報告のまとめ文を入力してください"
                    />
                  ) : (
                    <p className={`text-xs leading-relaxed ${textSecondaryClass}`} style={fkStyle(`reportText-${slide.id}`)}>{reportText}</p>
                  )}
                </div>

                <div className={`p-4 rounded-xl border border-dashed ${isDarkBg ? 'bg-white/5 border-white/20' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                  <h4 className="text-xs font-extrabold text-slate-500 tracking-wider flex items-center space-x-1.5">
                    <Icons.Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                    <span>今後の見通し・方針</span>
                  </h4>
                  {isEditable ? (
                    <textarea
                      id={`futureOutlook-${slide.id}`}
                      rows={3}
                      className={`w-full text-xs outline-none bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 p-1.5 resize-none leading-relaxed rounded ${textPrimaryClass}`}
                      value={futureOutlook}
                      onChange={(e) => updateField('futureOutlook', e.target.value)}
                      placeholder="今後の見通しや戦略等を入力してください"
                    />
                  ) : (
                    <p className={`text-xs leading-relaxed ${textSecondaryClass}`} style={fkStyle(`futureOutlook-${slide.id}`)}>{futureOutlook}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
};

// ── project_list ──
export const ProjectListSlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const projects = slide.content.projects || [];
        const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]; // Apr to Mar next year

        return (
          <div className="flex flex-col justify-between h-full py-6 px-10">
            <div>
              <span className={`text-xs font-mono tracking-widest ${theme.text} uppercase block mb-1`}>PROJECT TIMELINE</span>
              <h2 className={`text-2xl font-bold font-display ${textPrimaryClass}`}>{slide.title}</h2>
            </div>

            <div className="my-auto space-y-3">
              <div className={`p-3.5 rounded-xl ${cardBgClass} border shadow-xs overflow-x-auto`}>
                <div className="min-w-[600px] space-y-2">
                  {/* Calendar Header Row */}
                  <div className="grid grid-cols-12 border-b pb-1 text-center text-xs font-mono font-bold text-slate-500">
                    <div className="col-span-4 text-left">プロジェクト名称</div>
                    <div className="col-span-8 grid grid-cols-12 gap-1 px-1">
                      {months.map((m, idx) => (
                        <div key={idx} className="text-[10px]">
                          {m}月
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project horizontal bar rows */}
                  {projects.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4">プロジェクトがありません。</p>
                  ) : (
                    <div className="divide-y divide-slate-100 space-y-1">
                      {projects.map((proj: ProjectListItem, index: number) => {
                        // Calculate grid horizontal positions
                        // Months are ordered in months arr. Let's find index in list!
                        const startIndex = months.indexOf(proj.startMonth);
                        const endIndex = months.indexOf(proj.endMonth);
                        
                        // Safety bounds checks
                        const colStart = startIndex !== -1 ? startIndex : 0;
                        const colEnd = endIndex !== -1 ? endIndex : 11;
                        const span = Math.max(colEnd - colStart + 1, 1);

                        // Editable phase label translation
                        const getPhaseLabel = (phase: string) => {
                          if (phase === 'development') return '開発中';
                          if (phase === 'future') return '将来構想';
                          return 'リリース済';
                        };

                        return (
                          <div key={proj.id} className="grid grid-cols-12 items-center py-1 relative group">
                            {/* Left part: project metadata */}
                            <div className="col-span-4 flex items-center justify-between pr-4 space-x-2">
                              <div className="flex-1 min-w-0">
                                {isEditable ? (
                                  <input
                                    type="text"
                                    id={`proj-name-${proj.id}`}
                                    className={`font-semibold text-xs border-b border-transparent hover:border-slate-300 outline-none w-full ${textPrimaryClass}`}
                                    value={proj.name}
                                    onChange={(e) => {
                                      const updated = [...projects];
                                      updated[index] = { ...proj, name: e.target.value };
                                      updateField('projects', updated);
                                    }}
                                    placeholder="プロジェクト名"
                                  />
                                ) : (
                                  <span className={`font-semibold text-xs truncate block ${textPrimaryClass}`} style={fkStyle(`proj-name-${proj.id}`)}>{proj.name || 'プロジェクト名'}</span>
                                )}
                              </div>
                              
                              <div className="shrink-0">
                                {/* Phase selector */}
                                {isEditable ? (
                                  <select
                                    className="text-[9px] bg-slate-100 hover:bg-slate-200 border rounded py-0.2 px-1 outline-none font-medium cursor-pointer"
                                    value={proj.phase}
                                    onChange={(e) => {
                                      const updated = [...projects];
                                      updated[index] = { ...proj, phase: e.target.value as any };
                                      updateField('projects', updated);
                                    }}
                                  >
                                    <option value="development">開発中</option>
                                    <option value="future">将来構想</option>
                                    <option value="released">リリース済</option>
                                  </select>
                                ) : (
                                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded font-sans inline-block whitespace-nowrap ${
                                    proj.phase === 'released' ? 'bg-emerald-100 text-emerald-800' :
                                    proj.phase === 'development' ? 'bg-indigo-100 text-indigo-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {getPhaseLabel(proj.phase)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right part: Horizontal visual bars representation */}
                            <div className="col-span-8 grid grid-cols-12 gap-1 items-center relative h-6 px-1">
                              {/* Background placeholder block */}
                              <div className={`col-span-12 h-4 bg-slate-100/10 border border-slate-200/5 col-start-1 col-end-13 absolute top-1 rounded-xs z-0 pointer-events-none`}></div>

                              {/* Col-span visual Bar */}
                              <div
                                className="h-3.5 rounded-sm relative flex items-center shadow-xs z-10 transition-all cursor-pointer group/bar overflow-hidden"
                                style={{
                                  gridColumnStart: colStart + 1,
                                  gridColumnEnd: colStart + 1 + span,
                                  backgroundColor: proj.color || '#4f46e5'
                                }}
                              >
                                {/* Label inside bar */}
                                <span className="text-[9px] text-white font-extrabold mx-2 shadow-xs drop-shadow-md truncate z-20">
                                  {proj.name}
                                </span>
                              </div>
                            </div>

                            {/* Row Editing Sliders */}
                            {isEditable && (
                              <div className="absolute right-0 bottom-[-15px] hidden group-hover:flex items-center space-x-2 bg-slate-900 border border-slate-700 text-white p-1.5 rounded-lg shadow-xl z-20 text-[10px]">
                                <div className="flex items-center space-x-1">
                                  <span>始:</span>
                                  <select
                                    value={proj.startMonth}
                                    onChange={(e) => {
                                      const updated = [...projects];
                                      updated[index] = { ...proj, startMonth: Number(e.target.value) };
                                      updateField('projects', updated);
                                    }}
                                    className="bg-slate-800 text-white border-0 outline-none text-[10px]"
                                  >
                                    {months.map(m => (<option key={m} value={m}>{m}月</option>))}
                                  </select>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>終:</span>
                                  <select
                                    value={proj.endMonth}
                                    onChange={(e) => {
                                      const updated = [...projects];
                                      updated[index] = { ...proj, endMonth: Number(e.target.value) };
                                      updateField('projects', updated);
                                    }}
                                    className="bg-slate-800 text-white border-0 outline-none text-[10px]"
                                  >
                                    {months.map(m => (<option key={m} value={m}>{m}月</option>))}
                                  </select>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>色:</span>
                                  <input
                                    type="color"
                                    value={proj.color}
                                    onChange={(e) => {
                                      const updated = [...projects];
                                      updated[index] = { ...proj, color: e.target.value };
                                      updateField('projects', updated);
                                    }}
                                    className="w-4 h-4 bg-transparent cursor-pointer border-0 p-0"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = projects.filter(p => p.id !== proj.id);
                                    updateField('projects', updated);
                                  }}
                                  className="text-rose-400 hover:text-rose-600 p-0.5 ml-1"
                                  title="削除"
                                >
                                  <Icons.X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {isEditable && (
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      const newProj: ProjectListItem = {
                        id: `proj-${Date.now()}`,
                        name: '新しいARアプリアライアンス開発',
                        phase: 'development',
                        startMonth: 4,
                        endMonth: 9,
                        progress: 20,
                        color: '#6366f1'
                      };
                      updateField('projects', [...projects, newProj]);
                    }}
                    className={`flex items-center space-x-1 py-1 px-3 border border-dashed rounded-lg text-xs ${isDarkBg ? 'border-white/30 text-white hover:bg-white/10' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Icons.Plus className="w-3.5 h-3.5" />
                    <span>新規プロジェクトをタイムラインに追加</span>
                  </button>
                </div>
              )}
            </div>

            <div className={`text-center text-xs opacity-40 font-mono ${textSecondaryClass}`}>
              FY2026 Timeline Table
            </div>
          </div>
        );
};

// ── project_detail ──
export const ProjectDetailSlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const detail = slide.content.projectDetail || {
          phase: 'development',
          releaseDate: '調整中',
          description: '新規プロダクト。説明が入ります。',
          imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
          links: [],
          videoUrl: '',
          summary: '開発状況に関する総括',
          layout: 'rightImage'
        };

        const embedVideoUrl = getEmbedVideoUrl(detail.videoUrl);
        const projectLayout = detail.layout || 'rightImage';

        const renderLinksContainer = () => (
          <div className={`p-4 rounded-xl ${cardBgClass} flex-grow flex flex-col justify-between border`}>
            <div>
              <span className={`text-[10px] font-extrabold block mb-2 tracking-widest ${theme.text}`}>ATTACHMENTS & LINKS</span>
              
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {detail.links && detail.links.length > 0 ? (
                  detail.links.map((link: any, lIdx: number) => (
                    <div key={link.id} className="flex items-center justify-between text-xs group/link py-0.5 border-b border-dashed border-slate-100">
                      <div className="flex items-center space-x-1.5 overflow-hidden flex-grow mr-2">
                        <Icons.Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {isEditable ? (
                          <div className="grid grid-cols-2 gap-1 flex-grow">
                            <input
                              type="text"
                              className="bg-transparent border-0 outline-none text-[10.5px] font-semibold text-slate-700 truncate"
                              value={link.label}
                              placeholder="名称"
                              onChange={(e) => {
                                const updatedLinks = [...detail.links];
                                updatedLinks[lIdx] = { ...link, label: e.target.value };
                                updateField('projectDetail', { ...detail, links: updatedLinks });
                              }}
                            />
                            <input
                              type="text"
                              className="bg-transparent border-0 outline-none text-[10.5px] text-indigo-400 truncate"
                              value={link.url}
                              placeholder="URL"
                              onChange={(e) => {
                                const updatedLinks = [...detail.links];
                                updatedLinks[lIdx] = { ...link, url: e.target.value };
                                updateField('projectDetail', { ...detail, links: updatedLinks });
                              }}
                            />
                          </div>
                        ) : (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-indigo-600 hover:underline truncate"
                          >
                            {link.label || '名称'}
                          </a>
                        )}
                      </div>
                      
                      {isEditable && (
                        <button
                          onClick={() => {
                            const updatedLinks = detail.links.filter((l: any) => l.id !== link.id);
                            updateField('projectDetail', { ...detail, links: updatedLinks });
                          }}
                          className="text-rose-400 hover:text-rose-600 p-0.5 whitespace-nowrap shrink-0"
                        >
                          <Icons.X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400">貼付リンクが登録されていません。</p>
                )}
              </div>
            </div>

            {isEditable && (
              <button
                onClick={() => {
                  const newLink = {
                    id: `link-${Date.now()}`,
                    label: '新規リンク資料',
                    url: 'https://example.com'
                  };
                  const currentLinks = detail.links || [];
                  updateField('projectDetail', { ...detail, links: [...currentLinks, newLink] });
                }}
                className="text-[10px] text-indigo-500 flex items-center space-x-1 justify-center border border-dashed rounded-lg p-1 hover:bg-slate-100 transition mt-2 cursor-pointer"
              >
                <Icons.Plus className="w-3 h-3" />
                <span>リンクを追加</span>
              </button>
            )}
          </div>
        );

        return (
          <div className="flex flex-col justify-between h-full py-6 px-10">
            {/* Header Title with localized tags */}
            <div className="flex justify-between items-center">
              <div>
                <span className={`text-xs font-mono tracking-widest ${theme.text} uppercase block mb-1`}>PROJECT BRIEF</span>
                <h2 className={`text-2xl font-bold font-display ${textPrimaryClass}`}>{slide.title}</h2>
              </div>
              <div className="flex items-center space-x-2">
                {/* Layout Config Switcher */}
                {isEditable && (
                  <div className="flex items-center space-x-1 bg-slate-100 dark:bg-white/10 p-1 rounded-lg text-[11px] shadow-sm border border-slate-200/50 dark:border-white/5 select-none shrink-0 mr-3">
                    <span className="text-slate-400 px-1 font-sans font-semibold">配置:</span>
                    {(['rightImage', 'leftImage', 'noImage'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          updateField('projectDetail', { ...detail, layout: l });
                        }}
                        className={`px-2 py-1 rounded-md mb-0 transition font-medium ${
                          projectLayout === l
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-750'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        {l === 'rightImage' && '画像右'}
                        {l === 'leftImage' && '画像左'}
                        {l === 'noImage' && '画像なし'}
                      </button>
                    ))}
                  </div>
                )}

                {isEditable ? (
                  <select
                    className="text-xs bg-slate-100 border border-slate-300 rounded px-2 py-0.5 outline-none font-semibold cursor-pointer"
                    value={detail.phase}
                    onChange={(e) => {
                      updateField('projectDetail', { ...detail, phase: e.target.value as any });
                    }}
                  >
                    <option value="development">開発中</option>
                    <option value="future">将来構想 / ロードマップ</option>
                    <option value="released">リリース完了</option>
                  </select>
                ) : (
                  <span className={`text-xs font-black px-2.5 py-1.5 rounded-full font-sans inline-block whitespace-nowrap shadow-xs ${
                    detail.phase === 'released' ? 'bg-emerald-600 text-white' :
                    detail.phase === 'development' ? 'bg-indigo-600 text-white' :
                    'bg-amber-500 text-white'
                  }`}>
                    {detail.phase === 'released' ? '✓ リリース完了' :
                     detail.phase === 'development' ? '⚡ 開発進行中' :
                     '🔮 将来構想プロジェクト'}
                  </span>
                )}
              </div>
            </div>

            <div className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {projectLayout === 'leftImage' && (
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  {/* Image showcase */}
                  <div className="aspect-4/3 overflow-hidden rounded-2xl relative shadow-xs group bg-slate-900 border border-white/5">
                    <img
                      referrerPolicy="no-referrer"
                      src={detail.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      alt="Project Showcase"
                    />
                    {isEditable && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-3 transition duration-200 text-center text-xs text-white">
                        <Icons.Image className="w-5 h-5 mb-1" />
                        <p className="mb-2 text-[10px]">画像URLの上書き</p>
                        <input
                          type="text"
                          className="w-full bg-slate-800 text-white rounded px-2 py-1 text-[10px] outline-none"
                          value={detail.imageUrl}
                          onChange={(e) => {
                            updateField('projectDetail', { ...detail, imageUrl: e.target.value });
                          }}
                          placeholder="https://..."
                        />
                      </div>
                    )}
                  </div>

                  {renderLinksContainer()}
                </div>
              )}

              {/* General details: spreads wide under noImage layout */}
              <div className={`${projectLayout === 'noImage' ? 'lg:col-span-8' : 'lg:col-span-7'} space-y-4 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.2 rounded font-sans uppercase">RELEASE DATE</span>
                    {isEditable ? (
                      <input
                        type="text"
                        id={`pd-releaseDate-${slide.id}`}
                        className={`text-xs font-bold border-b border-transparent hover:border-slate-300 outline-none w-48 ${textPrimaryClass}`}
                        value={detail.releaseDate}
                        onChange={(e) => {
                          updateField('projectDetail', { ...detail, releaseDate: e.target.value });
                        }}
                        placeholder="リリース日など"
                      />
                    ) : (
                      <span className={`text-xs font-bold ${theme.text}`} style={fkStyle(`pd-releaseDate-${slide.id}`)}>{detail.releaseDate || 'リリース日など'}</span>
                    )}
                  </div>

                  {isEditable ? (
                    <textarea
                      rows={3}
                      id={`pd-description-${slide.id}`}
                      className={`w-full text-xs outline-none bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 p-1.5 resize-none leading-relaxed rounded ${textPrimaryClass}`}
                      value={detail.description}
                      onChange={(e) => {
                        updateField('projectDetail', { ...detail, description: e.target.value });
                      }}
                      placeholder="プロジェクトの詳細説明を記入してください"
                    />
                  ) : (
                    <p className={`text-xs leading-relaxed ${textSecondaryClass}`} style={fkStyle(`pd-description-${slide.id}`)}>{detail.description || 'プロジェクトの詳細説明を記入してください'}</p>
                  )}
                </div>

                {/* Direct Inline Video Playback area */}
                {embedVideoUrl ? (
                  <div className="w-full aspect-video rounded-xl overflow-hidden shadow-xs relative bg-black/20 border border-white/5">
                    {isYouTubeUrl(detail.videoUrl) ? (
                      <iframe
                        src={embedVideoUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Project Video Player"
                      ></iframe>
                    ) : (
                      <video src={detail.videoUrl} controls className="w-full h-full object-cover" />
                    )}
                  </div>
                ) : (
                  isEditable && (
                    <div className="p-3 border border-dashed rounded-xl bg-slate-500/5 text-center text-xs">
                      <p className="text-slate-400 mb-1">動画リンク未設定 (YouTubeやMP4のURLを入力すると、この場で動画を再生させられます)</p>
                    </div>
                  )
                )}

                {/* Edit Video Url field */}
                {isEditable && (
                  <div className="flex items-center space-x-1 text-xs">
                    <Icons.Video className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">動画URL:</span>
                    <input
                      type="text"
                      className="bg-slate-100 dark:bg-slate-800 dark:text-white px-2 py-0.5 rounded text-[11px] flex-grow outline-none border border-transparent focus:border-indigo-500"
                      value={detail.videoUrl}
                      onChange={(e) => {
                        updateField('projectDetail', { ...detail, videoUrl: e.target.value });
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                )}

                {/* Project Status Summary */}
                <div className={`p-4 rounded-xl border border-dashed ${isDarkBg ? 'bg-white/5 border-white/20' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                  <span className="text-[10px] font-mono font-black text-slate-400 block tracking-widest">DEVELOPMENT STATUS SUMMARY (総括)</span>
                  {isEditable ? (
                    <textarea
                      rows={2}
                      id={`pd-summary-${slide.id}`}
                      className={`w-full text-xs outline-none bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 p-1 resize-none leading-relaxed rounded ${textPrimaryClass}`}
                      value={detail.summary}
                      onChange={(e) => {
                        updateField('projectDetail', { ...detail, summary: e.target.value });
                      }}
                      placeholder="開発状況の総括を入力してまとめを記載します"
                    />
                  ) : (
                    <p className={`text-xs leading-relaxed ${textSecondaryClass}`} style={fkStyle(`pd-summary-${slide.id}`)}>{detail.summary || '開発状況の総括を入力してまとめを記載します'}</p>
                  )}
                </div>
              </div>

              {projectLayout === 'rightImage' && (
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  {/* Image showcase */}
                  <div className="aspect-4/3 overflow-hidden rounded-2xl relative shadow-xs group bg-slate-900 border border-white/5">
                    <img
                      referrerPolicy="no-referrer"
                      src={detail.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      alt="Project Showcase"
                    />
                    {isEditable && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-3 transition duration-200 text-center text-xs text-white">
                        <Icons.Image className="w-5 h-5 mb-1" />
                        <p className="mb-2 text-[10px]">画像URLの上書き</p>
                        <input
                          type="text"
                          className="w-full bg-slate-800 text-white rounded px-2 py-1 text-[10px] outline-none"
                          value={detail.imageUrl}
                          onChange={(e) => {
                            updateField('projectDetail', { ...detail, imageUrl: e.target.value });
                          }}
                          placeholder="https://..."
                        />
                      </div>
                    )}
                  </div>

                  {renderLinksContainer()}
                </div>
              )}

              {projectLayout === 'noImage' && (
                <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                  {/* Decorative side badge instead of picture */}
                  <div className={`p-5 rounded-2xl ${cardBgClass} border border-indigo-500/10 flex flex-col justify-center items-center text-center py-8 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400">
                      <Icons.Activity className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">PROJECT PHASE</span>
                    <h4 className={`text-base font-bold mt-1 ${theme.text}`}>
                      {detail.phase === 'released' ? 'リリース完了' :
                       detail.phase === 'development' ? '新規開発進行中' :
                       '将来構想計画'}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-normal mt-1.5 max-w-[200px]">
                      画像表示の代わりに、ドキュメントリンクや外部ファイルの添付リストを表示しています。
                    </p>
                  </div>

                  {renderLinksContainer()}
                </div>
              )}
            </div>
            <div className="h-2"></div>
          </div>
        );
};

// ── future_initiatives ──
export const FutureInitiativesSlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const introText = slide.content.introText || (isEditable ? '' : '導入・リード文を記載してください');
        const initiatives = slide.content.initiatives || [];
        const initiativesLayout = slide.content.initiativesLayout || 'grid';

        const containerClass = initiativesLayout === 'rows'
          ? "my-auto py-1 flex flex-col gap-3 overflow-y-auto pr-1 max-h-72"
          : "my-auto py-1 grid grid-cols-1 md:grid-cols-3 gap-6";

        return (
          <div className="flex flex-col justify-between h-full py-6 px-10">
            <div className="flex justify-between items-center">
              <div>
                <span className={`text-xs font-mono tracking-widest ${theme.text} uppercase block mb-1`}>NEXT INITIATIVES</span>
                <h2 className={`text-2xl font-bold font-display ${textPrimaryClass}`}>{slide.title}</h2>
              </div>

              {/* Layout Switcher */}
              {isEditable && (
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-white/10 p-1 rounded-lg text-[11px] shadow-sm border border-slate-200/50 dark:border-white/5 select-none shrink-0">
                  <span className="text-slate-400 px-1 font-sans font-semibold">レイアウト:</span>
                  {(['grid', 'rows'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        updateField('initiativesLayout', l);
                      }}
                      className={`px-2 py-0.5 rounded transition font-medium ${
                        initiativesLayout === l
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-750'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {l === 'grid' && 'グリッド'}
                      {l === 'rows' && '縦型リスト'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Intro paragraph */}
            <div className={`py-2 max-w-4xl border-b ${isDarkBg ? 'border-white/10' : 'border-slate-101'}`}>
              {isEditable ? (
                <textarea
                  id={`introText-${slide.id}`}
                  rows={2}
                  className={`w-full text-xs outline-none bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 p-1.5 resize-none leading-relaxed rounded ${textPrimaryClass}`}
                  value={introText}
                  onChange={(e) => updateField('introText', e.target.value)}
                  placeholder="導入・リード文を記載してください"
                />
              ) : (
                <p className={`text-xs leading-relaxed ${textSecondaryClass}`} style={fkStyle(`introText-${slide.id}`)}>{introText}</p>
              )}
            </div>

            {/* Initiatives grid or vertical rows lists */}
            <div className={containerClass}>
              {initiatives.map((init: any, idx: number) => {
                if (initiativesLayout === 'rows') {
                  return (
                    <div
                      key={init.id}
                      className={`p-3.5 rounded-xl ${cardBgClass} border relative group hover:scale-[1.005] transition duration-300 flex items-center space-x-4`}
                    >
                      {isEditable && (
                        <button
                          onClick={() => {
                            const updated = initiatives.filter((i: any) => i.id !== init.id);
                            updateField('initiatives', updated);
                          }}
                          className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 p-0.5 z-10"
                        >
                          <Icons.X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Left side: Massive styled number index */}
                      <div className="shrink-0 flex flex-col items-center justify-center w-12 border-r border-slate-100 dark:border-white/5 pr-4 select-none">
                        <span className={`text-xl font-display font-black leading-none ${theme.text}`}>0{idx + 1}</span>
                        <Icons.CheckCircle2 className={`w-3.5 h-3.5 opacity-20 mt-1 ${theme.text}`} />
                      </div>

                      {/* Right side fields layout */}
                      <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-4 pr-2">
                          {isEditable ? (
                            <input
                              type="text"
                              id={`init-title-${init.id}`}
                              className={`font-bold text-xs border-b border-transparent hover:border-slate-300 outline-none w-full ${textPrimaryClass}`}
                              value={init.title}
                              onChange={(e) => {
                                const updated = [...initiatives];
                                updated[idx] = { ...init, title: e.target.value };
                                updateField('initiatives', updated);
                              }}
                              placeholder="取り組みの見出し"
                            />
                          ) : (
                            <h4 className={`font-bold text-xs leading-tight ${textPrimaryClass}`} style={fkStyle(`init-title-${init.id}`)}>{init.title || '取り組みの見出し'}</h4>
                          )}
                        </div>

                        <div className="md:col-span-8">
                          {isEditable ? (
                            <textarea
                              rows={1}
                              id={`init-desc-${init.id}`}
                              className={`w-full text-[11px] outline-none bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 p-1 resize-none leading-relaxed rounded ${textSecondaryClass}`}
                              value={init.description}
                              onChange={(e) => {
                                const updated = [...initiatives];
                                updated[idx] = { ...init, description: e.target.value };
                                updateField('initiatives', updated);
                              }}
                              placeholder="説明文を入力"
                            />
                          ) : (
                            <p className={`text-[11px] leading-relaxed ${textSecondaryClass}`} style={fkStyle(`init-desc-${init.id}`)}>{init.description || '説明文を入力'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Grid layout
                return (
                  <div key={init.id} className={`p-5 rounded-2xl ${cardBgClass} border relative group hover:scale-101 hover:shadow-md transition duration-300 flex flex-col justify-between`}>
                    {isEditable && (
                      <button
                        onClick={() => {
                          const updated = initiatives.filter((i: any) => i.id !== init.id);
                          updateField('initiatives', updated);
                        }}
                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 p-0.5 z-10"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <div>
                      {/* Visual massive Number index */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-2xl font-display font-black leading-none ${theme.text}`}>0{idx + 1}</span>
                        <Icons.CheckCircle2 className={`w-4 h-4 opacity-30 ${theme.text}`} />
                      </div>

                      <div className="space-y-2">
                        {isEditable ? (
                          <input
                            type="text"
                            id={`init-title-${init.id}`}
                            className={`font-semibold text-xs border-b border-transparent hover:border-slate-300 outline-none w-full ${textPrimaryClass}`}
                            value={init.title}
                            onChange={(e) => {
                              const updated = [...initiatives];
                              updated[idx] = { ...init, title: e.target.value };
                              updateField('initiatives', updated);
                            }}
                            placeholder="取り組みの見出し"
                          />
                        ) : (
                          <h4 className={`font-semibold text-xs leading-tight ${textPrimaryClass}`} style={fkStyle(`init-title-${init.id}`)}>{init.title || '取り組みの見出し'}</h4>
                        )}

                        {isEditable ? (
                          <textarea
                            rows={4}
                            id={`init-desc-${init.id}`}
                            className={`w-full text-[11px] outline-none bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 p-1.5 resize-none leading-relaxed rounded ${textSecondaryClass}`}
                            value={init.description}
                            onChange={(e) => {
                              const updated = [...initiatives];
                              updated[idx] = { ...init, description: e.target.value };
                              updateField('initiatives', updated);
                            }}
                            placeholder="説明文を入力"
                          />
                        ) : (
                          <p className={`text-[11px] leading-relaxed ${textSecondaryClass}`} style={fkStyle(`init-desc-${init.id}`)}>{init.description || '説明文を入力'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isEditable && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => {
                    const newInit = {
                      id: `init-${Date.now()}`,
                      title: '④ 追加のアクションプラン項目',
                      description: '項目を追加してください。ビジョンや今後の具体的なマイルストーンを記載します。'
                    };
                    updateField('initiatives', [...initiatives, newInit]);
                  }}
                  className={`flex items-center space-x-1.5 text-xs py-1 px-3 border border-dashed rounded-lg ${isDarkBg ? 'border-white/30 text-white hover:bg-white/10' : 'border-slate-300 text-slate-600 hover:bg-slate-50'} cursor-pointer`}
                >
                  <Icons.Plus className="w-3.5 h-3.5" />
                  <span>項目カードを追加</span>
                </button>
              </div>
            )}
            
            <div className="h-2"></div>
          </div>
        );
};

// ── announcements ──
export const AnnouncementsSlide = (ctx: SlideCtx) => {
  const { slide, allSlides, isEditable, theme, isDarkBg, textPrimaryClass, textSecondaryClass, cardBgClass, updateField, fkStyle, getEmbedVideoUrl, isYouTubeUrl } = ctx;
        const list = slide.content.announcementsList || [];
        const closingMsg = slide.content.closingMessage || (isEditable ? '' : '最後のメッセージ文を入力してください');

        return (
          <div className="flex flex-col justify-between h-full py-6 px-10">
            <div>
              <span className={`text-xs font-mono tracking-widest ${theme.text} uppercase block mb-1`}>CLOSING & SCHEDULE</span>
              <h2 className={`text-2xl font-bold font-display ${textPrimaryClass}`}>{slide.title}</h2>
            </div>

            {/* List schedules */}
            <div className="my-auto space-y-3 max-w-4xl mx-auto w-full">
              {list.map((ann: any, idx: number) => (
                <div key={ann.id} className={`p-3.5 rounded-xl ${cardBgClass} border relative group flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition hover:scale-101 hover:shadow-xs`}>
                  {isEditable && (
                    <button
                      onClick={() => {
                        const updated = list.filter((a: any) => a.id !== ann.id);
                        updateField('announcementsList', updated);
                      }}
                      className="absolute top-1.5 right-1.5 text-slate-400 hover:text-rose-500 p-0.5"
                    >
                      <Icons.X className="w-3 h-3" />
                    </button>
                  )}

                  <div className="flex items-center space-x-3 md:w-1/4 shrink-0">
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${isDarkBg ? 'bg-indigo-900/30 text-indigo-200' : theme.bgLight + ' ' + theme.text}`}>
                      {isEditable ? (
                        <input
                          type="text"
                          className="w-full text-center bg-transparent border-0 outline-none"
                          value={ann.date}
                          onChange={(e) => {
                            const updated = [...list];
                            updated[idx] = { ...ann, date: e.target.value };
                            updateField('announcementsList', updated);
                          }}
                          placeholder="日付"
                        />
                      ) : (
                        ann.date || '日付'
                      )}
                    </span>
                  </div>

                  <div className="md:w-3/4 text-left">
                    {isEditable ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          id={`ann-title-${ann.id}`}
                          className={`font-semibold text-xs border-b border-transparent hover:border-slate-300 outline-none w-full ${textPrimaryClass}`}
                          value={ann.title}
                          onChange={(e) => {
                            const updated = [...list];
                            updated[idx] = { ...ann, title: e.target.value };
                            updateField('announcementsList', updated);
                          }}
                          placeholder="お知らせの見出し"
                        />
                        <textarea
                          rows={1}
                          id={`ann-text-${ann.id}`}
                          className={`w-full text-[11px] outline-none bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-slate-400 p-0.5 resize-none leading-relaxed ${textSecondaryClass}`}
                          value={ann.text}
                          onChange={(e) => {
                            const updated = [...list];
                            updated[idx] = { ...ann, text: e.target.value };
                            updateField('announcementsList', updated);
                          }}
                          placeholder="内容を入力"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className={`font-semibold text-xs ${textPrimaryClass}`} style={fkStyle(`ann-title-${ann.id}`)}>{ann.title || 'お知らせの見出し'}</h4>
                        <p className={`text-[11px] leading-relaxed ${textSecondaryClass} mt-0.5`} style={fkStyle(`ann-text-${ann.id}`)}>{ann.text || '内容を入力'}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {isEditable && (
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => {
                      const newAnn = {
                        id: `ann-${Date.now()}`,
                        date: '12月上旬',
                        title: '新しいスケジュール記載',
                        text: 'スケジュールの説明をここに入力します。'
                      };
                      updateField('announcementsList', [...list, newAnn]);
                    }}
                    className="text-[10px] text-indigo-500 flex items-center space-x-1.5 py-1 px-3 border border-dashed rounded-lg"
                  >
                    <Icons.Plus className="w-3.5 h-3.5" />
                    <span>スケジュール行を追加</span>
                  </button>
                </div>
              )}
            </div>

            {/* Closing message board banner */}
            <div className={`mt-auto text-center py-4 px-6 rounded-xl ${isDarkBg ? 'bg-indigo-900/20 text-indigo-200 border border-indigo-500/25' : 'bg-slate-100 text-slate-700'}`}>
              {isEditable ? (
                <input
                  type="text"
                  id={`closingMessage-${slide.id}`}
                  className="w-full text-xs font-bold text-center bg-transparent border-0 outline-none text-slate-900 font-display"
                  style={{ color: isDarkBg ? '#fff' : '#0f172a' }}
                  value={closingMsg}
                  onChange={(e) => updateField('closingMessage', e.target.value)}
                  placeholder="最後のメッセージ文を入力してください"
                />
              ) : (
                <p className="text-xs font-bold leading-relaxed font-display" style={fkStyle(`closingMessage-${slide.id}`)}>{closingMsg}</p>
              )}
            </div>
            
            <div className="h-2"></div>
          </div>
        );
};

export const renderSlideBody = (ctx: SlideCtx) => {
  switch (ctx.slide.type) {
    case 'title': return TitleSlide(ctx);
    case 'title_only': return TitleOnlySlide(ctx);
    case 'vision': return VisionSlide(ctx);
    case 'toc': return TocSlide(ctx);
    case 'staff': return StaffSlide(ctx);
    case 'financial_past3': return FinancialPast3Slide(ctx);
    case 'financial_monthly': return FinancialMonthlySlide(ctx);
    case 'financial_summary': return FinancialSummarySlide(ctx);
    case 'project_list': return ProjectListSlide(ctx);
    case 'project_detail': return ProjectDetailSlide(ctx);
    case 'future_initiatives': return FutureInitiativesSlide(ctx);
    case 'announcements': return AnnouncementsSlide(ctx);
    default:
      return <div className="p-10 text-center text-slate-400">未知のスライド形式です</div>;
  }
};
