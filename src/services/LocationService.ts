import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance, getLocationAccuracy, getUpdateInterval } from '../utils/geofence';
import { Destination, DEFAULT_GEOFENCE_CONFIG } from '../types';
import { triggerAlarm } from './AlarmService';

const LOCATION_TASK_NAME = 'background-location-task';
const STORAGE_KEY_DESTINATION = '@namma_stop_destination';
const STORAGE_KEY_TRACKING = '@namma_stop_tracking';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('Background location error:', error);
        return;
    }

    if (data) {
        const { locations } = data as any;
        const location = locations[0];

        try {
            // Get stored destination
            const destinationJson = await AsyncStorage.getItem(STORAGE_KEY_DESTINATION);
            if (!destinationJson) {
                return;
            }

            const destination: Destination = JSON.parse(destinationJson);

            // Calculate distance to destination
            const distance = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                destination.latitude,
                destination.longitude
            );

            console.log(`Distance to destination: ${distance}m`);

            // Check if within trigger radius (1km)
            if (distance <= DEFAULT_GEOFENCE_CONFIG.triggerRadius) {
                console.log('Entered geofence! Triggering alarm...');
                await triggerAlarm(destination.name, distance);

                // Stop tracking after alarm is triggered
                await stopTracking();
            }
        } catch (err) {
            console.error('Error processing location:', err);
        }
    }
});

export class LocationService {
    private static watchSubscription: Location.LocationSubscription | null = null;

    /**
     * Request location permissions
     */
    static async requestPermissions(): Promise<boolean> {
        try {
            // Request foreground permission first
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

            if (foregroundStatus !== 'granted') {
                return false;
            }

            // Request background permission
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

            return backgroundStatus === 'granted';
        } catch (error) {
            console.error('Error requesting permissions:', error);
            return false;
        }
    }

    /**
     * Check if location permissions are granted
     */
    static async hasPermissions(): Promise<boolean> {
        const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
        const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

        return foregroundStatus === 'granted' && backgroundStatus === 'granted';
    }

    /**
     * Get current location
     */
    static async getCurrentLocation(): Promise<Location.LocationObject | null> {
        try {
            const hasPermission = await this.hasPermissions();
            if (!hasPermission) {
                return null;
            }

            return await Location.getCurrentPositionAsync({
                accuracy: Location.LocationAccuracy.High,
            });
        } catch (error) {
            console.error('Error getting current location:', error);
            return null;
        }
    }

    /**
     * Start tracking with battery optimization
     */
    static async startTracking(destination: Destination): Promise<boolean> {
        try {
            const hasPermission = await this.hasPermissions();
            if (!hasPermission) {
                console.error('Location permissions not granted');
                return false;
            }

            // Store destination
            await AsyncStorage.setItem(STORAGE_KEY_DESTINATION, JSON.stringify(destination));
            await AsyncStorage.setItem(STORAGE_KEY_TRACKING, 'true');

            // Start background location updates
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.LocationAccuracy.Balanced,
                timeInterval: 30000, // 30 seconds
                distanceInterval: 100, // 100 meters
                foregroundService: {
                    notificationTitle: 'Namma Stop Active',
                    notificationBody: `Tracking to ${destination.name}`,
                    notificationColor: '#2196F3',
                },
                pausesUpdatesAutomatically: false,
                showsBackgroundLocationIndicator: true,
            });

            console.log('Background tracking started');
            return true;
        } catch (error) {
            console.error('Error starting tracking:', error);
            return false;
        }
    }

    /**
     * Stop tracking
     */
    static async stopTracking(): Promise<void> {
        try {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
            if (isRegistered) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }

            if (this.watchSubscription) {
                this.watchSubscription.remove();
                this.watchSubscription = null;
            }

            await AsyncStorage.removeItem(STORAGE_KEY_DESTINATION);
            await AsyncStorage.setItem(STORAGE_KEY_TRACKING, 'false');

            console.log('Tracking stopped');
        } catch (error) {
            console.error('Error stopping tracking:', error);
        }
    }

    /**
     * Check if currently tracking
     */
    static async isTracking(): Promise<boolean> {
        try {
            const tracking = await AsyncStorage.getItem(STORAGE_KEY_TRACKING);
            return tracking === 'true';
        } catch (error) {
            return false;
        }
    }

    /**
     * Get stored destination
     */
    static async getDestination(): Promise<Destination | null> {
        try {
            const destinationJson = await AsyncStorage.getItem(STORAGE_KEY_DESTINATION);
            if (!destinationJson) {
                return null;
            }
            return JSON.parse(destinationJson);
        } catch (error) {
            return null;
        }
    }

    /**
     * Watch location with foreground updates (for UI)
     */
    static async watchLocation(
        callback: (location: Location.LocationObject) => void
    ): Promise<void> {
        try {
            const hasPermission = await this.hasPermissions();
            if (!hasPermission) {
                return;
            }

            // Remove existing subscription
            if (this.watchSubscription) {
                this.watchSubscription.remove();
            }

            // Start watching
            this.watchSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.LocationAccuracy.High,
                    timeInterval: 5000, // 5 seconds for UI updates
                    distanceInterval: 50, // 50 meters
                },
                callback
            );
        } catch (error) {
            console.error('Error watching location:', error);
        }
    }

    /**
     * Stop watching location
     */
    static stopWatchingLocation(): void {
        if (this.watchSubscription) {
            this.watchSubscription.remove();
            this.watchSubscription = null;
        }
    }
}

// Export function to stop tracking (used by background task)
export async function stopTracking() {
    await LocationService.stopTracking();
}
