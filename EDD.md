# Engineering Design Document (EDD)
## ChalLaa — Technical Architecture & Design

| | |
|---|---|
| **Author** | Priyank Khatri |
| **Version** | 1.0 |
| **Companion doc** | PRD.md |
| **Frontend target** | Expo SDK 54 · React Native 0.81 · React 19.1 · Expo Router (runs in Expo Go) |
| **Backend** | Node.js + Express.js + MongoDB (MERN-style) |

---

## 1. Architecture Overview

```
┌─────────────────────┐        HTTPS (REST)        ┌──────────────────────┐        ┌───────────────┐
│   Expo RN App        │ ───────────────────────▶  │  Express.js API       │ ─────▶ │   MongoDB      │
│  (Expo Go / SDK 54)  │ ◀───────────────────────  │  (Node.js)            │ ◀───── │   (Atlas)      │
│                       │                            │                        │        └───────────────┘
│  - Expo Router (app/) │        WebSocket           │  - REST controllers   │
│  - expo-location      │ ◀────────────────────────▶│  - Socket.io server   │
│  - expo-camera        │   (chat + live location)   │  - JWT middleware     │
│  - expo-contacts      │                            │  - Mongoose models    │
└─────────────────────┘                            └──────────────────────┘
```

- **REST API** handles all CRUD: auth, errands, expenses, reports, admin actions.
- **Socket.io** handles the two things that need to feel instant: in-app chat and live-location updates while an errand is "In Progress". Socket.io is pure JavaScript over WebSocket — it needs no native module, so it works inside Expo Go without a custom dev build.

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Mobile framework | Expo SDK **54**, React Native 0.81, React 19.1 | Pinned so the project stays compatible with Expo Go |
| Navigation | Expo Router (file-based, `/app` directory) | Matches SDK 54's default structure |
| State | React Context (or Zustand if it grows) | Keep it simple for a solo/small-team project |
| Local secure storage | `expo-secure-store` | JWT access/refresh token storage |
| Location | `expo-location` | `getCurrentPositionAsync`, `watchPositionAsync`, reverse geocoding |
| Camera / media | `expo-camera`, `expo-image-picker` | Proof-of-purchase and delivery photos |
| Contacts | `expo-contacts` | Trusted-contacts linking (SDK 54 uses the classic API, not `expo-contacts/next`, which arrives in SDK 55) |
| Notifications | `expo-notifications` (local only) | Remote push is **not supported in Expo Go on Android from SDK 53+** — see §9 |
| Backend runtime | Node.js (LTS 20+) | |
| Backend framework | Express.js | |
| Database | MongoDB (Atlas free tier is fine for a project) via Mongoose | |
| Real-time | Socket.io (`socket.io` server, `socket.io-client` on the app) | |
| Auth | JWT (access + refresh tokens), `bcrypt` for password hashing | |
| Validation | `express-validator` or `zod` | |
| Image upload | `multer` (backend) + client-side compression before upload | |

## 3. Repository / Folder Structure

Matches your existing top-level layout:

```
/frontend                      (Expo SDK 54 app)
  /app                         # Expo Router screens (file-based routing)
    /(auth)/
      login.tsx
      register.tsx
    /(tabs)/
      index.tsx                # Home / discovery feed
      my-errands.tsx
      profile.tsx
    /errand/
      [id].tsx                 # Errand detail + status + map + chat
      post.tsx                 # Post a new errand
    /admin/
      dashboard.tsx
      reports.tsx
    _layout.tsx
  /components
  /hooks                       # useLocation, useAuth, useSocket, etc.
  /services
    api.ts                     # Axios instance + REST calls
    socket.ts                  # Socket.io client setup
  /context                     # AuthContext, ErrandContext
  /constants
  /assets
  app.json
  package.json                 # "expo": "~54.0.0"

/backend                       (Node.js + Express + MongoDB)
  /src
    /config
      db.js                    # Mongoose connection
      env.js
    /models
      User.js
      Errand.js
      Message.js
      Transaction.js
      Report.js
      Notification.js
    /routes
      auth.routes.js
      errand.routes.js
      expense.routes.js
      report.routes.js
      admin.routes.js
    /controllers
      auth.controller.js
      errand.controller.js
      expense.controller.js
      report.controller.js
      admin.controller.js
    /middleware
      auth.middleware.js        # JWT verification
      role.middleware.js        # admin-only guard
      error.middleware.js
    /sockets
      chat.socket.js
      location.socket.js
    /utils
  server.js
  .env.example
  package.json

readme.md
```

## 4. Data Models (MongoDB / Mongoose)

**User**
```js
{
  name: String,
  email: String,           // unique, hostel/college email
  passwordHash: String,
  phone: String,
  hostelOrCollegeId: String,
  isVerified: Boolean,
  role: { type: String, enum: ["user", "admin"], default: "user" },
  trustedContacts: [{ name: String, phone: String }],
  karmaScore: { type: Number, default: 0 },
  avatarUrl: String,
  createdAt: Date
}
```

**Errand**
```js
{
  requesterId: ObjectId,
  runnerId: ObjectId,        // null until accepted
  title: String,
  description: String,
  category: String,          // grocery, medicine, courier, stationery, etc.
  budget: Number,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: [Number]    // [lng, lat] — 2dsphere indexed
  },
  address: String,
  status: {
    type: String,
    enum: ["posted", "accepted", "in_progress", "delivered", "cancelled"],
    default: "posted"
  },
  statusHistory: [{ status: String, timestamp: Date }],
  proofImages: [String],     // uploaded photo URLs
  createdAt: Date,
  updatedAt: Date
}
```

**Message**
```js
{ errandId: ObjectId, senderId: ObjectId, text: String, createdAt: Date, read: Boolean }
```

