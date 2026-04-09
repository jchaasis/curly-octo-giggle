import { Suspense, useEffect } from 'react';
import { useLocationStore } from '@/stores/locationStore';
import { readPersistedLocation, useLocation } from '@/hooks/useLocation';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { LocationModal } from '@/components/LocationModal/LocationModal';
import { Header } from '@/components/Header/Header';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { StarfieldCanvas } from '@/components/StarfieldCanvas/StarfieldCanvas';
import { SunPanelContainer } from '@/components/SunPanel/SunPanelContainer';
import { AuroraCardContainer } from '@/components/AuroraCard/AuroraCardContainer';
import { AlertTickerContainer } from '@/components/AlertTicker/AlertTickerContainer';
import { SolarWindCardContainer } from '@/components/SolarWindCard/SolarWindCardContainer';
import { KpGaugeContainer } from '@/components/KpGauge/KpGaugeContainer';
import { FlareListContainer } from '@/components/FlareList/FlareListContainer';

function SkeletonRow() {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--s-border)' }}>
      <div style={{ height: 8, width: 120, background: 'var(--s-tx3)', marginBottom: 12, animation: 'solaris-pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 60, background: 'var(--s-tx3)', animation: 'solaris-pulse 1.5s ease-in-out infinite' }} />
    </div>
  );
}

export default function App() {
  const { setLocation } = useLocationStore();
  const { lat, lon, displayName, clearLocation } = useLocation();
  const { lastSyncedAt, triggerSync } = useAutoRefresh();

  useEffect(() => {
    const persisted = readPersistedLocation();
    if (persisted) {
      setLocation({ lat: persisted.lat, lon: persisted.lon, displayName: persisted.displayName });
    }
    // Run once on mount — setLocation is stable (Zustand action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (lat === null || lon === null) {
    return (
      <>
        <StarfieldCanvas />
        <LocationModal />
      </>
    );
  }

  return (
    <>
      {/* Fixed starfield behind everything */}
      <StarfieldCanvas />

      {/* App shell — full viewport, no scroll at shell level */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <ErrorBoundary panelName="Header">
          <Header
            displayName={displayName}
            lastSyncedAt={lastSyncedAt}
            onSync={triggerSync}
            onSwitchLocation={clearLocation}
          />
        </ErrorBoundary>

        {/* Two-column main area */}
        <main className="solaris-main" style={{ flex: 1, minHeight: 0 }}>
          {/* LEFT — sun + aurora, centered, no scroll */}
          <div className="solaris-left-panel" style={{ padding: 20, position: 'relative' }}>
            {/* Radial glow behind sun */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -52%)',
              width: 340, height: 340,
              background: 'radial-gradient(circle, rgba(255,100,0,0.12) 0%, transparent 65%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }} />

            <ErrorBoundary panelName="Sun">
              <Suspense fallback={null}>
                <SunPanelContainer />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary panelName="Aurora">
              <Suspense fallback={null}>
                <AuroraCardContainer />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* RIGHT — data cards, scrollable */}
          <div className="solaris-right-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <ErrorBoundary panelName="Solar Wind">
              <Suspense fallback={<SkeletonRow />}>
                <SolarWindCardContainer />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary panelName="Kp Index">
              <Suspense fallback={<SkeletonRow />}>
                <KpGaugeContainer />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary panelName="Flares">
              <Suspense fallback={<SkeletonRow />}>
                <FlareListContainer />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>

        {/* BOTTOM — alert ticker */}
        <ErrorBoundary panelName="Alerts">
          <Suspense fallback={null}>
            <AlertTickerContainer />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}
