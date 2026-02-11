import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export class AlarmService {
    private static sound: Audio.Sound | null = null;
    private static isPlaying: boolean = false;

    /**
     * Request notification permissions
     */
    static async requestPermissions(): Promise<boolean> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                return false;
            }

            // Configure notification channel for Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('alarm', {
                    name: 'Destination Alarm',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#2196F3',
                    sound: 'default',
                    enableVibrate: true,
                    enableLights: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    bypassDnd: true,
                });
            }

            return true;
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    }

    /**
     * Trigger alarm with sound and notification
     */
    static async triggerAlarm(destinationName: string, distanceMeters: number): Promise<void> {
        try {
            // Configure audio session to override silent mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true, // Critical: Play even in silent mode
                staysActiveInBackground: true,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: false,
            });

            // Play alarm sound with volume ramp-up
            await this.playAlarmSound();

            // Send notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🚏 You\'re Near Your Stop!',
                    body: `${destinationName} is ${Math.round(distanceMeters)}m away. Wake up!`,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    vibrate: [0, 500, 200, 500, 200, 500],
                    categoryIdentifier: 'alarm',
                },
                trigger: null, // Immediate
            });

            console.log('Alarm triggered successfully');
        } catch (error) {
            console.error('Error triggering alarm:', error);
        }
    }

    /**
     * Play alarm sound with volume ramp-up
     */
    private static async playAlarmSound(): Promise<void> {
        try {
            // Unload previous sound if exists
            if (this.sound) {
                await this.sound.unloadAsync();
            }

            // Load alarm sound (using system default for now)
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/alarm.mp3'), // We'll create this
                {
                    shouldPlay: true,
                    isLooping: true,
                    volume: 0.3, // Start at 30% volume
                }
            );

            this.sound = sound;
            this.isPlaying = true;

            // Ramp up volume over 30 seconds
            this.rampUpVolume();

        } catch (error) {
            console.error('Error playing alarm sound:', error);
            // Fallback: just use notification sound
        }
    }

    /**
     * Gradually increase volume from 30% to 100% over 30 seconds
     */
    private static async rampUpVolume(): Promise<void> {
        if (!this.sound || !this.isPlaying) return;

        const startVolume = 0.3;
        const endVolume = 1.0;
        const duration = 30000; // 30 seconds
        const steps = 30; // Update every second
        const stepDuration = duration / steps;
        const volumeIncrement = (endVolume - startVolume) / steps;

        for (let i = 0; i < steps; i++) {
            if (!this.isPlaying) break;

            await new Promise(resolve => setTimeout(resolve, stepDuration));

            const newVolume = Math.min(startVolume + (volumeIncrement * (i + 1)), endVolume);

            try {
                await this.sound?.setVolumeAsync(newVolume);
            } catch (error) {
                console.error('Error setting volume:', error);
                break;
            }
        }
    }

    /**
     * Stop alarm
     */
    static async stopAlarm(): Promise<void> {
        try {
            this.isPlaying = false;

            if (this.sound) {
                await this.sound.stopAsync();
                await this.sound.unloadAsync();
                this.sound = null;
            }

            // Cancel all notifications
            await Notifications.cancelAllScheduledNotificationsAsync();

            console.log('Alarm stopped');
        } catch (error) {
            console.error('Error stopping alarm:', error);
        }
    }

    /**
     * Check if alarm is currently playing
     */
    static isAlarmPlaying(): boolean {
        return this.isPlaying;
    }
}

// Export trigger function for use in background tasks
export async function triggerAlarm(destinationName: string, distanceMeters: number) {
    await AlarmService.triggerAlarm(destinationName, distanceMeters);
}
