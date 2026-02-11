# Namma Stop - Quick Start Guide

## 🚀 How to View the App

### Option 1: Web Preview (Demo UI Only)
The web server is currently running! Open your browser and go to:

**http://localhost:8081**

> **Note**: The web version is a UI demo only. Full features (GPS tracking, maps, background services, alarms) require a mobile device.

### Option 2: Mobile Device (Full Features)

1. **Install Expo Go** on your phone:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Connect to the same WiFi** as your computer

3. **Scan the QR code** shown in the terminal (or run `npm start` if stopped)

4. **Grant permissions** when prompted:
   - Location (Always/Background)
   - Notifications

## 📱 What You'll See

### Initial Screen
![Home Screen - Idle](C:/Users/Periyasamy A/.gemini/antigravity/brain/e6d986bd-4111-4d82-b953-44cf6bef8875/home_screen_idle_1769883221825.png)

- Tap "Choose Destination" to start
- Select your stop via search or map
- Start tracking

### Tracking Screen
![Home Screen - Tracking](C:/Users/Periyasamy A/.gemini/antigravity/brain/e6d986bd-4111-4d82-b953-44cf6bef8875/home_screen_tracking_1769883244677.png)

- Real-time distance updates
- Current speed and ETA
- Lock your phone and sleep!
- Alarm triggers at 1km

## 🎯 Key Features

✅ **1km Geofence** - Alarm triggers automatically  
✅ **Battery Optimized** - Smart GPS accuracy switching  
✅ **Silent Mode Override** - Alarm plays even on silent  
✅ **Background Tracking** - Works when phone is locked  
✅ **Offline Support** - No internet needed for tracking  

## 🔧 Development Commands

```bash
# Start development server
npm start

# Run on web (demo UI)
npm run web

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📝 Next Steps

1. **Test on mobile device** using Expo Go
2. **Add custom alarm sound** to `assets/alarm.mp3`
3. **Integrate Google Places API** for production search
4. **Build for app stores** when ready:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

## 🌐 Current Status

- ✅ Web server running on **localhost:8081**
- ✅ All TypeScript checks passing
- ✅ Ready for mobile testing
- ⏳ Waiting for mobile device connection

---

**Made for Tamil Nadu travelers** 🚏💤
