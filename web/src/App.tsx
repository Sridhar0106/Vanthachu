import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import {
    Navigation,
    MapPin,
    Search,
    ChevronRight,
    Clock,
    Navigation2,
    Locate,
    Target,
    Loader2
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

// Automatically center map on user location when GPS is found
function UserLocationUpdater({ gpsData }: { gpsData: GpsData | null }) {
    const map = useMap();
    const [hasCentered, setHasCentered] = useState(false);

    useEffect(() => {
        if (gpsData && !hasCentered) {
            map.flyTo([gpsData.lat, gpsData.lng], 15, { duration: 2 });
            setHasCentered(true);
        }
    }, [gpsData, map, hasCentered]);
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

// Button to re-center map on user location and force refresh
function MapReCenterButton({ gpsData }: { gpsData: GpsData | null }) {
    const map = useMap();
    const handleRecenter = () => {
        if (gpsData) {
            map.flyTo([gpsData.lat, gpsData.lng], 18, { duration: 1.5 });
        }
        // Also try to force a fresh read
        navigator.geolocation.getCurrentPosition(
            () => console.log('Refreshed location'),
            (e) => console.error(e),
            { maximumAge: 0, enableHighAccuracy: true }
        );
    };

    if (!gpsData) return null;

    return (
        <button
            onClick={handleRecenter}
            style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer'
            }}
            title="Locate Me"
        >
            <Locate size={20} color="#007AFF" />
        </button>
    );
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
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio('/alarm.wav');
        audioRef.current.loop = true;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const stopAlarm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsAlarmPlaying(false);
    };

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

    // Continuous GPS tracking from start
    useEffect(() => {
        let watchId: number;
        if ('geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    // Filter out stale data (older than 1 minute)
                    const age = Date.now() - pos.timestamp;
                    if (age > 60000) {
                        console.warn('Ignoring stale GPS data, age:', age);
                        return;
                    }

                    const newGpsData: GpsData = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        speed: pos.coords.speed,
                        heading: pos.coords.heading,
                        accuracy: pos.coords.accuracy,
                        timestamp: pos.timestamp
                    };
                    setGpsData(newGpsData);
                },
                (err) => console.error('GPS error:', err),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    // Tracking logic (distance, alarm, eta)
    useEffect(() => {
        const destination = selectedLocation || customDestination;
        if (isTracking && destination && gpsData) {
            // Calculate straight-line distance
            const d = calculateDistance(
                gpsData.lat,
                gpsData.lng,
                destination.lat,
                destination.lng
            );
            setDistance(d);

            // Calculate speed in km/h
            const speed = gpsData.speed !== null ? gpsData.speed * 3.6 : 0;
            setSpeedKmh(Math.round(speed));

            if (!drivingInfo) {
                setEta(calculateETA(d, speed));
            }

            // Alarm when close
            if (d <= 1) {
                console.log('ALARM! Destination nearby');
                if (!isAlarmPlaying && audioRef.current) {
                    audioRef.current.play().catch(e => console.error("Audio play failed", e));
                    setIsAlarmPlaying(true);
                }
            }
        }
    }, [isTracking, gpsData, selectedLocation, customDestination, calculateDistance, calculateETA, drivingInfo, isAlarmPlaying]);

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
                            {!gpsData ? (
                                <div style={{
                                    height: '100%',
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#f1f5f9',
                                    color: '#64748b'
                                }}>
                                    <Loader2 className="animate-spin" size={48} style={{ animation: 'spin 1s linear infinite' }} />
                                    <p style={{ marginTop: '16px', fontWeight: 600, fontSize: '1.1rem' }}>Locating you...</p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Please enable GPS access</p>
                                    <style>{`
                                        @keyframes spin {
                                            from { transform: rotate(0deg); }
                                            to { transform: rotate(360deg); }
                                        }
                                    `}</style>
                                </div>
                            ) : (
                                <MapContainer
                                    center={[gpsData.lat, gpsData.lng]}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapClickHandler onMapClick={handleMapClick} />
                                    <FlyToLocation location={selectedLocation || customDestination} />
                                    <UserLocationUpdater gpsData={gpsData} />
                                    <MapReCenterButton gpsData={gpsData} />

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
                            )}
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
                                        <span style={{ fontSize: '0.75rem', color: '#0f172a', marginBottom: '2px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                            NOW: {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                                            <MapPin size={12} style={{ color: '#64748b' }} />
                                            <span className="stat-label">ARRIVAL</span>
                                        </div>
                                        <span className="stat-value">
                                            {getArrivalTime(drivingInfo.duration)}
                                        </span>
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

                        {/* Alarm Overlay */}
                        {isAlarmPlaying && (
                            <div style={{
                                position: 'fixed',
                                bottom: '90px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 2000,
                                width: '90%',
                                maxWidth: '400px'
                            }}>
                                <button
                                    onClick={stopAlarm}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        animation: 'pulse 1s infinite'
                                    }}
                                >
                                    <Clock className="animate-bounce" />
                                    STOP ALARM
                                </button>
                                <style>{`
                                    @keyframes pulse {
                                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                                        70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                                    }
                                `}</style>
                            </div>
                        )}
                    </div>
            </main>
        </div>
    );
};

export default App;
