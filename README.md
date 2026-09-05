<div align="center">

```
  ██████╗██╗  ██╗ █████╗ ██╗     ██╗      █████╗  █████╗ 
 ██╔════╝██║  ██║██╔══██╗██║     ██║     ██╔══██╗██╔══██╗
 ██║     ███████║███████║██║     ██║     ███████║███████║
 ██║     ██╔══██║██╔══██║██║     ██║     ██╔══██║██╔══██║
 ╚██████╗██║  ██║██║  ██║███████╗███████╗██║  ██║██║  ██║
  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
```

### ⚡ The Real-Time Campus Micro-Task & Errand Economy ⚡
*Connecting hostel residents, active runners, and campus communities through zero-friction errand fulfillment.*

<br/>

[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057.0.20-5856D6?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86.3-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-v20.x%20LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.21.x-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-2dsphere%20Geospatial-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.x%20Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B.svg?style=for-the-badge)](LICENSE)

<br/>

[🌟 Vision](#-the-vision) • [📱 Visual Experience](#-visual-experience) • [✨ Key Modules](#-feature-matrix--user-journeys) • [🏛️ System Architecture](#️-system-architecture) • [🛰️ Live WebSocket Protocol](#-real-time-websocket-matrix) • [🔌 REST API](#-rest-api-documentation) • [⚡ Quickstart](#-step-by-step-quickstart) • [🛡️ Security](#-trust-reputation--security)

---

</div>

<br/>

## 🎯 The Vision

In every university hostel and PG across the country, hundreds of students make redundant trips daily to the night canteen, campus pharmacy, stationery shops, and parcel drop-off hubs. Meanwhile, roommates and peers desperately seek someone to bring essentials back with them.

Current interactions happen in unstructured, chaotic **WhatsApp groups**:
- ❌ Zero location geofencing (flooded with irrelevant requests miles away)
- ❌ No live tracking or ETA visibility
- ❌ Constant disputes over actual bill prices & missing items
- ❌ Unregulated transactions with no trust rating or moderation

> **ChalLaa** reimagines campus logistics into an automated, transparent, and rewarding ecosystem. It provides **GPS geofenced broadcasts**, **live runner trip streaming**, **camera proof of purchase ledger**, and a **peer karma reputation protocol**.

---

## 🥊 WhatsApp Groups vs. ChalLaa

| Feature | 💬 WhatsApp Groups | 🏃‍♂️ ChalLaa |
|---|---|---|
| **Location Discovery** | Cluttered spam & noise | **Geofenced 2dsphere radius (1km / 2km / 5km)** |
| **Trip Tracking** | Repeated calls ("Where are you?") | **Live GPS streaming with sub-5m precision** |
| **Receipts & Pricing** | Unverified claims | **Camera proof photos + Itemized Ledger** |
| **Reimbursements** | Unsettled awkward reminders | **One-tap settlement ledger & debt tracking** |
| **Reputation & Safety** | Anonymous / unverified numbers | **Verified student college IDs + Karma score** |
| **In-App Communication** | Exposing personal phone numbers | **Encrypted errand chat rooms with typing sync** |

---

## 📱 Visual Experience

```
  ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
  │ 📍 Discovery Feed         │      │ 🛰️ Live Runner Radar      │      │ 🧾 Proof & Expense Ledger │
  ├───────────────────────────┤      ├───────────────────────────┤      ├───────────────────────────┤
  │ [Distance: 2km] [Food]    │      │ Status: IN PROGRESS       │      │ Errand: 2x Paracetamol   │
  │                           │      │ Runner: Aryan Sharma 🏃   │      │ Status: DELIVERED         │
  │ 🛒 2 Pkts Milk + Bread    │      │ Speed: 14.2 km/h          │      │                           │
  │ Offer: ₹50 • 200m away    │      │ Distance Left: 320 meters │      │ [ 📷 View Receipt Image ] │
  │ Hostel 4 -> Night Canteen │      │                           │      │                           │
  │ [ ★ 150 Karma ] [Accept]  │      │ 🏃────●─────────📍        │      │ Item Cost:    ₹65.00      │
  │                           │      │ (Market)     (Hostel 4)   │      │ Runner Tip:   ₹25.00      │
  │ 💊 Pain Relief Medicine   │      │                           │      │ Total:        ₹90.00      │
  │ Offer: ₹80 • 450m away    │      │ 💬 "Reached store gate!"  │      │                           │
  │ [ ★ 120 Karma ] [Accept]  │      │ [ Open Errand Chat ]      │      │ [ ✓ Settle & Rate Karma ] │
  └───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

---

## ✨ Feature Matrix & User Journeys

```mermaid
graph TD
    subgraph 🙋 Requester
        R1[Post Errand with GPS] --> R2[Select Category & Budget]
        R2 --> R3[Broadcast to Campus]
        R3 --> R4[Live GPS Tracking]
        R4 --> R5[In-App Chat]
        R5 --> R6[Approve Expense & Rate Karma]
    end

    subgraph 🏃 Runner
        U1[Browse Geofenced Feed] --> U2[Accept Errand]
        U2 --> U3[Stream Live Location]
        U3 --> U4[Capture Receipt Photo]
        U4 --> U5[Log Itemized Expense]
        U5 --> U6[Earn Karma & Cash]
    end

    subgraph 🛡️ Moderator
        A1[Monitor Campus Feed] --> A2[Verify Student IDs]
        A2 --> A3[Investigate Disputes]
        A3 --> A4[Maintain Platform Integrity]
    end

    R3 -.-> U1
    U2 -.-> R4
    U4 -.-> R6
```

---

## 🏛️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │   📱 ChalLaa Mobile App       │
                                  │   (React Native 0.86 / SDK 57)│
                                  └───────────────┬───────────────┘
                                                  │
                                ┌─────────────────┴─────────────────┐
                                │                                   │
                     REST API (Axios + JWT)            WebSockets (Socket.io)
                                │                                   │
                                ▼                                   ▼
                    ┌───────────────────────────────────────────────────┐
                    │               ⚡ Node.js API Gateway              │
                    │               (Express 4.21 / Port 5000)          │
                    ├───────────────────────────────────────────────────┤
                    │  • Auth Middleware (JWT Token Rotation)           │
                    │  • Geofence Engine (MongoDB 2dsphere $geoWithin)  │
                    │  • Multipart Image Processing (Multer 10MB)       │
                    │  • Real-Time Room Multiplexing (`errand_${id}`)   │
                    │  • Dispute Arbitration & Karma Engine             │
                    └─────────────────┬─────────────────┬───────────────┘
                                      │                 │
                ┌─────────────────────┴──────┐   ┌──────┴─────────────────────┐
                │       🍃 MongoDB           │   │    📁 Static Storage       │
                │  - Users & Trusted Contacts│   │    - Receipt Photos        │
                │  - Errands & GeoPoints     │   │    - Proof Images          │
                │  - Transactions & Ledger   │   │    - Static Assets         │
                │  - Ratings & Disputes      │   │                            │
                └────────────────────────────┘   └────────────────────────────┘
```

---

## 🛰️ Real-Time WebSocket Matrix

| Event Name | Direction | Payload Schema | Purpose |
|---|---|---|---|
| `join_errand_room` | `Client ➔ Server` | `{ errandId: string, userId: string }` | Joins authenticated errand communication room |
| `leave_errand_room`| `Client ➔ Server` | `{ errandId: string }` | Cleanly leaves room to prevent background socket leak |
| `send_message` | `Client ➔ Server` | `{ errandId: string, senderId: string, text: string }` | Broadcasts chat message to both parties in room |
| `receive_message` | `Server ➔ Client` | `{ _id: string, text: string, senderId: Object, createdAt: Date }` | Pushes instant chat update to active screen |
| `typing_start` | `Client ➔ Server` | `{ errandId: string, userName: string }` | Triggers real-time peer typing indicator |
| `typing_stop` | `Client ➔ Server` | `{ errandId: string }` | Clears peer typing bubble |
| `location_update` | `Runner ➔ Server` | `{ errandId: string, lat: number, lng: number, speed: number }` | Streams live GPS telemetry from running device |
| `location_broadcast`| `Server ➔ Requester` | `{ errandId: string, lat: number, lng: number, speed: number }` | Pushes updated map coordinates to requester |

---

## 🔌 REST API Documentation

### 1. Authentication (`/api/auth`)
* `POST /api/auth/register` — Create student account with name, email, password, and hostel details.
* `POST /api/auth/login` — Authenticate and receive `accessToken` (15m) and `refreshToken` (7d).
* `POST /api/auth/refresh` — Seamless token rotation stored securely in Expo `SecureStore`.

### 2. Errands Engine (`/api/errands`)
* `POST /api/errands` — Post an errand with category, budget offer, notes, and GPS coordinates.
* `GET /api/errands/nearby?lat=...&lng=...&radius=2&category=all` — Geospatial discovery feed query.
* `GET /api/errands/mine?role=posted|accepted` — User personal errand history and active runs.
* `GET /api/errands/:id` — Detailed view with populated requester, runner, and status history.
* `PATCH /api/errands/:id/accept` — Atomically claim task and assign runner identity.
* `PATCH /api/errands/:id/status` — State machine transition (`in_progress`, `delivered`, `cancelled`).
* `POST /api/errands/:id/proof` — Upload photo proof (multipart/form-data).
* `GET /api/errands/:id/messages` — Fetch full historical chat transcript for errand.
* `POST /api/errands/:id/messages` — REST fallback message creation.

### 3. Expense Ledger (`/api/expenses`)
* `POST /api/expenses` — Log out-of-pocket purchases with receipt attachments.
* `GET /api/expenses/errand/:errandId` — Retrieve itemized ledger and pending/settled totals.
* `PATCH /api/expenses/:id/settle` — Mark expense as reimbursed.

### 4. Karma & Campus Moderation (`/api/karma` & `/api/admin`)
* `POST /api/karma/rate` — Submit 1–5 star rating, peer review, and update karma balance.
* `POST /api/karma/dispute` — Escalate transaction or delivery issues to campus moderators.
* `GET /api/admin/stats` — Platform metrics (volume, active tasks, user counts).
* `PATCH /api/admin/users/:id/verify` — Toggle verified student badge on student ID check.
* `PATCH /api/admin/disputes/:id/resolve` — Arbitrate and close dispute tickets.

---

## ⚡ Step-by-Step Quickstart

### Prerequisites
- **Node.js** v18+ LTS
- **MongoDB** running locally (`mongodb://localhost:27017/challaa`) or MongoDB Atlas URI
- **Expo Go App** on iOS / Android or Android Studio Emulator

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Priyankkhatri/ChalLaa.git
cd ChalLaa
```

---

### Step 2: Configure & Start Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/challaa
JWT_ACCESS_SECRET=challaa_dev_access_secret_2026_x89f
JWT_REFRESH_SECRET=challaa_dev_refresh_secret_2026_z73a
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Start the backend:
```bash
npm run dev
```
> Server running at `http://localhost:5000` • Socket.io initialized.

---

### Step 3: Configure & Launch Frontend App

```bash
cd ../frontend
npm install
npx expo start
```

* Press `a` to open in Android Emulator.
* Or scan the terminal QR code with your mobile **Expo Go** app!

---

## 🛡️ Trust, Reputation & Security

```
                                 ┌───────────────────────────────┐
                                 │       ⭐ Karma Engine         │
                                 └───────────────┬───────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   ▼                             ▼                             ▼
       ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
       │   5-Star Delivery    │      │    3-Star Average    │      │    Flagged Report    │
       │   +5 Karma Points    │      │    +1 Karma Point    │      │    -5 Karma Deduction│
       │   "Fast & Reliable"  │      │   "Satisfactory"     │      │   Moderator Review   │
       └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
```

1. **JWT Bearer Token Rotation**: Access tokens expire in 15 minutes; auto-refreshed seamlessly in background via SecureStore interceptors.
2. **2dsphere Geofencing**: Strict coordinate validation (`-90 <= lat <= 90` and `-180 <= lng <= 180`) guarantees zero fake coordinates.
3. **Receipt Image Sanitization**: Image uploads pass through MIME type validators and disk storage sanitizers.
4. **Campus ID Verification**: Verified students display an official green checkmark badge `✓` on all errand feeds and profiles.

---

## 🎨 Design System

ChalLaa features an ultra-luxury, high-contrast visual identity inspired by modern glassmorphism and ambient mobile design:

```
  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
  │ Electric Indigo │   │ Deep Violet     │   │ Emerald Mint    │   │ Sunburst Amber  │
  │     #6366F1     │   │     #4F46E5     │   │     #10B981     │   │     #F59E0B     │
  │  Primary Brand  │   │   Hero Header   │   │ Success & Badges│   │   Karma Stars   │
  └─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## 👨‍💻 Author & Project Credits

Developed with passion by **Priyank Khatri**  
*Project Repository:* [https://github.com/Priyankkhatri/ChalLaa](https://github.com/Priyankkhatri/ChalLaa)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE) — free for educational and community use.

<div align="center">
  <br/>
  <b>Built for faster, friendlier, and safer campus communities. 🏃‍♂️📦</b>
</div>