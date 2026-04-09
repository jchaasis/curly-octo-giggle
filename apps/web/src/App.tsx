import { useEffect } from 'react';
import { useLocationStore } from '@/stores/locationStore';
import { readPersistedLocation } from '@/hooks/useLocation';
import { LocationModal } from '@/components/LocationModal/LocationModal';

export default function App() {
  const { lat, lon, displayName, setLocation } = useLocationStore();

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
    <div>
      <p>Dashboard — {displayName}</p>
    </div>
  );
}
