import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import {
    Navigation,
    MapPin,
    Search,
    ChevronRight,
    Clock,
    Navigation2,
    Locate,
    Target
} from 'lucide-react';
import { locations, Location } from './locations';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Feature Animation Component - using local video
const FeatureAnimation = ({ src, size = 120 }: { src: string, size?: number }) => {
    return (
        <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            style={{
                width: `${size}px`,
                height: `${size}px`,
                objectFit: 'contain',
                borderRadius: '8px'
            }}
        />
    );
};

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const currentLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

type Screen = 'welcome' | 'picker' | 'tracking';

interface GpsData {
    lat: number;
    lng: number;
    speed: number | null; // m/s from GPS
    heading: number | null;
    accuracy: number;
    timestamp: number;
}

// Map component that flies to selected location
function FlyToLocation({ location }: { location: { lat: number; lng: number } | null }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo([location.lat, location.lng], 14, { duration: 1.5 });
        }
    }, [location, map]);
    return null;
}

// Map click handler for selecting destination by tapping
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

const App = () => {
    const [screen, setScreen] = useState<Screen>('welcome');
    const [query, setQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [customDestination, setCustomDestination] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [gpsData, setGpsData] = useState<GpsData | null>(null);
    const [eta, setEta] = useState<string>('--');
    const [speedKmh, setSpeedKmh] = useState<number>(0);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [drivingInfo, setDrivingInfo] = useState<{ distance: number; duration: number } | null>(null);

    useEffect(() => {
        const fetchRoute = async () => {
            const start = gpsData ? [gpsData.lng, gpsData.lat] : null;
            const end = selectedLocation ? [selectedLocation.lng, selectedLocation.lat] : (customDestination ? [customDestination.lng, customDestination.lat] : null);

            if (start && end) {
                try {
                    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`);
                    const data = await response.json();
                    if (data.routes && data.routes[0]) {
                        const route = data.routes[0];
                        const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                        setRoutePath(coords);
                        setDrivingInfo({
                            distance: route.distance / 1000, // meters to km
                            duration: route.duration * 1.5 // seconds (1.5x for bus)
                        });
                    }
                } catch (error) {
                    console.error("Error fetching route:", error);
                    // Fallback to straight line if fetch fails
                    setRoutePath([[start[1], start[0]], [end[1], end[0]]]);
                    setDrivingInfo(null);
                }
            } else {
                setRoutePath([]);
                setDrivingInfo(null);
            }
        };

        const timeoutId = setTimeout(fetchRoute, 500); // Debounce by 500ms
        return () => clearTimeout(timeoutId);
    }, [gpsData?.lat, gpsData?.lng, selectedLocation, customDestination]);

    const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(query.toLowerCase()) ||
        loc.tamil.includes(query)
    );

    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    // Format seconds to human readable string
    const formatDuration = (seconds: number) => {
        const totalMinutes = Math.round(seconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours === 0) return `~${minutes} min`;
        return `~${hours}h ${minutes}m`;
    };

    // Calculate Arrival Time
    const getArrivalTime = (seconds: number) => {
        const now = new Date();
        const arrival = new Date(now.getTime() + seconds * 1000);
        return arrival.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    // Calculate ETA based on distance and speed (Fallback)
    const calculateETA = useCallback((distanceKm: number, speedKmh: number) => {
        if (speedKmh < 5) {
            // If speed is very low, estimate based on average bus speed (30 km/h)
            const hours = distanceKm / 30;
            const minutes = Math.round(hours * 60);
            if (minutes < 60) return `~${minutes} min`;
            return `~${Math.floor(hours)}h ${minutes % 60}m`;
        }
        const hours = distanceKm / speedKmh;
        const minutes = Math.round(hours * 60);
        if (minutes < 60) return `~${minutes} min`;
        return `~${Math.floor(hours)}h ${minutes % 60}m`;
    }, []);

    // Get current location on mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setGpsData({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        speed: pos.coords.speed,
                        heading: pos.coords.heading,
                        accuracy: pos.coords.accuracy,
                        timestamp: pos.timestamp
                    });
                },
                (err) => console.error('Initial GPS error:', err),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    // Real-time GPS tracking when tracking is active
    useEffect(() => {
        let watchId: number;
        const destination = selectedLocation || customDestination;

        if (isTracking && destination) {
            if ('geolocation' in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (pos) => {
                        const newGpsData: GpsData = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            speed: pos.coords.speed,
                            heading: pos.coords.heading,
                            accuracy: pos.coords.accuracy,
                            timestamp: pos.timestamp
                        };
                        setGpsData(newGpsData);

                        // Calculate straight-line distance for Alarm logic
                        const d = calculateDistance(
                            pos.coords.latitude,
                            pos.coords.longitude,
                            destination.lat,
                            destination.lng
                        );
                        setDistance(d);

                        // Calculate speed in km/h
                        const speed = pos.coords.speed !== null ? pos.coords.speed * 3.6 : 0;
                        setSpeedKmh(Math.round(speed));

                        // Calculate ETA - prefer OSRM duration if available, else usage calculation
                        if (drivingInfo) {
                            // If we have recent driving info, use it but adjust for time passed?
                            // Actually fetchRoute updates every 500ms when gpsData changes, so drivingInfo should be fresh enough.
                            // But drivingInfo is updated via effect on gpsData change.
                            // So we just use drivingInfo.duration in render.
                        } else {
                            setEta(calculateETA(d, speed));
                        }

                        // Alarm when close (Straight line distance < 1km)
                        if (d <= 1) {
                            console.log('ALARM! Destination nearby');
                            // Could trigger notification/sound here
                        }
                    },
                    (err) => console.error('GPS tracking error:', err),
                    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
                );
            }
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isTracking, selectedLocation, customDestination, calculateDistance, calculateETA]); // drivingInfo is not a dep here to avoid loop

    // Handle map click to select custom destination
    const handleMapClick = (lat: number, lng: number) => {
        setCustomDestination({ lat, lng });
        setSelectedLocation(null); // Clear list selection
    };

    // Handle selecting from list
    const handleListSelect = (loc: Location) => {
        setSelectedLocation(loc);
        setCustomDestination(null); // Clear map selection
    };

    // Confirm and start tracking
    const handleConfirmDestination = () => {
        if (selectedLocation || customDestination) {
            setIsTracking(true);
            setScreen('tracking');
        }
    };

    // Get current destination for display
    const currentDestination = selectedLocation || (customDestination ? {
        lat: customDestination.lat,
        lng: customDestination.lng,
        tamil: 'Custom Location',
        name: `${customDestination.lat.toFixed(4)}, ${customDestination.lng.toFixed(4)}`,
        address: 'Map Selection'
    } : null);

    return (
        <div className="app-container">
            {/* Background Video */}
            <video
                className="app-background-video"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                poster="/bg-landscape.png"
            >
                <source src="/bg-video-optimized.mp4" type="video/mp4" />
            </video>
            <div className="app-overlay" />

            {/* Fixed Header */}
            <header className="app-header">
                <div className="header-content">
                    <div className="logo-section">
                        <Navigation className="logo-icon" size={28} />
                        <div className="logo-text">
                            <h1>NAMMA <span>STOP</span></h1>
                            <p>Tamil Nadu Transit Alarm</p>
                        </div>
                    </div>
                    {screen !== 'welcome' && (
                        <button className="back-button" onClick={() => setScreen('welcome')}>
                            <video
                                src="/back-arrow.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="app-main">
                {/* Welcome Screen */}
                {screen === 'welcome' && (
                    <div className="welcome-screen">
                        <div className="welcome-icons">
                            <div className="icon-box rotate-left">🛌</div>
                            <div className="icon-box rotate-right">🚌</div>
                        </div>
                        <h2 className="welcome-title">
                            Never Miss Your <br /><span>Stop Again</span>
                        </h2>
                        <p className="welcome-subtitle">
                            Set your destination and sleep peacefully.<br />
                            We'll wake you up 1km before your stop!
                        </p>

                        <button className="primary-btn" onClick={() => setScreen('picker')}>
                            <MapPin size={20} />
                            Choose Destination
                        </button>
                        <div className="features-grid">
                            <div className="feature-card gps-feature">
                                <FeatureAnimation src="/gps-animation.mp4" size={70} />
                                <span>GPS Tracking</span>
                                <div className="feature-note">Real-time location updates</div>
                            </div>
                            <div className="feature-card">
                                <FeatureAnimation src="/battery-animation.mp4" size={70} />
                                <span>Battery Smart</span>
                                <div className="feature-note">Saves power while tracking</div>
                            </div>
                            <div className="feature-card">
                                <FeatureAnimation src="/alert-animation.mp4" size={70} />
                                <span>Loud Alarm</span>
                                <div className="feature-note">Wakes you up on time</div>
                            </div>
                            <div className="feature-card">
                                <FeatureAnimation src="/offline-animation.mp4" size={70} />
                                <span>Offline Ready</span>
                                <div className="feature-note">Works without internet</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Picker Screen with Map */}
                {screen === 'picker' && (
                    <div className="picker-screen">
                        <div className="picker-sidebar">
                            <h2 className="picker-title">Select Destination</h2>
                            <p className="picker-hint">
                                <Target size={14} /> Tap on the map or select from the list below
                            </p>
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search 150+ locations..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <div className="location-list">
                                {filteredLocations.slice(0, 20).map((loc, i) => (
                                    <div
                                        key={i}
                                        className={`location-item ${selectedLocation?.name === loc.name ? 'selected' : ''}`}
                                        onClick={() => handleListSelect(loc)}
                                    >
                                        <MapPin size={16} className="loc-icon" />
                                        <div className="loc-info">
                                            <span className="loc-tamil">{loc.tamil}</span>
                                            <span className="loc-english">{loc.name} • {loc.address}</span>
                                        </div>
                                        <ChevronRight size={16} className="loc-arrow" />
                                    </div>
                                ))}
                            </div>

                            {/* Show selected destination */}
                            {(selectedLocation || customDestination) && (
                                <div className="selected-destination">
                                    <div className="selected-info">
                                        <strong>
                                            {selectedLocation ? selectedLocation.tamil : 'Custom Location'}
                                        </strong>
                                        <span>
                                            {selectedLocation
                                                ? `${selectedLocation.name}, ${selectedLocation.address}`
                                                : `${customDestination?.lat.toFixed(4)}, ${customDestination?.lng.toFixed(4)}`
                                            }
                                        </span>
                                    </div>
                                    <button className="confirm-btn" onClick={handleConfirmDestination}>
                                        Confirm & Start Tracking
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="picker-map">
                            <MapContainer
                                center={gpsData ? [gpsData.lat, gpsData.lng] : [11.1271, 78.6569]}
                                zoom={gpsData ? 10 : 7}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapClickHandler onMapClick={handleMapClick} />
                                <FlyToLocation location={selectedLocation || customDestination} />

                                {/* Current location marker */}
                                {gpsData && (
                                    <Marker position={[gpsData.lat, gpsData.lng]} icon={currentLocationIcon}>
                                        <Popup>
                                            <strong>📍 Your Location</strong><br />
                                            Accuracy: {Math.round(gpsData.accuracy)}m
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Route line from current location to destination */}
                                {gpsData && (selectedLocation || customDestination) && routePath.length > 0 && (
                                    <Polyline
                                        positions={routePath}
                                        color="#007AFF"
                                        weight={4}
                                        opacity={0.7}
                                        dashArray="10, 10"
                                    />
                                )}

                                {/* Custom destination marker */}
                                {customDestination && (
                                    <Marker position={[customDestination.lat, customDestination.lng]} icon={destinationIcon}>
                                        <Popup>
                                            <strong>🎯 Selected Destination</strong><br />
                                            {customDestination.lat.toFixed(4)}, {customDestination.lng.toFixed(4)}
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Location markers from list */}
                                {filteredLocations.slice(0, 30).map((loc, i) => (
                                    <Marker
                                        key={i}
                                        position={[loc.lat, loc.lng]}
                                        eventHandlers={{ click: () => handleListSelect(loc) }}
                                    >
                                        <Popup>
                                            <strong>{loc.tamil}</strong><br />
                                            {loc.name}
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* Tracking Screen */}
                {screen === 'tracking' && currentDestination && (
                    <div className="tracking-screen">
                        <div className="tracking-header">
                            <div className="trip-info">
                                <span className="trip-label">Your Trip To</span>
                                <h2 className="trip-destination">{currentDestination.tamil}</h2>
                                <p className="trip-details">{currentDestination.name}, {currentDestination.address}</p>
                            </div>
                            <div className="trip-stats">
                                <div className="stat-box">
                                    <Clock size={14} />
                                    <span className="stat-label">Duration</span>
                                    <span className="stat-value">
                                        {drivingInfo ? formatDuration(drivingInfo.duration) : eta}
                                    </span>
                                </div>

                                {drivingInfo && (
                                    <div className="stat-box">
                                        <MapPin size={14} style={{ color: '#64748b' }} />
                                        <span className="stat-label">Arrival</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
                                            <span className="stat-value" style={{ fontSize: '1.25rem' }}>
                                                {getArrivalTime(drivingInfo.duration)}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
                                                NOW: {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="stat-box accent">
                                    <Navigation2 size={14} />
                                    <span className="stat-label">SPEED</span>
                                    <span className="stat-value">{speedKmh} km/h</span>
                                </div>
                            </div>
                        </div>

                        <div className="tracking-content">
                            <div className="distance-card">
                                <div className="lottie-container">
                                    <FeatureAnimation src="/gps-animation.mp4" size={100} />
                                </div>
                                <span className="distance-label">Distance Remaining</span>
                                <div className="distance-value">
                                    {drivingInfo
                                        ? drivingInfo.distance.toFixed(1)
                                        : (distance ? distance.toFixed(1) : '--')
                                    } <span>km</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${Math.min(100, Math.max(5, 100 - (distance || 0) * 2))}%` }}
                                    />
                                </div>
                                {gpsData && (
                                    <div className="gps-info">
                                        <Locate size={12} />
                                        <span>GPS Accuracy: {Math.round(gpsData.accuracy)}m</span>
                                    </div>
                                )}
                            </div>

                            <div className="tracking-map">
                                <MapContainer
                                    center={[currentDestination.lat, currentDestination.lng]}
                                    zoom={12}
                                    style={{ height: '100%', width: '100%', borderRadius: '16px' }}
                                >
                                    <TileLayer
                                        attribution='&copy; OpenStreetMap'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    {/* Current location */}
                                    {gpsData && (
                                        <Marker position={[gpsData.lat, gpsData.lng]} icon={currentLocationIcon}>
                                            <Popup>📍 You are here</Popup>
                                        </Marker>
                                    )}

                                    {/* Destination */}
                                    <Marker position={[currentDestination.lat, currentDestination.lng]} icon={destinationIcon}>
                                        <Popup>🎯 {currentDestination.tamil}</Popup>
                                    </Marker>

                                    {/* Route line */}
                                    {gpsData && routePath.length > 0 && (
                                        <Polyline
                                            positions={routePath}
                                            color="#007AFF"
                                            weight={4}
                                            opacity={0.8}
                                        />
                                    )}
                                </MapContainer>
                            </div>
                        </div>

                        <div className="tracking-actions">
                            <button className="secondary-btn" onClick={() => { setIsTracking(false); setScreen('picker'); }}>
                                Change Destination
                            </button>
                            <button className="danger-btn" onClick={() => {
                                setIsTracking(false);
                                setScreen('welcome');
                                setSelectedLocation(null);
                                setCustomDestination(null);
                            }}>
                                Stop Tracking
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
