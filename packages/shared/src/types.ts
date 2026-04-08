export interface SolarWind {
  time_tag: string;
  speed: number | null;
  density: number | null;
  temperature: number | null;
}

export interface MagReading {
  time_tag: string;
  bz: number | null;
}

export interface KpReading {
  time_tag: string;
  kp: number;
  source: 'primary' | 'fallback';
}

export interface Flare {
  begin_time: string;
  peak_time: string | null;
  end_time: string | null;
  class_letter: string;
  scale: string;
  linked_events: string[] | null;
}

export interface Alert {
  issue_time: string;
  product_id: string;
  message: string;
}

export interface GeoLocation {
  city: string;
  latitude: number;
  longitude: number;
  displayName: string;
}
