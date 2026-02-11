export interface Destination {
    latitude: number;
    longitude: number;
    name: string;
    address?: string;
}

export interface TrackingState {
    isTracking: boolean;
    destination: Destination | null;
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
    distanceRemaining: number | null;
    currentSpeed: number | null;
    eta: number | null;
}

export interface GeofenceConfig {
    triggerRadius: number; // in meters (default 1000m = 1km)
    highAccuracyThreshold: number; // distance in meters to switch to high accuracy (default 10000m = 10km)
    mediumAccuracyThreshold: number; // distance in meters for medium accuracy (default 2000m = 2km)
}

export const DEFAULT_GEOFENCE_CONFIG: GeofenceConfig = {
    triggerRadius: 1000,
    highAccuracyThreshold: 10000,
    mediumAccuracyThreshold: 2000,
};