**Transaction (expense/reimbursement)**
```js
{
  errandId: ObjectId,
  paidBy: ObjectId,
  amount: Number,
  receiptImageUrl: String,
  status: { type: String, enum: ["pending", "settled"], default: "pending" },
  createdAt: Date
}
```

**Report**
```js
{
  errandId: ObjectId,
  reportedBy: ObjectId,
  reportedUser: ObjectId,
  reason: String,
  status: { type: String, enum: ["open", "investigating", "resolved"], default: "open" },
  adminNotes: String,
  createdAt: Date
}
```

**Notification**
```js
{ userId: ObjectId, type: String, message: String, read: Boolean, createdAt: Date }
```

> `Errand.location` needs a `2dsphere` index: `errandSchema.index({ location: "2dsphere" })`

## 5. API Design (REST)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register with hostel/college email | Public |
| POST | `/api/auth/login` | Login, returns access + refresh token | Public |
| POST | `/api/auth/refresh` | Refresh access token | Refresh token |
| GET | `/api/users/me` | Get own profile | User |
| PUT | `/api/users/me` | Update profile / trusted contacts | User |
| POST | `/api/errands` | Post a new errand | User |
| GET | `/api/errands/nearby?lat=&lng=&radius=` | Geofenced discovery feed | User |
| GET | `/api/errands/mine` | My posted / accepted errands (paginated) | User |
| GET | `/api/errands/:id` | Errand detail | User |
| PATCH | `/api/errands/:id/accept` | Accept an errand (sets status = accepted) | User |
| PATCH | `/api/errands/:id/status` | Update status (in_progress / delivered / cancelled) | User |
| POST | `/api/errands/:id/proof` | Upload proof image(s) | User |
| POST | `/api/expenses` | Log an expense against an errand | User |
| PATCH | `/api/expenses/:id/settle` | Mark expense reimbursed | User |
| POST | `/api/reports` | File a report/dispute | User |
| GET | `/api/admin/users/pending` | List users pending verification | Admin |
| PATCH | `/api/admin/users/:id/verify` | Verify / suspend a user | Admin |
| GET | `/api/admin/reports` | List all reports | Admin |
| PATCH | `/api/admin/reports/:id/resolve` | Resolve a report | Admin |

Chat messages are sent over Socket.io, not REST (see §6); a `GET /api/errands/:id/messages` endpoint can still exist to load history when opening a chat screen.

## 6. Real-Time Communication Design (Socket.io)

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `join_errand_room` | client → server | `{ errandId }` | Subscribe to updates for one errand |
| `send_message` | client → server | `{ errandId, text }` | Send a chat message |
| `receive_message` | server → client | `{ senderId, text, timestamp }` | Broadcast to room |
| `location_update` | client → server | `{ errandId, lat, lng }` | Runner streams location while "in_progress" |
| `location_broadcast` | server → client | `{ lat, lng, timestamp }` | Requester receives runner's live position |
| `errand_status_changed` | server → client | `{ errandId, status, timestamp }` | Push status-lifecycle updates instantly to both parties |

Each errand acts as its own Socket.io "room" (`errand_<id>`), so location and chat data never leak between unrelated errands.

## 7. Geofenced Nearby Discovery

MongoDB geospatial query using the `2dsphere` index on `Errand.location`:

```js
Errand.find({
  status: "posted",
  location: {
    $geoWithin: {
      $centerSphere: [[lng, lat], radiusKm / 6378.1]
    }
  }
});
```

`radiusKm` defaults to 1–2 km per the PRD, adjustable per request.

## 8. Authentication & Security

- Passwords hashed with `bcrypt` before storage.
- JWT **access token** (short-lived, ~15 min) + **refresh token** (longer-lived), issued at login.
- Frontend stores tokens in `expo-secure-store`, never `AsyncStorage`, since it's meant for sensitive data.
- `auth.middleware.js` verifies the access token on every protected route; `role.middleware.js` restricts `/api/admin/*` to `role: "admin"`.
- All input validated server-side (`express-validator`/`zod`) before hitting controllers.

## 9. Expo Go / SDK 54 Constraints — Read Before Building

- **Stay on Expo SDK 54 packages only.** Any library that needs custom native code or a config plugin outside the standard Expo SDK will not run in Expo Go — it would force a development build instead. Everything listed in §2 (`expo-location`, `expo-camera`, `expo-image-picker`, `expo-contacts`, `expo-notifications` local API, `expo-secure-store`) is Expo-Go compatible on SDK 54.
- **Remote push notifications do not work in Expo Go on Android from SDK 53 onward** (iOS still works via EAS auto-config, but Android does not). For the MVP, use **local notifications** (`Notifications.scheduleNotificationAsync`) for in-app alerts like "your errand was accepted." True cross-platform remote push is a Phase 2 item that requires moving to an EAS development build — flag this explicitly if it comes up during evaluation/demo.
- When running `npx create-expo-app`, confirm `package.json` shows `"expo": "~54.0.0"`. If a newer SDK gets installed, run `npx expo install expo@54` to pin it, so it matches the Expo Go app version on your phone.
- Because Expo Go only supports the latest SDK version at any given time, keep an eye on when SDK 55 becomes the Expo Go default — at that point you'd need to either upgrade the project or switch to a development build to keep testing on your phone.

## 10. Environment Variables (`/backend/.env.example`)

```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

Frontend keeps its API base URL in `app.json` → `extra.apiUrl`, read via `expo-constants`.

## 11. Deployment Notes (post-MVP)

- Backend: Render / Railway (free tiers work fine for a project demo)
- Database: MongoDB Atlas (free M0 cluster)
- Frontend: stays on Expo Go for development; for a shareable build later, use `eas build` (development or preview profile) — this is also the point where remote push notifications become fully testable.
