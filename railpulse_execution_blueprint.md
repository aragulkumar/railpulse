# RailPulse — Complete App Structure & Execution Blueprint
### Dynamic ETA + Passenger Services Platform (SIH 2026 Prototype)

---

## 0. How to Use This Document

This is the single execution reference for building RailPulse. Follow it top to
bottom: architecture → repo structure → tech stack → database schema → API
contract → build order. Hand this file to any teammate or AI coding agent and
they should be able to start scaffolding without asking clarifying questions.

---

## 1. Final Architecture (Collapsed Stack)

```
┌───────────────────────────────────────────────────────────────────┐
│                        CLIENT — React Native                       │
│      ETA | Booking | Complaints | AI Chat | Notifications | Profile │
└──────────────────────────────┬──────────────────────────────────────┘
                                │ REST + WebSocket
┌──────────────────────────────▼──────────────────────────────────────┐
│                    FASTAPI MONOLITH (single service)                 │
│  ┌───────────┬───────────┬──────────────┬───────────┬─────────────┐ │
│  │ ETA        │ Booking   │ Complaints    │ Chatbot   │ Notification│ │
│  │ Router     │ Router    │ Router        │ Router    │ Router      │ │
│  └───────────┴───────────┴──────────────┴───────────┴─────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Layer 1–4 Engine: Sensing → Estimation (Physics+XGBoost) →      │ │
│  │ Propagation → Delivery (in-process Python module, not a         │ │
│  │ separate microservice)                                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
└───────┬───────────────────────┬───────────────────────┬─────────────┘
        │                       │                       │
┌───────▼────────┐   ┌──────────▼──────────┐   ┌────────▼──────────┐
│ PostgreSQL +    │   │ Redis               │   │ Celery Workers     │
│ TimescaleDB     │   │ (Cache + PubSub +   │   │ (background: SOS   │
│ (PNR, complaints,│  │  Streams + Celery   │   │ routing, notif      │
│  ETA history)    │  │  broker)            │   │  fan-out, ML batch) │
└─────────────────┘   └─────────────────────┘   └────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │ Firebase Cloud Messaging│
                    │ (push notifications)   │
                    └────────────────────────┘
```

**Why one FastAPI service instead of Node+Python split:**
- ETA engine (XGBoost + physics) is Python-native — no serialization hop needed.
- One deploy target, one Dockerfile, one log stream for a hackathon timeline.
- FastAPI's native `async`/WebSocket support handles live ETA push without a
  separate Node layer.

---

## 2. Repository Structure

