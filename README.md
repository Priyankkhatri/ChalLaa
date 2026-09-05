# ChalLaa 🏃‍♂️📦

> **Decentralized, Peer-to-Peer Campus Errand Network**

ChalLaa is a full-stack campus errand and micro-task platform built with React Native (Expo SDK 57), Node.js/Express, MongoDB, and Socket.io. It connects students across university hostels for transparent, GPS-geofenced errands with real-time tracking, live chat, and peer karma scoring.

---

## 🚀 Key Features

### 1. 🙋 Requester Side
- **Geofenced Errand Posting**: Broadcast micro-tasks with live GPS auto-fill and category tags.
- **Discovery Feed**: Real-time nearby errand feed filtered by distance radius (1km, 2km, 5km).
- **Live Runner GPS Tracking**: Track active runners in real-time over WebSockets.
- **In-App Messaging**: Instant errand chat with typing indicators and read status.
- **Expense Reimbursement**: Review itemized receipts and settle peer expenses.
- **Peer Karma Scoring**: Reward runners with karma points and feedback.

### 2. 🏃 Runner Side
- **Instant Acceptance**: Take available campus errands with one tap.
- **Live Location Streaming**: Stream real-time GPS telemetry during task delivery.
- **Photo & Bill Proofs**: Capture camera receipts and upload proof of delivery.
- **Expense Logging**: Record out-of-pocket purchases for transparent settlement.
- **Karma & Reputation**: Build campus runner ranking and earn trusted badges.

### 3. 🛡️ Campus Admin & Moderator Panel
- **Platform Analytics**: Monitor active tasks, total volume, and user growth.
- **Student Verification**: Verify university student ID cards for trusted status.
- **Dispute Resolution**: Investigate and resolve peer disputes.

---

## 🛠️ Tech Stack
- **Frontend**: React Native, Expo SDK 57, Expo Router, Lucide Icons, Reanimated
- **Backend**: Node.js, Express.js, MongoDB (Mongoose 2dsphere), Socket.io
- **Auth**: JWT Access & Refresh Token rotation stored in Expo SecureStore