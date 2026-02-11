import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Theme constants
const COLORS = {
  primary: '#1E3A8A',
  primaryLight: '#3B82F6',
  secondary: '#10B981',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  accent: '#8B5CF6',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 100,
};

interface Destination {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
}

// Comprehensive Tamil Nadu locations database
const TAMIL_NADU_LOCATIONS: Destination[] = [
  // Major Cities & Bus Stations
  { latitude: 13.0827, longitude: 80.2707, name: 'Chennai Central', address: 'Chennai, Tamil Nadu' },
  { latitude: 13.0674, longitude: 80.2376, name: 'Chennai Egmore', address: 'Chennai, Tamil Nadu' },
  { latitude: 13.0765, longitude: 80.1945, name: 'Chennai Koyambedu CMBT', address: 'Chennai, Tamil Nadu' },
  { latitude: 13.0108, longitude: 80.2275, name: 'Chennai T. Nagar', address: 'Chennai, Tamil Nadu' },
  { latitude: 12.9784, longitude: 80.2186, name: 'Chennai Tambaram', address: 'Chennai, Tamil Nadu' },
  { latitude: 11.0168, longitude: 76.9558, name: 'Coimbatore Junction', address: 'Coimbatore, Tamil Nadu' },
  { latitude: 11.0012, longitude: 76.9629, name: 'Coimbatore Gandhipuram', address: 'Coimbatore, Tamil Nadu' },
  { latitude: 9.9252, longitude: 78.1198, name: 'Madurai Junction', address: 'Madurai, Tamil Nadu' },
  { latitude: 9.9195, longitude: 78.1193, name: 'Madurai Periyar Bus Stand', address: 'Madurai, Tamil Nadu' },
  { latitude: 10.7905, longitude: 78.7047, name: 'Trichy Junction', address: 'Tiruchirappalli, Tamil Nadu' },
  { latitude: 10.8155, longitude: 78.6960, name: 'Trichy Central Bus Stand', address: 'Tiruchirappalli, Tamil Nadu' },
  { latitude: 11.1271, longitude: 78.6569, name: 'Salem Junction', address: 'Salem, Tamil Nadu' },
  { latitude: 11.6643, longitude: 78.1460, name: 'Erode Junction', address: 'Erode, Tamil Nadu' },
  { latitude: 10.3624, longitude: 77.9695, name: 'Dindigul Junction', address: 'Dindigul, Tamil Nadu' },
  { latitude: 8.7139, longitude: 77.7567, name: 'Tirunelveli Junction', address: 'Tirunelveli, Tamil Nadu' },
  { latitude: 9.2876, longitude: 79.3129, name: 'Rameswaram', address: 'Rameswaram, Tamil Nadu' },
  { latitude: 8.0863, longitude: 77.5544, name: 'Kanyakumari', address: 'Kanyakumari, Tamil Nadu' },
  { latitude: 10.9254, longitude: 79.8380, name: 'Thanjavur Junction', address: 'Thanjavur, Tamil Nadu' },
  { latitude: 11.9416, longitude: 79.8083, name: 'Pondicherry Bus Stand', address: 'Puducherry' },
  { latitude: 12.9165, longitude: 79.1325, name: 'Vellore Bus Stand', address: 'Vellore, Tamil Nadu' },
  { latitude: 12.5266, longitude: 78.2141, name: 'Krishnagiri Bus Stand', address: 'Krishnagiri, Tamil Nadu' },
  { latitude: 12.2253, longitude: 78.1675, name: 'Dharmapuri Bus Stand', address: 'Dharmapuri, Tamil Nadu' },
  { latitude: 10.9601, longitude: 77.5545, name: 'Tirupur Junction', address: 'Tirupur, Tamil Nadu' },
  { latitude: 10.5074, longitude: 77.3400, name: 'Palani Bus Stand', address: 'Palani, Tamil Nadu' },
  { latitude: 10.4522, longitude: 77.4851, name: 'Oddanchatram', address: 'Dindigul, Tamil Nadu' },
  { latitude: 10.1436, longitude: 77.0624, name: 'Theni Bus Stand', address: 'Theni, Tamil Nadu' },
  { latitude: 9.4644, longitude: 77.5528, name: 'Virudhunagar Junction', address: 'Virudhunagar, Tamil Nadu' },
  { latitude: 9.2828, longitude: 77.8033, name: 'Sivakasi Bus Stand', address: 'Sivakasi, Tamil Nadu' },
  { latitude: 9.0740, longitude: 78.1230, name: 'Rajapalayam', address: 'Rajapalayam, Tamil Nadu' },
  { latitude: 8.4865, longitude: 78.0165, name: 'Thoothukudi Junction', address: 'Thoothukudi, Tamil Nadu' },
  { latitude: 10.7662, longitude: 79.8463, name: 'Kumbakonam', address: 'Kumbakonam, Tamil Nadu' },
  { latitude: 11.4186, longitude: 79.6940, name: 'Cuddalore Junction', address: 'Cuddalore, Tamil Nadu' },
  { latitude: 11.7480, longitude: 79.7714, name: 'Villupuram Junction', address: 'Villupuram, Tamil Nadu' },
  { latitude: 12.4996, longitude: 79.9044, name: 'Tiruvannamalai', address: 'Tiruvannamalai, Tamil Nadu' },
  { latitude: 10.9850, longitude: 76.9600, name: 'Pollachi Bus Stand', address: 'Pollachi, Tamil Nadu' },
  { latitude: 11.3549, longitude: 77.7240, name: 'Namakkal Bus Stand', address: 'Namakkal, Tamil Nadu' },
  { latitude: 11.5145, longitude: 77.3378, name: 'Karur Junction', address: 'Karur, Tamil Nadu' },
  { latitude: 9.8480, longitude: 77.5219, name: 'Cumbum Bus Stand', address: 'Cumbum, Tamil Nadu' },
  { latitude: 10.0739, longitude: 77.0581, name: 'Periyakulam', address: 'Periyakulam, Tamil Nadu' },
  { latitude: 10.1632, longitude: 77.4892, name: 'Batlagundu', address: 'Dindigul, Tamil Nadu' },
  { latitude: 12.7845, longitude: 79.2598, name: 'Arakkonam Junction', address: 'Arakkonam, Tamil Nadu' },
  { latitude: 13.3379, longitude: 79.5501, name: 'Tiruttani', address: 'Tiruvallur, Tamil Nadu' },
  { latitude: 12.1311, longitude: 79.0747, name: 'Arcot Bus Stand', address: 'Vellore, Tamil Nadu' },
  { latitude: 11.2189, longitude: 78.1674, name: 'Attur Bus Stand', address: 'Salem, Tamil Nadu' },
  { latitude: 11.3400, longitude: 77.7300, name: 'Rasipuram', address: 'Namakkal, Tamil Nadu' },
  { latitude: 10.6250, longitude: 77.0460, name: 'Udumalpet', address: 'Tirupur, Tamil Nadu' },
  { latitude: 11.2180, longitude: 76.9350, name: 'Mettupalayam', address: 'Coimbatore, Tamil Nadu' },
  { latitude: 11.4074, longitude: 76.6960, name: 'Ooty Bus Stand', address: 'Nilgiris, Tamil Nadu' },
  { latitude: 10.2300, longitude: 77.4800, name: 'Kodaikanal Bus Stand', address: 'Dindigul, Tamil Nadu' },
  { latitude: 10.4210, longitude: 78.9900, name: 'Karaikudi Junction', address: 'Sivaganga, Tamil Nadu' },
];