```
railpulse/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app entrypoint, router mounting
│   │   ├── config.py                   # env vars, settings (pydantic-settings)
│   │   ├── deps.py                     # shared dependencies (DB session, auth)
│   │   │
│   │   ├── core/
│   │   │   ├── security.py             # JWT auth, password hashing
│   │   │   ├── websocket_manager.py    # connection registry for live ETA push
│   │   │   └── redis_client.py         # Redis connection (cache/pubsub/streams)
│   │   │
│   │   ├── eta_engine/                 # LAYERS 1–4 (existing ETA architecture)
│   │   │   ├── sensing.py              # RTIS/COA/tachometer/track sensor ingest
│   │   │   ├── estimation.py           # Physics model + XGBoost blend
│   │   │   ├── propagation.py          # Network delay propagation logic
│   │   │   ├── delivery.py             # Final ETA + explainability string builder
│   │   │   └── models/                 # trained XGBoost model artifacts (.pkl)
│   │   │
│   │   ├── routers/                    # LAYER 5 — app/service routes
│   │   │   ├── eta.py                  # /eta/station, /eta/train/{train_no}
│   │   │   ├── booking.py              # /booking/search, /book, /pnr/{id}
│   │   │   ├── complaints.py           # /complaints/sos, /cleaning, /swap, /general
│   │   │   ├── chatbot.py              # /chat/message (LLM intent router)
│   │   │   ├── notifications.py        # /notifications, /notifications/{id}/read
│   │   │   ├── profile.py              # /profile, /profile/language
│   │   │   └── auth.py                 # /auth/login, /auth/register
│   │   │
│   │   ├── models/                     # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── pnr.py
│   │   │   ├── complaint.py
│   │   │   ├── eta_snapshot.py         # Timescale hypertable
│   │   │   └── notification.py
│   │   │
│   │   ├── schemas/                    # Pydantic request/response schemas
│   │   │   ├── eta.py
│   │   │   ├── booking.py
│   │   │   ├── complaint.py
│   │   │   └── chat.py
│   │   │
│   │   ├── services/                   # business logic, called by routers
│   │   │   ├── eta_service.py
│   │   │   ├── booking_service.py
│   │   │   ├── complaint_service.py
│   │   │   ├── chatbot_service.py      # LLM call + function-routing to other services
│   │   │   └── notification_service.py
│   │   │
│   │   ├── tasks/                      # Celery background tasks
│   │   │   ├── celery_app.py
│   │   │   ├── sos_routing.py          # push SOS to RPF/Control Office
│   │   │   ├── notification_fanout.py
│   │   │   └── eta_recompute.py        # periodic re-estimation job
│   │   │
│   │   └── db/
│   │       ├── session.py
│   │       └── migrations/             # Alembic
│   │
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic.ini
│
├── mobile/                             # React Native app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── ETA/
│   │   │   │   ├── StationETAScreen.tsx
│   │   │   │   └── TrainETAScreen.tsx
│   │   │   ├── Booking/
│   │   │   │   ├── SearchScreen.tsx
│   │   │   │   ├── SeatSelectScreen.tsx
│   │   │   │   ├── PaymentScreen.tsx
│   │   │   │   └── PNRConfirmationScreen.tsx
│   │   │   ├── Complaints/
│   │   │   │   ├── ComplaintsHomeScreen.tsx
│   │   │   │   ├── SOSScreen.tsx
│   │   │   │   ├── CleaningRequestScreen.tsx
│   │   │   │   ├── SeatSwapScreen.tsx
│   │   │   │   └── GeneralComplaintScreen.tsx
│   │   │   ├── Chat/
│   │   │   │   └── ChatScreen.tsx
│   │   │   ├── Notifications/
│   │   │   │   └── NotificationsScreen.tsx
│   │   │   └── Profile/
│   │   │       └── ProfileScreen.tsx
│   │   │
│   │   ├── components/                 # shared UI (ETA card, status badge, etc.)
│   │   ├── navigation/                 # bottom tab + stack navigators
│   │   ├── api/                        # axios client + WebSocket hook
│   │   ├── theme/                      # colors, typography (see Section 5)
│   │   ├── store/                      # Zustand or Redux state
│   │   └── i18n/                       # multilingual strings (Hindi/Tamil/etc.)
│   ├── App.tsx
│   └── package.json
│
├── docker-compose.yml                  # postgres, redis, backend, celery worker
└── README.md
```

---

## 3. Tech Stack (Final)

| Layer | Choice | Notes |
|---|---|---|
| Mobile app | **React Native** | Single codebase, Android/iOS |
| Backend | **FastAPI** (single monolith) | Async, same language as ML engine |
| Realtime push | **FastAPI WebSockets** + **Redis Pub/Sub** | No polling; ETA updates broadcast on change |
| Delay propagation | **Redis Streams** | Ordered, replayable — skip Kafka for prototype scope |
| Background jobs | **Celery** + Redis broker | SOS routing, notification fan-out, periodic ETA recompute |
| Database | **PostgreSQL + TimescaleDB extension** | Timescale hypertable for ETA time-series, plain Postgres tables for PNR/complaints/users |
| Cache | **Redis** (separate DB index from broker) | Confidence-band ETA cache, session cache |
| ORM / migrations | **SQLAlchemy 2.0 + Alembic** | |
| Auth | **JWT** (FastAPI + python-jose) | |
| ETA model | **XGBoost (per-section) + physics module**, blended in `estimation.py` | Existing Layer 1–4 logic ported in as an internal package, not an external call |
| Chatbot | **LLM API (Claude/Anthropic)** behind `/chat/message`, function-calling into booking/complaint/ETA services | No separate chatbot microservice |
| Push notifications | **Firebase Cloud Messaging** | |
| Containerization | **Docker + docker-compose** (Postgres, Redis, backend, Celery worker, Celery beat) | |
| Deployment target (prototype) | Single VPS (e.g. Hetzner) or Railway/Render for demo | |

---

## 4. Database Schema (Core Tables)

