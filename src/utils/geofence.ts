import * as Location from 'expo-location';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Calculate ETA based on current speed and distance
 * Returns ETA in minutes
 */
export function calculateETA(distanceMeters: number, speedMps: number): number | null {
    if (!speedMps || speedMps < 0.5) {
        // If speed is too low or zero, can't calculate ETA
        return null;
    }
    const timeSeconds = distanceMeters / speedMps;
    return Math.round(timeSeconds / 60); // Convert to minutes
}

/**
 * Format ETA for display
 */
export function formatETA(minutes: number | null): string {
    if (minutes === null) {
        return 'Calculating...';
    }
    if (minutes < 1) {
        return 'Less than 1 min';
    }
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

/**
 * Format speed for display
 */
export function formatSpeed(speedMps: number | null): string {
    if (speedMps === null || speedMps < 0) {
        return '0 km/h';
    }
    const speedKmh = speedMps * 3.6; // Convert m/s to km/h
    return `${Math.round(speedKmh)} km/h`;
}

/**
 * Determine GPS accuracy level based on distance to destination
 */
export function getLocationAccuracy(
    distanceToDestination: number,
    highAccuracyThreshold: number,
    mediumAccuracyThreshold: number
): Location.LocationAccuracy {
    if (distanceToDestination > highAccuracyThreshold) {
        return Location.LocationAccuracy.Low;
    } else if (distanceToDestination > mediumAccuracyThreshold) {
        return Location.LocationAccuracy.Balanced;
    } else {
        return Location.LocationAccuracy.High;
    }
}

/**
 * Get update interval based on distance to destination (in milliseconds)
 */
export function getUpdateInterval(
    distanceToDestination: number,
    highAccuracyThreshold: number,
    mediumAccuracyThreshold: number
): number {
    if (distanceToDestination > highAccuracyThreshold) {
        return 120000; // 2 minutes
    } else if (distanceToDestination > mediumAccuracyThreshold) {
        return 30000; // 30 seconds
    } else {
        return 10000; // 10 seconds
    }
}
