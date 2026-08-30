# Product Requirements Document (PRD)
## ChalLaa — Peer-to-Peer Errand Coordination App for Hostels & Campuses

| | |
|---|---|
| **Author** | Priyank Khatri |
| **Version** | 1.0 |
| **Status** | Approved (project guide sign-off received) |
| **Platform target** | Expo SDK 54 (React Native 0.81 / React 19.1), runnable in Expo Go |

---

## 1. Overview

ChalLaa is a mobile app that lets students living in the same hostel, PG, or campus post and fulfil small errands for each other in real time — knowing who's already heading to the market, mess, pharmacy, or courier point, and getting proof, tracking, and reimbursement handled inside the app instead of an unstructured WhatsApp group.

## 2. Problem Statement

Hostel and campus residents have no way of knowing, in real time, which of their peers are currently heading out to nearby locations to request or fulfil small errands. Existing solutions (WhatsApp groups) are unstructured, not location-aware, and provide no tracking, proof, expense handling, or accountability once an errand is accepted.

## 3. Goals & Success Metrics

| Goal | Success Metric |
|---|---|
| Reduce redundant individual trips | Avg. errands fulfilled per active user per week |
| Build trust between requester & runner | % of errands with proof photo attached; avg. rating |
| Make money handling frictionless | % of errand expenses marked "settled" within 24h |
| Keep the platform safe | % of users verified via hostel/college ID at signup |
| Prove technical depth (academic goal) | All modules (auth, geo, camera, chat, admin) demoable end-to-end |

## 4. Target Users / Personas

| Persona | Description |
|---|---|
| **Requester** | Student who needs something picked up/dropped off and posts an errand |
| **Runner** | Student already heading out who accepts and fulfils an errand |
| **Admin / Moderator** | Hostel warden, RWA-equivalent, or student council rep who verifies users and resolves disputes |

Note: Requester and Runner are the same user role in the data model — any verified user can post or accept errands.

## 5. User Stories

**Authentication & Trust**
- As a student, I want to sign up with my hostel/college email or ID so that only verified peers can see my errands.
- As a user, I want to add trusted contacts so I feel safer using the app.

**Posting & Discovery**
- As a requester, I want to post an errand with item, budget, and location so nearby peers can see it.
- As a runner, I want to see only errands within 1–2 km of me so the app stays relevant to my hostel/campus.

**Fulfilment & Tracking**
- As a runner, I want to accept an errand and have my live location shared with the requester so they know when to expect it.
- As a requester, I want to see the errand move through clear stages (Posted → Accepted → In Progress → Delivered) with timestamps, so I know exactly what's happening and when.

**Proof & Money**
- As a requester, I want the runner to upload a photo of the purchase/receipt so there's no dispute about what was bought.
- As a runner, I want to log what I spent and get reimbursed, with a clear record of what's settled and what isn't.

**Communication**
- As a requester or runner, I want to chat in-app about the errand (e.g. "no Amul milk left, get Nandini instead?") without exchanging phone numbers.

**Trust & Safety**
- As a user, I want to report a bad experience so repeat offenders are caught.
- As an admin, I want a dashboard to verify new users, review reports/disputes, and manage accounts.

## 6. Functional Requirements

| ID | Requirement |
|---|---|
| FR-1.1 | Users can register/login with hostel/college email; passwords stored hashed |
| FR-1.2 | JWT-based session with secure token storage on device |
| FR-1.3 | Users can manage a trusted-contacts list, optionally linked to device contacts |
| FR-2.1 | Users can post an errand with title, description, category, budget, and location |
| FR-2.2 | Discovery feed shows only errands within a configurable radius (default 1–2 km) of the user |
| FR-2.3 | Feed supports pull-to-refresh and pagination |
| FR-3.1 | Runner can accept a posted errand; status changes to "Accepted" with a timestamp |
| FR-3.2 | Every status change (Posted, Accepted, In Progress, Delivered, Cancelled) is timestamped and visible to both parties |
| FR-3.3 | While "In Progress", the runner's live location is shared with the requester on a map |
| FR-4.1 | Runner can attach one or more photos as proof of purchase/delivery |
| FR-4.2 | Requester can mark an errand "Delivered" after reviewing proof |
| FR-5.1 | Runner can log actual expense against an errand |
| FR-5.2 | Requester can mark an expense as reimbursed; running balance is visible per user |
| FR-6.1 | Requester and runner can exchange in-app text messages tied to a specific errand |
| FR-6.2 | Chat is only accessible to the two participants of that errand |
| FR-7.1 | Users can rate each other and build a karma/reputation score after an errand is completed |
| FR-7.2 | Users can report another user or an errand for review |
| FR-8.1 | Admin can view and verify pending user registrations |
| FR-8.2 | Admin can view, investigate, and resolve reports/disputes |
| FR-8.3 | Admin can suspend or remove a user account |

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Discovery feed and status updates should reflect changes within a few seconds |
| Security | Passwords hashed (bcrypt); JWT expiry + refresh; role-based access for admin routes |
| Usability | Must work on a typical hostel wifi/mobile data connection — images compressed before upload |
| Compatibility | Must run inside **Expo Go on Expo SDK 54** for development and demo — no custom native modules |
| Data privacy | Live location is only shared for the duration of an active errand, never stored long-term |
| Availability | Backend should degrade gracefully (clear error states) if network/API calls fail |

## 8. Assumptions & Constraints

- The app is developed and demoed using **Expo Go (SDK 54)** — this rules out any library requiring custom native code or a development build (everything must come from the standard Expo SDK).
- Remote/background push notifications are **not supported in Expo Go on Android from SDK 53 onward** (Expo policy). The MVP therefore uses **local/in-app notifications** for status updates; true remote push is a Phase 2 item once the app moves to an EAS development build.
- MVP scope is a single hostel/PG/campus community, not a city-wide network.

## 9. Out of Scope (Phase 2)

- Bulk-order splitting across multiple users
- "Going home" hometown item requests
- Community lost-and-found board
- Multi-campus / city-wide expansion
- Real remote push notifications (requires EAS dev build, not Expo Go)

## 10. Release Milestones

| Milestone | Scope |
|---|---|
| M1 | Auth, profile, errand posting & discovery (geofenced feed) |
| M2 | Accept flow, status lifecycle with timestamps, live location tracking |
| M3 | Camera proof upload, expense/reimbursement tracking |
| M4 | In-app chat |
| M5 | Karma/rating system, reporting, admin dashboard |
