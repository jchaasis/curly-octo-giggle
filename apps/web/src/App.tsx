import { Suspense, useEffect } from 'react';
import { useLocationStore } from '@/stores/locationStore';
import { readPersistedLocation, useLocation } from '@/hooks/useLocation';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { LocationModal } from '@/components/LocationModal/LocationModal';
import { Header } from '@/components/Header/Header';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SunPanelContainer } from '@/components/SunPanel/SunPanelContainer';
import { AuroraCardContainer } from '@/components/AuroraCard/AuroraCardContainer';
import { AlertTickerContainer } from '@/components/AlertTicker/AlertTickerContainer';
import { SolarWindCardContainer } from '@/components/SolarWindCard/SolarWindCardContainer';
import { KpGaugeContainer } from '@/components/KpGauge/KpGaugeContainer';
import { FlareListContainer } from '@/components/FlareList/FlareListContainer';

function SkeletonCard() {
  return <div className="h-32 rounded-lg bg-muted animate-pulse" />;
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
    // Run once on mount only — setLocation is stable (Zustand action reference never changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (lat === null || lon === null) {
    return <LocationModal />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        displayName={displayName}
        lastSyncedAt={lastSyncedAt}
        onSync={triggerSync}
        onSwitchLocation={clearLocation}
      />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 p-4">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <ErrorBoundary panelName="Sun">
            <Suspense fallback={<SkeletonCard />}>
              <SunPanelContainer />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary panelName="Aurora">
            <Suspense fallback={<SkeletonCard />}>
              <AuroraCardContainer />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary panelName="Alerts">
            <Suspense fallback={<SkeletonCard />}>
              <AlertTickerContainer />
            </Suspense>
          </ErrorBoundary>
        </div>
        {/* Right column */}
        <div className="flex flex-col gap-4">
          <ErrorBoundary panelName="Solar Wind">
            <Suspense fallback={<SkeletonCard />}>
              <SolarWindCardContainer />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary panelName="Kp Index">
            <Suspense fallback={<SkeletonCard />}>
              <KpGaugeContainer />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary panelName="Flares">
            <Suspense fallback={<SkeletonCard />}>
              <FlareListContainer />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
