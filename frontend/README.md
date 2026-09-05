# ChalLaa — Campus Errand Peer-to-Peer Network (Frontend) 🚀

ChalLaa is a next-generation campus peer-to-peer delivery and errand assistance network designed for university campuses. Built with React Native and Expo SDK 57, it features an authentic **iOS 26 Liquid Glass** design system powered by GPU shaders, dynamic caustics, and fluid gesture navigation.

---

## ✨ Features & Architecture

### 🍸 Next-Gen Liquid Glass Design System
- **Native GPU Shaders**: Powered by [`react-native-liquid-glassmorphism`](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism) for Apple's native `UIGlassEffect` on iOS 26 and real-time AGSL refraction on Android 13+.
- **Ambient Caustics (`LiquidCanvas`)**: Multi-layered radiant light fields that cast realistic specular refraction and caustic dispersion through frosted surfaces.
- **Cross-Platform Refraction**: High-fidelity optical blur on Web via `backdropFilter: blur(36px) saturate(220%)` with specular top crest highlights and curved inner refractions.

### 🌊 Fluid Gesture Navigation (`LiquidGlassTabBar`)
- **Interactive Sliding Mercury Bubble**: Single continuous fluid bubble that glides between tabs using velocity-aware spring physics.
- **Touch & Hold Slide Drag**: Uses React Native `PanResponder` to let users slide their thumb across the bar with real-time elasticity, squash-and-stretch fluid physics, and tactile haptic ticks on tab crossing.
- **Native Shift Transitions**: Tab route navigation integrated with `@react-navigation/bottom-tabs` v7 shift transitions for seamless horizontal flow.
- **Ergonomic Elevation**: Floating pill architecture with elevated action buttons (`+` Errand FAB).

---

## 📱 Navigation Tabs

| Tab | Route | Description |
|---|---|---|
| 🧭 **Campus Feed** | `/(tabs)` | Live discovery of nearby student errand requests with radius filtering and category scrollers |
| 📋 **My Errands** | `/(tabs)/my-errands` | Real-time tracking of active errand requests and runner tasks |
| 👤 **Profile** | `/(tabs)/profile` | Student verification badges, karma rating, and trusted peer circle |

---

## 🛠️ Tech Stack

- **Framework**: Expo SDK 57 (React Native 0.86.3, React 19.2.3)
- **Routing**: Expo Router v5 (File-based universal routing)
- **Styling**: Vanilla React Native StyleSheet + Custom Liquid Glass Design Tokens
- **Icons**: Lucide Icons (`lucide-react-native`)
- **Animation & Gestures**: React Native Animated + PanResponder + Expo Haptics
- **Networking**: Axios + Socket.io Client for real-time live tracking

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps
```

### Running Locally
```bash
# Start Metro bundler
npx expo start

# Open Web version
npx expo start --web

# Run on Android emulator / device
npx expo run:android

# Run on iOS simulator
npx expo run:ios
```

---

## 📄 License
ISC License — ChalLaa Campus Delivery Network.
