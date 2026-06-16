import type { Metadata } from 'next';

import { FleetFlagshipCanvas } from '@/components/FleetFlagshipCanvas';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Fleet Flagship Night Concept',
};

export default function FleetFlagshipPreviewPage() {
  return (
    <main className={styles.page} aria-label="Fleet flagship night concept preview">
      <FleetFlagshipCanvas className={styles.canvas} />
      <div className={styles.grain} aria-hidden="true" />
      <section className={styles.overlay}>
        <p className={styles.label}>Concept Canvas / Original Fleet Flagship</p>
        <h1 className={styles.title}>Astra Veyron Flagship</h1>
        <p className={styles.brief}>
          A sharp long-hull command ship with a thick central body, raised bridge, silver-gray armor layers, and restrained
          blue propulsion light.
        </p>
      </section>
    </main>
  );
}
