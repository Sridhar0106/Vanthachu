import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Destination } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { LocationService } from '../services/LocationService';
import { AlarmService } from '../services/AlarmService';
import { StorageService } from '../services/StorageService';
import {
    calculateDistance,
    formatDistance,
    formatSpeed,
    formatETA,
    calculateETA,
} from '../utils/geofence';
import DestinationPicker from './DestinationPicker';

export default function HomeScreen() {
    const [isTracking, setIsTracking] = useState(false);
    const [destination, setDestination] = useState<Destination | null>(null);
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
    const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
    const [eta, setEta] = useState<number | null>(null);
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        initializeApp();
    }, []);

    useEffect(() => {
        if (isTracking) {
            startLocationWatch();
            startPulseAnimation();
        } else {
            LocationService.stopWatchingLocation();
        }

        return () => {
            LocationService.stopWatchingLocation();
        };
    }, [isTracking]);

    const initializeApp = async () => {
        // Request permissions
        const hasLocationPermission = await LocationService.requestPermissions();
        if (!hasLocationPermission) {
            Alert.alert(
                'Permission Required',
                'Namma Stop needs location permission to function. Please enable it in settings.',
                [{ text: 'OK' }]
            );
        }

        await AlarmService.requestPermissions();

        // Check if already tracking
        const tracking = await LocationService.isTracking();
        if (tracking) {
            const dest = await LocationService.getDestination();
            if (dest) {
                setDestination(dest);
                setIsTracking(true);
            }
        }
    };

    const startLocationWatch = () => {
        LocationService.watchLocation((location) => {
            setCurrentLocation(location);
            setCurrentSpeed(location.coords.speed || 0);

            if (destination) {
                const distance = calculateDistance(
                    location.coords.latitude,
                    location.coords.longitude,
                    destination.latitude,
                    destination.longitude
                );
                setDistanceRemaining(distance);

                const estimatedEta = calculateETA(distance, location.coords.speed || 0);
                setEta(estimatedEta);
            }
        });
    };

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const handleStartTracking = async (selectedDestination: Destination) => {
        setLoading(true);
        setShowDestinationPicker(false);

        try {
            // Add to history
            await StorageService.addToHistory(selectedDestination);

            // Start tracking
            const success = await LocationService.startTracking(selectedDestination);

            if (success) {
                setDestination(selectedDestination);
                setIsTracking(true);
                Alert.alert(
                    'Tracking Started',
                    `You'll be alerted when you're within 1km of ${selectedDestination.name}. You can now lock your phone and sleep!`,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', 'Failed to start tracking. Please check permissions.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to start tracking.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStopTracking = () => {
        Alert.alert(
            'Stop Tracking',
            'Are you sure you want to stop tracking?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Stop',
                    style: 'destructive',
                    onPress: async () => {
                        await LocationService.stopTracking();
                        setIsTracking(false);
                        setDestination(null);
                        setDistanceRemaining(null);
                        setCurrentSpeed(null);
                        setEta(null);
                    },
                },
            ]
        );
    };

    if (showDestinationPicker) {
        return (
            <DestinationPicker
                onDestinationSelected={handleStartTracking}
                onCancel={() => setShowDestinationPicker(false)}
            />
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.appName}>Namma Stop</Text>
                <Text style={styles.tagline}>Never miss your stop again</Text>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {!isTracking ? (
                    /* Not Tracking State */
                    <View style={styles.notTrackingContainer}>
                        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                            <Text style={styles.icon}>🚏</Text>
                        </Animated.View>
                        <Text style={styles.title}>Set Your Destination</Text>
                        <Text style={styles.subtitle}>
                            We'll wake you up when you're 1km away from your stop
                        </Text>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => setShowDestinationPicker(true)}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.background} />
                            ) : (
                                <Text style={styles.primaryButtonText}>Choose Destination</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.features}>
                            <View style={styles.feature}>
                                <Text style={styles.featureIcon}>📍</Text>
                                <Text style={styles.featureText}>GPS Tracking</Text>
                            </View>
                            <View style={styles.feature}>
                                <Text style={styles.featureIcon}>🔋</Text>
                                <Text style={styles.featureText}>Battery Optimized</Text>
                            </View>
                            <View style={styles.feature}>
                                <Text style={styles.featureIcon}>🔔</Text>
                                <Text style={styles.featureText}>Loud Alarm</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    /* Tracking State */
                    <View style={styles.trackingContainer}>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Tracking Active</Text>
                        </View>

                        <View style={styles.destinationCard}>
                            <Text style={styles.destinationLabel}>Destination</Text>
                            <Text style={styles.destinationName}>{destination?.name}</Text>
                            {destination?.address && (
                                <Text style={styles.destinationAddress}>{destination.address}</Text>
                            )}
                        </View>

                        {/* Distance Display */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Text style={styles.statLabel}>Distance Remaining</Text>
                                <Text style={styles.statValue}>
                                    {distanceRemaining !== null ? formatDistance(distanceRemaining) : '---'}
                                </Text>
                            </View>

                            <View style={styles.statRow}>
                                <View style={styles.statCardSmall}>
                                    <Text style={styles.statLabelSmall}>Current Speed</Text>
                                    <Text style={styles.statValueSmall}>
                                        {formatSpeed(currentSpeed)}
                                    </Text>
                                </View>

                                <View style={styles.statCardSmall}>
                                    <Text style={styles.statLabelSmall}>ETA</Text>
                                    <Text style={styles.statValueSmall}>
                                        {formatETA(eta)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Info */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                ✅ You can lock your phone and sleep. We'll wake you up!
                            </Text>
                        </View>

                        {/* Stop Button */}
                        <TouchableOpacity
                            style={styles.stopButton}
                            onPress={handleStopTracking}
                        >
                            <Text style={styles.stopButtonText}>Stop Tracking</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: SPACING.xxl + 20,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
        backgroundColor: COLORS.primary,
    },
    appName: {
        fontSize: FONT_SIZES.xxxl,
        fontWeight: 'bold',
        color: COLORS.background,
        marginBottom: SPACING.xs,
    },
    tagline: {
        fontSize: FONT_SIZES.md,
        color: COLORS.primaryLight,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    notTrackingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: SPACING.xl,
    },
    icon: {
        fontSize: 100,
    },
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.lg,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xxl,
        borderRadius: BORDER_RADIUS.xl,
        minWidth: 250,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
    },
    features: {
        flexDirection: 'row',
        marginTop: SPACING.xxl,
        gap: SPACING.lg,
    },
    feature: {
        alignItems: 'center',
    },
    featureIcon: {
        fontSize: 32,
        marginBottom: SPACING.sm,
    },
    featureText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    trackingContainer: {
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: COLORS.success,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round,
        marginBottom: SPACING.lg,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.background,
        marginRight: SPACING.sm,
    },
    statusText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.sm,
        fontWeight: 'bold',
    },
    destinationCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.lg,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
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
        marginBottom: SPACING.xs,
    },
    destinationAddress: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    statsContainer: {
        marginBottom: SPACING.lg,
    },
    statCard: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    statLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.primaryLight,
        marginBottom: SPACING.sm,
        fontWeight: '600',
    },
    statValue: {
        fontSize: FONT_SIZES.xxxl + 8,
        fontWeight: 'bold',
        color: COLORS.background,
    },
    statRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    statCardSmall: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    statLabelSmall: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        fontWeight: '600',
    },
    statValueSmall: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    infoBox: {
        backgroundColor: '#E8F5E9',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.lg,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
    },
    infoText: {
        fontSize: FONT_SIZES.sm,
        color: '#2E7D32',
        textAlign: 'center',
    },
    stopButton: {
        backgroundColor: COLORS.error,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        marginTop: 'auto',
    },
    stopButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
    },
});
