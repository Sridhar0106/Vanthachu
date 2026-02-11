import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    TextInput,
    FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from './src/constants/theme';

interface Destination {
    latitude: number;
    longitude: number;
    name: string;
    address?: string;
}

export default function App() {
    const [screen, setScreen] = useState<'home' | 'picker' | 'tracking'>('home');
    const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
    const [pickerMode, setPickerMode] = useState<'search' | 'map'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [pulseAnim] = useState(new Animated.Value(1));

    // Mock search results
    const mockDestinations: Destination[] = [
        { latitude: 13.0827, longitude: 80.2707, name: 'Chennai Central', address: 'Chennai, Tamil Nadu' },
        { latitude: 11.0168, longitude: 76.9558, name: 'Coimbatore Junction', address: 'Coimbatore, Tamil Nadu' },
        { latitude: 9.9252, longitude: 78.1198, name: 'Madurai Junction', address: 'Madurai, Tamil Nadu' },
        { latitude: 10.7905, longitude: 78.7047, name: 'Trichy Junction', address: 'Tiruchirappalli, Tamil Nadu' },
        { latitude: 11.9416, longitude: 79.8083, name: 'Pondicherry Bus Stand', address: 'Puducherry' },
    ];

    const filteredDestinations = searchQuery
        ? mockDestinations.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.address?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : mockDestinations;

    React.useEffect(() => {
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
    }, []);

    const handleSelectDestination = (destination: Destination) => {
        setSelectedDestination(destination);
        setScreen('tracking');
    };

    const handleMapSelect = () => {
        // Simulate map selection
        const mockMapDestination: Destination = {
            latitude: 11.1271,
            longitude: 78.6569,
            name: 'Selected Location',
            address: 'Salem, Tamil Nadu',
        };
        setSelectedDestination(mockMapDestination);
        setScreen('tracking');
    };

    // Home Screen
    if (screen === 'home') {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.header}>
                    <Text style={styles.appName}>Namma Stop</Text>
                    <Text style={styles.tagline}>Never miss your stop again</Text>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
                            onPress={() => setScreen('picker')}
                        >
                            <Text style={styles.primaryButtonText}>Choose Destination</Text>
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

                        <View style={styles.demoNote}>
                            <Text style={styles.demoNoteText}>
                                📱 This is a web demo. Full features (GPS, maps, alarms) work on mobile devices.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Destination Picker Screen
    if (screen === 'picker') {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />

                {/* Header */}
                <View style={styles.pickerHeader}>
                    <Text style={styles.pickerHeaderTitle}>Select Destination</Text>
                    <TouchableOpacity onPress={() => setScreen('home')} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                {/* Mode Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, pickerMode === 'search' && styles.activeTab]}
                        onPress={() => setPickerMode('search')}
                    >
                        <Text style={[styles.tabText, pickerMode === 'search' && styles.activeTabText]}>
                            🔍 Search
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, pickerMode === 'map' && styles.activeTab]}
                        onPress={() => setPickerMode('map')}
                    >
                        <Text style={[styles.tabText, pickerMode === 'map' && styles.activeTabText]}>
                            🗺️ Map
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search Mode */}
                {pickerMode === 'search' && (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for a location in Tamil Nadu..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={COLORS.textSecondary}
                        />

                        <FlatList
                            data={filteredDestinations}
                            keyExtractor={(item) => `${item.latitude}-${item.longitude}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.listItem}
                                    onPress={() => handleSelectDestination(item)}
                                >
                                    <View style={styles.listItemContent}>
                                        <Text style={styles.listItemIcon}>📍</Text>
                                        <View style={styles.listItemTextContainer}>
                                            <Text style={styles.listItemName}>{item.name}</Text>
                                            {item.address && (
                                                <Text style={styles.listItemAddress}>{item.address}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <Text style={styles.arrow}>→</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>
                                    {searchQuery ? 'No results found' : 'Search for your destination'}
                                </Text>
                            }
                        />
                    </View>
                )}

                {/* Map Mode */}
                {pickerMode === 'map' && (
                    <View style={styles.mapContainer}>
                        <View style={styles.mapPlaceholder}>
                            <Text style={styles.mapIcon}>🗺️</Text>
                            <Text style={styles.mapPlaceholderText}>
                                Interactive Map
                            </Text>
                            <Text style={styles.mapInstructionText}>
                                Tap on the map to select your destination
                            </Text>
                            <Text style={styles.mapNoteText}>
                                (On mobile: Full Google Maps with 1km geofence circle)
                            </Text>

                            <TouchableOpacity
                                style={styles.mapSelectButton}
                                onPress={handleMapSelect}
                            >
                                <Text style={styles.mapSelectButtonText}>
                                    📍 Select This Location
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.mapInfo}>
                            <Text style={styles.mapInfoText}>
                                💡 On mobile devices, you can tap anywhere on the map to set your destination
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
    }

    // Tracking Screen
    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <Text style={styles.appName}>Namma Stop</Text>
                <Text style={styles.tagline}>Never miss your stop again</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.trackingContainer}>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Tracking Active</Text>
                    </View>

                    <View style={styles.destinationCard}>
                        <View style={styles.destinationHeader}>
                            <View style={styles.destinationInfo}>
                                <Text style={styles.destinationLabel}>DESTINATION</Text>
                                <Text style={styles.destinationName}>{selectedDestination?.name}</Text>
                                <Text style={styles.destinationAddress}>{selectedDestination?.address}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setScreen('picker')}
                            >
                                <Text style={styles.editButtonText}>✏️ Edit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Distance Remaining</Text>
                            <Text style={styles.statValue}>8.5 km</Text>
                        </View>

                        <View style={styles.statRow}>
                            <View style={styles.statCardSmall}>
                                <Text style={styles.statLabelSmall}>Current Speed</Text>
                                <Text style={styles.statValueSmall}>65 km/h</Text>
                            </View>

                            <View style={styles.statCardSmall}>
                                <Text style={styles.statLabelSmall}>ETA</Text>
                                <Text style={styles.statValueSmall}>8 min</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            ✅ You can lock your phone and sleep. We'll wake you up!
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.stopButton}
                        onPress={() => {
                            setScreen('home');
                            setSelectedDestination(null);
                        }}
                    >
                        <Text style={styles.stopButtonText}>Stop Tracking</Text>
                    </TouchableOpacity>

                    <View style={styles.demoNote}>
                        <Text style={styles.demoNoteText}>
                            📱 This is a demo UI. On mobile, real GPS tracking runs in the background.
                        </Text>
                    </View>
                </View>
            </ScrollView>
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
    },
    contentContainer: {
        padding: SPACING.lg,
    },
    notTrackingContainer: {
        alignItems: 'center',
        paddingTop: SPACING.xxl,
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
    // Destination Picker Styles
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.background,
        paddingTop: SPACING.xxl + 20,
    },
    pickerHeaderTitle: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    cancelButton: {
        padding: SPACING.sm,
    },
    cancelText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.primary,
        fontWeight: '600',
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: COLORS.primary,
    },
    searchContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    searchInput: {
        margin: SPACING.md,
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    listItemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    listItemIcon: {
        fontSize: 24,
        marginRight: SPACING.md,
    },
    listItemTextContainer: {
        flex: 1,
    },
    listItemName: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    listItemAddress: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    arrow: {
        fontSize: FONT_SIZES.xl,
        color: COLORS.primary,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: SPACING.xxl,
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
    },
    mapContainer: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        backgroundColor: '#E3F2FD',
    },
    mapIcon: {
        fontSize: 80,
        marginBottom: SPACING.lg,
    },
    mapPlaceholderText: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    mapInstructionText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    mapNoteText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: SPACING.xl,
    },
    mapSelectButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.lg,
    },
    mapSelectButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
    },
    mapInfo: {
        backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    mapInfoText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    // Tracking Screen Styles
    trackingContainer: {
        paddingTop: SPACING.lg,
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
    destinationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    destinationInfo: {
        flex: 1,
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
    editButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
    },
    editButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
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
        marginBottom: SPACING.lg,
    },
    stopButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
    },
    demoNote: {
        backgroundColor: '#FFF3E0',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.lg,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    demoNoteText: {
        fontSize: FONT_SIZES.sm,
        color: '#E65100',
        textAlign: 'center',
    },
});
