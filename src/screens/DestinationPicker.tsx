import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Destination } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { LocationService } from '../services/LocationService';
import { StorageService, HistoryItem } from '../services/StorageService';

interface DestinationPickerProps {
    onDestinationSelected: (destination: Destination) => void;
    onCancel: () => void;
}

export default function DestinationPicker({ onDestinationSelected, onCancel }: DestinationPickerProps) {
    const [mode, setMode] = useState<'search' | 'map'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Destination[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [favorites, setFavorites] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Destination | null>(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: 11.0168, // Tamil Nadu center
        longitude: 76.9558,
        latitudeDelta: 5,
        longitudeDelta: 5,
    });

    useEffect(() => {
        loadHistoryAndFavorites();
        getCurrentLocationForMap();
    }, []);

    const loadHistoryAndFavorites = async () => {
        const hist = await StorageService.getHistory();
        const favs = await StorageService.getFavorites();
        setHistory(hist);
        setFavorites(favs);
    };

    const getCurrentLocationForMap = async () => {
        const location = await LocationService.getCurrentLocation();
        if (location) {
            setMapRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        }
    };

    const handleMapPress = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setSelectedLocation({
            latitude,
            longitude,
            name: 'Selected Location',
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
    };

    const handleConfirmLocation = () => {
        if (selectedLocation) {
            onDestinationSelected(selectedLocation);
        }
    };

    const handleSelectFromList = (destination: Destination) => {
        onDestinationSelected(destination);
    };

    // Simplified search - in production, integrate Google Places API
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);

        // Mock search results - in production, call Google Places API
        setTimeout(() => {
            const mockResults: Destination[] = [
                {
                    latitude: 13.0827,
                    longitude: 80.2707,
                    name: 'Chennai Central',
                    address: 'Chennai, Tamil Nadu',
                },
                {
                    latitude: 11.0168,
                    longitude: 76.9558,
                    name: 'Coimbatore Junction',
                    address: 'Coimbatore, Tamil Nadu',
                },
                {
                    latitude: 9.9252,
                    longitude: 78.1198,
                    name: 'Madurai Junction',
                    address: 'Madurai, Tamil Nadu',
                },
            ].filter(place =>
                place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                place.address?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setSearchResults(mockResults);
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        const timer = setTimeout(handleSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Destination</Text>
                <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            {/* Mode Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, mode === 'search' && styles.activeTab]}
                    onPress={() => setMode('search')}
                >
                    <Text style={[styles.tabText, mode === 'search' && styles.activeTabText]}>
                        Search
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, mode === 'map' && styles.activeTab]}
                    onPress={() => setMode('map')}
                >
                    <Text style={[styles.tabText, mode === 'map' && styles.activeTabText]}>
                        Map
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Mode */}
            {mode === 'search' && (
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for a location in Tamil Nadu..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={COLORS.textSecondary}
                    />

                    {loading && <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />}

                    <FlatList
                        data={searchQuery ? searchResults : [...favorites, ...history]}
                        keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.listItem}
                                onPress={() => handleSelectFromList(item)}
                            >
                                <View style={styles.listItemContent}>
                                    <Text style={styles.listItemName}>{item.name}</Text>
                                    {item.address && (
                                        <Text style={styles.listItemAddress}>{item.address}</Text>
                                    )}
                                </View>
                                <Text style={styles.arrow}>→</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No results found' : 'No recent destinations'}
                            </Text>
                        }
                    />
                </View>
            )}

            {/* Map Mode */}
            {mode === 'map' && (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        region={mapRegion}
                        onPress={handleMapPress}
                    >
                        {selectedLocation && (
                            <>
                                <Marker
                                    coordinate={{
                                        latitude: selectedLocation.latitude,
                                        longitude: selectedLocation.longitude,
                                    }}
                                    title={selectedLocation.name}
                                />
                                <Circle
                                    center={{
                                        latitude: selectedLocation.latitude,
                                        longitude: selectedLocation.longitude,
                                    }}
                                    radius={1000} // 1km geofence
                                    strokeColor={COLORS.primary}
                                    fillColor="rgba(33, 150, 243, 0.2)"
                                />
                            </>
                        )}
                    </MapView>

                    {selectedLocation && (
                        <View style={styles.mapOverlay}>
                            <View style={styles.selectedInfo}>
                                <Text style={styles.selectedName}>{selectedLocation.name}</Text>
                                <Text style={styles.selectedAddress}>{selectedLocation.address}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmLocation}
                            >
                                <Text style={styles.confirmButtonText}>Confirm Location</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.mapInstructions}>
                        <Text style={styles.instructionsText}>
                            Tap on the map to select your destination
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    headerTitle: {
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
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderBottomWidth: 2,
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
    loader: {
        marginTop: SPACING.xl,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    listItemContent: {
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
    },
    map: {
        flex: 1,
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderTopLeftRadius: BORDER_RADIUS.lg,
        borderTopRightRadius: BORDER_RADIUS.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    selectedInfo: {
        marginBottom: SPACING.md,
    },
    selectedName: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    selectedAddress: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
    },
    mapInstructions: {
        position: 'absolute',
        top: SPACING.md,
        left: SPACING.md,
        right: SPACING.md,
        backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    instructionsText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.text,
        textAlign: 'center',
    },
});
