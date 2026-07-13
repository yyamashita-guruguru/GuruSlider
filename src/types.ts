// Slide type discriminator (matches Slide.type). Kept as a string alias so new
// slide kinds can be added without touching this union.
export type SlideType = string;

export type LayoutType = 'centered' | 'split' | 'grid' | 'editorial';
export type ProjectLayoutType = 'right' | 'left' | 'none';
export type FutureLayoutType = 'grid' | 'row';

// ── Slide content item types (used across the slide renderers) ──
export interface StaffMember {
  id: string;
  name: string;
  role: string;
  description: string;
  iconType?: string;
  imageUrl?: string;
}

export interface PastTermData {
  term: string;
  revenue: number;
  profit?: number;
}

export interface MonthlySalesData {
  month: string;
  revenue: number;
  target: number;
}

export interface ProjectListItem {
  id: string;
  name: string;
  phase?: string;
  startMonth: number;
  endMonth: number;
  progress?: number;
  color?: string;
}

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image';
  value: string; // Hex color, CSS gradient, or Image URL (or data URL)

  // Base image adjustments
  size?: string;       // 'cover' | 'contain' | 'auto' | '120%' etc.
  position?: string;   // CSS background-position, e.g. '50% 20%'
  opacity?: number;    // 0-95 dim overlay over the base image

  // Overlay image (logo / decorative layer) drawn on TOP of the base
  overlayImage?: string;   // image URL or data URL ('' / undefined = none)
  overlayX?: number;       // 0-100 (% horizontal center)
  overlayY?: number;       // 0-100 (% vertical center)
  overlaySize?: number;    // overlay width as % of the slide width
  overlayOpacity?: number; // 0-100

  // Link to a named background preset (for batch editing)
  presetId?: string;
}

// Legacy alias used across the app
export type SlideBackground = BackgroundConfig;

export interface BackgroundPreset {
  id: string;
  name: string;
  background: BackgroundConfig;
}

export interface SlideContent {
  [key: string]: any;
}

export interface Slide {
  id: string;
  type: string;
  title: string;
  showInterstitial: boolean;
  interstitialSubtitle: string;
  background?: BackgroundConfig;
  content: SlideContent;
}

export interface PresentationConfig {
  themeColor: string;
  globalBackground: BackgroundConfig;
  companyName: string;
  backgroundPresets?: BackgroundPreset[];
}
