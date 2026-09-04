import type { Metadata } from 'next';

import { CreativePortfolioPreview } from './CreativePortfolioPreview';

export const metadata: Metadata = {
  title: 'Creative Preview · Aster.H',
  description: 'A motion-led visual preview for the Starry Summer content archive.',
  robots: { index: false, follow: false },
};

export default function CreativePreviewPage() {
  return <CreativePortfolioPreview />;
}
