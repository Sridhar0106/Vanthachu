import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Vibration,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { AlarmService } from '../services/AlarmService';
import { LocationService } from '../services/LocationService';

interface AlarmScreenProps {
    destinationName: string;
    distanceMeters: number;
    onDismiss: () => void;
}

export default function AlarmScreen({ destinationName, distanceMeters, onDismiss }: AlarmScreenProps) {
    const [pulseAnim] = React.useState(new Animated.Value(1));
    const [shakeAnim] = React.useState(new Animated.Value(0));

    useEffect(() => {
        // Start animations
        startPulseAnimation();
        startShakeAnimation();

        // Vibrate
        const vibrationPattern = [0, 500, 200, 500, 200, 500];
        Vibration.vibrate(vibrationPattern, true);

        return () => {
            Vibration.cancel();
        };
    }, []);

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const startShakeAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shakeAnim, {
                    toValue: 10,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: -10,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 10,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const handleDismiss = async () => {
        await AlarmService.stopAlarm();
        await LocationService.stopTracking();
        Vibration.cancel();
        onDismiss();
    };

    const handleSnooze = async () => {
        await AlarmService.stopAlarm();
        Vibration.cancel();
        // Keep tracking active for snooze
        onDismiss();
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        transform: [
                            { scale: pulseAnim },
                            { translateX: shakeAnim },
                        ],
                    },
                ]}
            >
                <Text style={styles.icon}>🚏</Text>
                <Text style={styles.title}>Wake Up!</Text>
                <Text style={styles.message}>You're Near Your Stop</Text>

                <View style={styles.infoCard}>
                    <Text style={styles.destinationLabel}>Destination</Text>
                    <Text style={styles.destinationName}>{destinationName}</Text>
                    <Text style={styles.distance}>
                        {Math.round(distanceMeters)}m away
                    </Text>
                </View>

                <Text style={styles.warning}>
                    ⚠️ Get ready to get off!
                </Text>
            </Animated.View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={handleDismiss}
                >
                    <Text style={styles.dismissButtonText}>I'm Awake!</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.snoozeButton}
                    onPress={handleSnooze}
                >
                    <Text style={styles.snoozeButtonText}>Snooze (5 min)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.error,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    content: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    icon: {
        fontSize: 120,
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZES.xxxl + 16,
        fontWeight: 'bold',
        color: COLORS.background,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    message: {
        fontSize: FONT_SIZES.xl,
        color: COLORS.background,
        marginBottom: SPACING.xl,
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        minWidth: 280,
        marginBottom: SPACING.lg,
    },
    destinationLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    destinationName: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    distance: {
        fontSize: FONT_SIZES.xxxl,
        fontWeight: 'bold',
        color: COLORS.error,
    },
    warning: {
        fontSize: FONT_SIZES.lg,
        color: COLORS.background,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    buttonContainer: {
        width: '100%',
        gap: SPACING.md,
    },
    dismissButton: {
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    dismissButtonText: {
        color: COLORS.error,
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
    },
    snoozeButton: {
        backgroundColor: 'transparent',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    snoozeButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
});