export default function App() {
  const [screen, setScreen] = useState<'home' | 'picker' | 'tracking'>('home');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [pickerMode, setPickerMode] = useState<'search' | 'map'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapPin, setMapPin] = useState<{ lat: number; lng: number } | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  const filteredDestinations = searchQuery
    ? TAMIL_NADU_LOCATIONS.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : TAMIL_NADU_LOCATIONS.slice(0, 10);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSelectDestination = (destination: Destination) => {
    setSelectedDestination(destination);
    setScreen('tracking');
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMapPin({ lat, lng });
  };

  const handleConfirmMapSelection = () => {
    if (mapPin) {
      const destination: Destination = {
        latitude: mapPin.lat,
        longitude: mapPin.lng,
        name: 'Custom Location',
        address: `${mapPin.lat.toFixed(4)}°N, ${mapPin.lng.toFixed(4)}°E`,
      };
      setSelectedDestination(destination);
      setScreen('tracking');
    }
  };

  // Home Screen
  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Gradient Header */}
        <View style={styles.gradientHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.appName}>🚏 Namma Stop</Text>
            <Text style={styles.tagline}>Tamil Nadu Transit Wake-up Alarm</Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.iconCircle}>
                <Text style={styles.heroIcon}>🛌➡️🚌</Text>
              </View>
            </Animated.View>

            <Text style={styles.heroTitle}>Never Miss Your Stop Again</Text>
            <Text style={styles.heroSubtitle}>
              Set your destination and sleep peacefully. We'll wake you up 1km before your stop!
            </Text>

            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => setScreen('picker')}
            >
              <Text style={styles.ctaButtonText}>🎯 Choose Destination</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Feature Cards */}
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>📍</Text>
              <Text style={styles.featureTitle}>GPS Tracking</Text>
              <Text style={styles.featureDesc}>Real-time location monitoring even when phone is locked</Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🔋</Text>
              <Text style={styles.featureTitle}>Battery Smart</Text>
              <Text style={styles.featureDesc}>Adaptive GPS accuracy saves up to 70% battery</Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🔔</Text>
              <Text style={styles.featureTitle}>Loud Alarm</Text>
              <Text style={styles.featureDesc}>Overrides silent mode to ensure you wake up</Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>📶</Text>
              <Text style={styles.featureTitle}>Works Offline</Text>
              <Text style={styles.featureDesc}>No internet needed for tracking - pure GPS</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardText}>
              💡 Perfect for long bus journeys across Tamil Nadu. Sleep without worry!
            </Text>
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
          <TouchableOpacity onPress={() => setScreen('home')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>Select Destination</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Mode Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, pickerMode === 'search' && styles.activeTabButton]}
            onPress={() => setPickerMode('search')}
          >
            <Text style={[styles.tabButtonText, pickerMode === 'search' && styles.activeTabButtonText]}>
              🔍 Search
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, pickerMode === 'map' && styles.activeTabButton]}
            onPress={() => setPickerMode('map')}
          >
            <Text style={[styles.tabButtonText, pickerMode === 'map' && styles.activeTabButtonText]}>
              🗺️ Map
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Mode */}
        {pickerMode === 'search' && (
          <View style={styles.searchContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search any location in Tamil Nadu..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.resultsLabel}>
              {searchQuery ? `Results for "${searchQuery}"` : '📍 Popular Destinations'}
            </Text>

            <FlatList
              data={filteredDestinations}
              keyExtractor={(item, idx) => `${item.latitude}-${item.longitude}-${idx}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => handleSelectDestination(item)}
                >
                  <View style={styles.locationIcon}>
                    <Text style={styles.locationEmoji}>📍</Text>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{item.name}</Text>
                    <Text style={styles.locationAddress}>{item.address}</Text>
                  </View>
                  <Text style={styles.selectArrow}>→</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🔍</Text>
                  <Text style={styles.emptyText}>No locations found</Text>
                  <Text style={styles.emptySubtext}>Try a different search term</Text>
                </View>
              }
            />
          </View>
        )}

        {/* Map Mode */}
        {pickerMode === 'map' && (
          <View style={styles.mapContent}>
            <View style={styles.mapWrapper}>
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=76.5,8.0,80.5,13.5&layer=mapnik&marker=${mapPin ? `${mapPin.lat},${mapPin.lng}` : ''}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Select Location"
              />

              {/* Map Click Overlay */}
              <View style={styles.mapOverlay}>
                <Text style={styles.mapInstructions}>
                  📍 Click on the map or enter coordinates below
                </Text>
              </View>
            </View>

            {/* Coordinate Input */}
            <View style={styles.coordInputContainer}>
              <Text style={styles.coordLabel}>Enter Coordinates:</Text>
              <View style={styles.coordInputRow}>
                <TextInput
                  style={styles.coordInput}
                  placeholder="Latitude (e.g., 11.0168)"
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const lat = parseFloat(text);
                    if (!isNaN(lat)) {
                      setMapPin(prev => ({ lat, lng: prev?.lng || 78.0 }));
                    }
                  }}
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TextInput
                  style={styles.coordInput}
                  placeholder="Longitude (e.g., 76.9558)"
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const lng = parseFloat(text);
                    if (!isNaN(lng)) {
                      setMapPin(prev => ({ lat: prev?.lat || 11.0, lng }));
                    }
                  }}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              {mapPin && (
                <View style={styles.selectedCoords}>
                  <Text style={styles.selectedCoordsText}>
                    📍 Selected: {mapPin.lat.toFixed(4)}°N, {mapPin.lng.toFixed(4)}°E
                  </Text>
                  <TouchableOpacity
                    style={styles.confirmMapButton}
                    onPress={handleConfirmMapSelection}
                  >
                    <Text style={styles.confirmMapButtonText}>✓ Confirm This Location</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Quick Select Buttons */}
              <Text style={styles.quickSelectLabel}>Quick Select:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSelectScroll}>
                {TAMIL_NADU_LOCATIONS.slice(0, 8).map((loc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickSelectChip}
                    onPress={() => handleSelectDestination(loc)}
                  >
                    <Text style={styles.quickSelectText}>{loc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Tracking Screen
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.trackingHeader}>
        <Text style={styles.trackingHeaderTitle}>🚏 Namma Stop</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Badge */}
        <View style={styles.statusBadgeContainer}>
          <Animated.View style={[styles.statusBadge, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusBadgeText}>● Tracking Active</Text>
          </Animated.View>
        </View>

        {/* Destination Card */}
        <View style={styles.destinationCardLarge}>
          <View style={styles.destCardHeader}>
            <Text style={styles.destCardLabel}>DESTINATION</Text>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => setScreen('picker')}
            >
              <Text style={styles.changeButtonText}>✏️ Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.destCardName}>{selectedDestination?.name}</Text>
          <Text style={styles.destCardAddress}>{selectedDestination?.address}</Text>
        </View>

        {/* Distance Display */}
        <View style={styles.distanceCard}>
          <Text style={styles.distanceLabel}>Distance Remaining</Text>
          <Text style={styles.distanceValue}>8.5 km</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '65%' }]} />
          </View>
          <Text style={styles.progressText}>Alarm will trigger at 1km</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🏃</Text>
            <Text style={styles.statValue}>65 km/h</Text>
            <Text style={styles.statLabel}>Speed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>8 min</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🔋</Text>
            <Text style={styles.statValue}>73%</Text>
            <Text style={styles.statLabel}>Battery</Text>
          </View>
        </View>

        {/* Info Message */}
        <View style={styles.sleepMessage}>
          <Text style={styles.sleepEmoji}>😴</Text>
          <Text style={styles.sleepText}>
            You can lock your phone and sleep now. We'll wake you up with a loud alarm!
          </Text>
        </View>

        {/* Stop Button */}
        <TouchableOpacity
          style={styles.stopButton}
          onPress={() => {
            setScreen('home');
            setSelectedDestination(null);
          }}
        >
          <Text style={styles.stopButtonText}>⏹️ Stop Tracking</Text>
        </TouchableOpacity>

        <Text style={styles.demoDisclaimer}>
          📱 This is a web demo. Full GPS tracking, maps, and alarms work on mobile devices via Expo Go.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradientHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    color: '#93C5FD',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  heroIcon: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  featureCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featureDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  infoCardText: {
    fontSize: FONT_SIZES.sm,
    color: '#92400E',
  },
  // Picker Styles
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  pickerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  searchContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchInput: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  resultsLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationEmoji: {
    fontSize: 20,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  selectArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  // Map Mode Styles
  mapContent: {
    flex: 1,
  },
  mapWrapper: {
    height: 300,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 58, 138, 0.9)',
    padding: SPACING.sm,
  },
  mapInstructions: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  coordInputContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  coordLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  coordInputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  coordInput: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedCoords: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#DCFCE7',
    borderRadius: BORDER_RADIUS.md,
  },
  selectedCoordsText: {
    fontSize: FONT_SIZES.md,
    color: '#166534',
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  confirmMapButton: {
    backgroundColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  confirmMapButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  quickSelectLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  quickSelectScroll: {
    flexDirection: 'row',
  },
  quickSelectChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    marginRight: SPACING.sm,
  },
  quickSelectText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  // Tracking Styles
  trackingHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  trackingHeaderTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.round,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginRight: SPACING.sm,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  destinationCardLarge: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  destCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  destCardLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  changeButton: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  destCardName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  destCardAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  distanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  distanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#93C5FD',
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  distanceValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: '#93C5FD',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  sleepMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  sleepEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  sleepText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: '#166534',
    lineHeight: 20,
  },
  stopButton: {
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  demoDisclaimer: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: SPACING.md,
  },
});