```sql
-- users
users (id, name, phone, email, password_hash, preferred_language, created_at)

-- pnr (anchor object — everything else attaches here)
pnr (id, user_id FK, train_no, coach, berth, quota, status, journey_date, created_at)

-- eta_snapshot (Timescale hypertable — time-series)
eta_snapshot (time, train_no, station_code, estimated_eta, confidence_low,
              confidence_high, explainability_text, status)  -- hypertable on `time`

-- complaints (umbrella table, type discriminates sub-flow)
complaints (id, pnr_id FK, user_id FK, type ENUM[sos, cleaning, seat_swap, general],
            coach, berth, gps_lat, gps_lng, nearest_station, description,
            status ENUM[filed, acknowledged, resolved], created_at, resolved_at)

-- seat_swap_requests (extends complaints for type=seat_swap)
seat_swap_requests (id, complaint_id FK, requester_pnr_id FK, target_pnr_id FK,
                     status ENUM[pending, accepted, declined, tte_approved], created_at)

-- notifications
notifications (id, user_id FK, type, title, body, deep_link, is_read, created_at)

-- chat_sessions / chat_messages
chat_sessions (id, user_id FK, language, started_at)
chat_messages (id, session_id FK, role ENUM[user, assistant], content, created_at)
```

---

## 5. App Theme (unchanged from model)

| Role | Hex | Use |
|---|---|---|
| Primary — Deep Navy | `#102A43` | App bar, nav, primary buttons |
| Highlight — Saffron | `#F59E0B` | Active tab, CTAs, ETA accents |
| Background — Off-white | `#F8FAFC` | Page background |
| Success — Green | `#16A34A` | On-time, resolved, confirmed |
| Alert — Red | `#DC2626` | SOS, delays, cancellations |

---

## 6. API Contract (Prototype Scope)

```
Auth
  POST   /auth/register
  POST   /auth/login

ETA
  GET    /eta/station/{station_code}          → list of trains + ETA + explainability
  GET    /eta/train/{train_no}                → single train live view
  WS     /ws/eta/{train_no}                    → live push updates

Booking
  GET    /booking/search?from=&to=&date=&class=
  POST   /booking/book                         → creates PNR
  GET    /booking/pnr/{pnr_id}
  POST   /booking/cancel/{pnr_id}

Complaints
  POST   /complaints/sos
  POST   /complaints/cleaning
  POST   /complaints/swap/request
  POST   /complaints/swap/{id}/respond
  POST   /complaints/general
  GET    /complaints/{id}/status

Chatbot
  POST   /chat/message                         → { session_id, text, language }

Notifications
  GET    /notifications
  POST   /notifications/{id}/read

Profile
  GET    /profile
  PATCH  /profile/language
```

---

## 7. Build Order (Execution Roadmap)

1. **Scaffold backend** — FastAPI app, Docker Compose (Postgres+Timescale, Redis),
   Alembic migration for `users`, `pnr`, `eta_snapshot`.
2. **ETA module (mock data first)** — port Layers 1–4 as `eta_engine/` package,
   wire `/eta/station` and `/eta/train/{train_no}` with mock/sample data +
   explainability strings. This is the demo hook — get it working first.
3. **Booking** — search + mock payment → creates PNR row. This unlocks every
   downstream module (complaints, swap all key off PNR).
4. **WebSocket live push** — Redis Pub/Sub channel per train, FastAPI WS
   endpoint subscribes and forwards to connected clients.
5. **Notifications** — basic feed table + endpoint, tied to booking/complaint
   status changes via Celery task.
6. **Chatbot** — `/chat/message` → LLM call with function-calling schema for
   `check_pnr`, `get_eta`, `file_complaint`, `search_trains`.
7. **Complaints — SOS + General** — simplest form-based flow, GPS/PNR auto-tag,
   Celery task pushes to Control Office queue.
8. **Complaints — Cleaning Request** — reuse General Complaint form UI.
9. **Complaints — Seat/Berth Swap** — most complex (two-party + TTE approval),
   build last.
10. **Profile** — language settings, saved passengers, trip history.
11. **Mobile app wiring** — connect all screens to the above endpoints, add
    bottom nav + top bar (greeting, bell, profile icon per screen map).
12. **Polish for demo** — seed realistic mock train/station data, record 2–3
    scripted user flows (delay alert → complaint, chatbot booking, SOS).

---

## 8. Local Dev Quickstart

```bash
# backend
cd railpulse/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
docker compose up -d postgres redis
alembic upgrade head
uvicorn app.main:app --reload

# celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info

# mobile
cd railpulse/mobile
npm install
npx react-native run-android   # or run-ios
```

`requirements.txt` core packages:
```
fastapi
uvicorn[standard]
sqlalchemy>=2.0
alembic
psycopg2-binary
redis
celery
python-jose[cryptography]
passlib[bcrypt]
pydantic-settings
xgboost
anthropic
websockets
```

---

*This blueprint reuses the Layer 1–4 Dynamic ETA architecture as an in-process
Python package inside a single FastAPI monolith, replacing the original
Node+FastAPI split for a lower-overhead, single-runtime SIH prototype build.*
