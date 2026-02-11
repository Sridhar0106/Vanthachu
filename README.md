# Namma Stop - Transit Wake-up Alarm App

**Never miss your bus stop again!** Namma Stop is a smart mobile app that wakes you up when you're approaching your destination using GPS geofencing.

## 🎯 Features

### Core Functionality
- **1km Geofence Alert**: Automatically triggers an alarm when you're within 1km of your destination
- **Background Tracking**: Works even when your phone is locked or the app is in the background
- **Silent Mode Override**: Alarm plays even if your phone is on silent or vibrate mode
- **Volume Ramp-up**: Gradually increases alarm volume from 30% to 100% over 30 seconds
- **Battery Optimized**: Smart GPS accuracy switching based on distance to destination

### User Interface
- **Dual Destination Selection**: Choose your stop via search or by tapping on a map
- **Real-time Tracking**: See distance remaining, current speed, and estimated time of arrival
- **Clean Design**: Modern blue/white theme optimized for accessibility and outdoor visibility
- **History & Favorites**: Quick access to frequently used destinations

### Offline Support
- **Works Without Internet**: Distance calculation happens locally using GPS only
- **Perfect for Tamil Nadu**: Designed to work in network dead zones during long journeys

## 📱 Installation

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Expo Go app on your phone (for testing)

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on your device**:
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

## 🚀 Usage

1. **Grant Permissions**: Allow location access (including background location)
2. **Set Destination**: 
   - Search for your stop by name
   - Or tap on the map to select exact location
3. **Start Tracking**: Tap "Choose Destination" to begin
4. **Sleep**: Lock your phone and relax - we'll wake you up!
5. **Wake Up**: When you're 1km away, the alarm will sound

## 🔧 Technical Architecture

### Tech Stack
- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Maps**: React Native Maps
- **Location**: Expo Location with background task manager
- **Notifications**: Expo Notifications
- **Audio**: Expo AV
- **Storage**: AsyncStorage (offline-first)

### Key Services

#### LocationService
- Background location tracking with battery optimization
- Geofence monitoring (1km radius)
- Permission handling for iOS and Android
- Foreground service for Android

#### AlarmService
- Silent mode override using native audio APIs
- Volume ramp-up (30% → 100% over 30 seconds)
- High-priority notifications
- Vibration patterns

#### StorageService
- Offline destination history
- Favorites management
- Local data persistence

### Battery Optimization Strategy

The app uses adaptive GPS accuracy based on distance:

| Distance to Destination | GPS Accuracy | Update Interval |
|------------------------|--------------|-----------------|
| > 10km | Low | 2 minutes |
| 2km - 10km | Medium | 30 seconds |
| < 2km | High | 10 seconds |

This ensures accurate alerts while preserving battery life.

## 📂 Project Structure

```
Wakeup/
├── App.tsx                          # Main app entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── src/
│   ├── constants/
│   │   └── theme.ts                 # Color palette and spacing
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   ├── utils/
│   │   └── geofence.ts              # Distance calculations
│   ├── services/
│   │   ├── LocationService.ts       # GPS tracking
│   │   ├── AlarmService.ts          # Alarm functionality
│   │   └── StorageService.ts        # Local storage
│   └── screens/
│       ├── HomeScreen.tsx           # Main tracking screen
│       ├── DestinationPicker.tsx    # Destination selection
│       └── AlarmScreen.tsx          # Alarm UI
└── assets/
    └── alarm.mp3                    # Alarm sound
```

## 🔐 Permissions Required

### Android
- `ACCESS_FINE_LOCATION` - GPS tracking
- `ACCESS_BACKGROUND_LOCATION` - Background tracking
- `FOREGROUND_SERVICE` - Keep app running
- `WAKE_LOCK` - Wake device for alarm
- `VIBRATE` - Vibration
- `MODIFY_AUDIO_SETTINGS` - Override silent mode

### iOS
- Location When In Use
- Location Always (for background tracking)
- Notifications

## 🧪 Testing

### Manual Testing Checklist

1. **Permissions**:
   - [ ] Location permission granted
   - [ ] Background location permission granted
   - [ ] Notification permission granted

2. **Destination Selection**:
   - [ ] Search works
   - [ ] Map selection works
   - [ ] Geofence circle displays correctly

3. **Tracking**:
   - [ ] Background tracking continues when app is closed
   - [ ] Distance updates in real-time
   - [ ] Speed and ETA display correctly

4. **Alarm**:
   - [ ] Alarm triggers at 1km
   - [ ] Sound plays even in silent mode
   - [ ] Volume ramps up gradually
   - [ ] Vibration works
   - [ ] Dismiss and snooze buttons work

5. **Battery**:
   - [ ] GPS accuracy switches based on distance
   - [ ] Battery consumption is reasonable

### GPS Simulation

For testing without traveling:
- **Android**: Use Android Studio's Location Simulation
- **iOS**: Use Xcode's Location Simulation
- Set a destination 5km away and simulate movement toward it

## 🚧 Known Limitations

1. **Alarm Sound**: Currently uses system default. Add a custom `alarm.mp3` file to `assets/` for a custom sound.
2. **Google Places API**: Search uses mock data. Integrate Google Places API for production.
3. **Authentication**: OTP login not yet implemented (optional feature).
4. **Backend**: No backend server yet (optional for sharing stops across users).

## 🛣️ Roadmap

- [ ] Firebase OTP authentication
- [ ] Google Places API integration
- [ ] Backend server for shared bus stops
- [ ] Trip history analytics
- [ ] Multiple alarm sounds
- [ ] Custom geofence radius
- [ ] Share favorite stops with friends

## 📄 License

MIT License - Feel free to use this for your own projects!

## 🙏 Acknowledgments

Built for travelers in Tamil Nadu who want to sleep peacefully during long bus journeys without missing their stop.

---

**Made with ❤️ for Namma Tamil Nadu**
