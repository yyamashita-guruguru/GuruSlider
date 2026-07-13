import { Slide, PresentationConfig } from './types';

export const DEFAULT_CONFIG: PresentationConfig = {
  themeColor: 'indigo',
  globalBackground: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' // Premium clean light gray-blue gradient
  },
  companyName: '株式会社ぐるぐる',
  backgroundPresets: []
};

export const INITIAL_SLIDES: Slide[] = [
  {
    id: 'slide-1',
    type: 'title',
    title: '表紙',
    showInterstitial: false,
    interstitialSubtitle: 'TOP',
    background: {
      type: 'solid',
      value: '#ffffff'
    },
    content: {
      badgeLabel: '',
      titleMain: '',
      dateText: '',
      companyName: '',
      address: '',
      websiteUrl: '',
      badgeColor: '#0f172a'
    }
  }
];