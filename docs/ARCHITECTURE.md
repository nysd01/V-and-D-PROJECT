# InternConnect — Software Architecture Document
**Course:** SEN3244 — Software Architecture  
**Project:** InternConnect — Internship Management Platform  
**Date:** May 2026

---

## 1. System Overview

InternConnect is a cross-platform internship management platform that connects university interns with hiring firms. The system allows interns to discover, apply for, and track internship opportunities, while firms can post positions, manage applicants, schedule interviews, and update application statuses in real time.

**Platform support:** Android, iOS, and Web (via single codebase)  
**Users:** Two roles — Interns and Firms  
**Scale target:** Hundreds of concurrent users, thousands of internship records

---

## 2. Architecture Style Chosen

### 2.1 Primary Style: Layered Architecture (N-Tier)

InternConnect adopts a **3-Tier Layered Architecture** combined with a **Client-Server** communication pattern over REST.

```
┌─────────────────────────────────────┐
│         PRESENTATION LAYER          │  ← React Native / Expo (Mobile + Web)
│   (UI Components, Navigation, UX)  │
├─────────────────────────────────────┤
│          BUSINESS LOGIC LAYER       │  ← Node.js / Express API Server
│   (Auth, Rules, Validation, CRUD)  │
├─────────────────────────────────────┤
│            DATA LAYER               │  ← Supabase (PostgreSQL + Storage)
│   (Database, File Storage, Auth)   │
└─────────────────────────────────────┘
```

### 2.2 Why Layered Architecture?

| Reason | Explanation |
|--------|-------------|
| **Separation of Concerns** | UI changes do not affect business logic; database changes do not affect the frontend |
| **Maintainability** | Each layer can be modified, tested, or replaced independently |
| **Team Productivity** | Frontend and backend teams can work in parallel |
| **Security** | Business logic and database credentials are never exposed to the client |
| **Testability** | Each layer can be unit-tested in isolation |

### 2.3 Secondary Pattern: REST API (Client-Server)

The Presentation Layer communicates with the Business Logic Layer exclusively through a **RESTful HTTP API**. This enforces:
- Stateless communication (each request carries a JWT token)
- Clear contract between frontend and backend
- Easy to add new clients (mobile, web, third-party) without backend changes

---

## 3. Architectural Structures

### 3.1 Module View (What the system is made of)

```
InternConnect System
│
├── Frontend Module (React Native + Expo)
│   ├── Authentication Module
│   │   ├── LoginScreen
│   │   ├── RegisterScreen
│   │   └── ForgotPasswordScreen
│   ├── Intern Module
│   │   ├── DashboardScreen
│   │   ├── BrowseScreen
│   │   ├── MyApplicationsScreen
│   │   ├── NotificationsScreen
│   │   └── ProfileScreen
│   ├── Firm Module
│   │   ├── FirmDashboardScreen
│   │   ├── FirmPostingsScreen
│   │   ├── FirmApplicantsScreen
│   │   └── FirmProfileScreen
│   ├── Shared Module
│   │   ├── AuthContext (State Management)
│   │   ├── API Service Layer
│   │   └── UI Components (Suit360, Cards)
│   └── Navigation Module (Expo Router)
│
├── Backend Module (Node.js + Express)
│   ├── Authentication Routes (/api/auth)
│   │   ├── Register
│   │   ├── Login
│   │   ├── Google OAuth
│   │   ├── Forgot/Reset Password
│   │   └── Get/Update Profile
│   ├── Internship Routes (/api/internships)
│   │   ├── List with Search & Filter
│   │   ├── Create Posting
│   │   ├── Update Status
│   │   └── Delete Posting
│   ├── Application Routes (/api/applications)
│   │   ├── Submit Application
│   │   ├── View Applications
│   │   ├── Update Status + Interview Time
│   │   └── Withdraw Application
│   ├── Notification Routes (/api/notifications)
│   ├── Upload Routes (/api/upload)
│   │   ├── Document Upload (CV/Portfolio)
│   │   └── Avatar Upload
│   ├── Saved Routes (/api/saved)
│   └── Middleware
│       └── JWT Authentication Guard
│
└── Data Module (Supabase)
    ├── PostgreSQL Database
    │   ├── users table
    │   ├── internships table
    │   ├── applications table
    │   └── saved_internships table
    └── Object Storage
        ├── documents/ (CV, portfolios)
        └── avatars/ (profile pictures)
```

---

### 3.2 Component View (How components interact)

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Browser / Mobile App)          │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐  ┌──────────────┐  │
│  │  Auth       │    │  Intern      │  │  Firm        │  │
│  │  Screens    │    │  Screens     │  │  Screens     │  │
│  └──────┬──────┘    └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│                    ┌───────▼───────┐                     │
│                    │  API Service  │ (services/api.ts)   │
│                    │  + AuthContext│                     │
│                    └───────┬───────┘                     │
└────────────────────────────┼────────────────────────────┘
                             │ HTTPS / REST
                             │ JWT Bearer Token
┌────────────────────────────▼────────────────────────────┐
│                    BACKEND (Express API)                  │
│                                                          │
│  ┌──────────┐ ┌──────────────┐ ┌────────────────────┐   │
│  │  /auth   │ │/internships  │ │   /applications    │   │
│  │  Routes  │ │   Routes     │ │      Routes        │   │
│  └────┬─────┘ └──────┬───────┘ └─────────┬──────────┘   │
│       │              │                   │               │
│  ┌────▼──────────────▼───────────────────▼──────────┐    │
│  │             JWT Auth Middleware                   │    │
│  └────────────────────────────────────────┬──────────┘    │
│                                           │               │
│  ┌──────────────┐  ┌─────────────────────▼──────────┐    │
│  │ /upload      │  │      Supabase JS Client         │    │
│  │ Routes       │  │      (db.js)                   │    │
│  │ (multer)     │  └────────────────────────────────┘    │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
                             │
                             │ Supabase REST API
┌────────────────────────────▼────────────────────────────┐
│                    DATA LAYER (Supabase)                  │
│                                                          │
│  ┌─────────────────────┐    ┌──────────────────────┐    │
│  │  PostgreSQL Database │    │   Object Storage     │    │
│  │  ─────────────────  │    │   ──────────────     │    │
│  │  users              │    │   avatars/           │    │
│  │  internships        │    │   documents/         │    │
│  │  applications       │    │                      │    │
│  │  saved_internships  │    │                      │    │
│  └─────────────────────┘    └──────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

### 3.3 Deployment View (Where components run)

```
┌─────────────────────────────────────────────────────────┐
│                   USER DEVICES                           │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Android     │  │    iOS       │  │   Web        │  │
│  │  Device      │  │   Device     │  │   Browser    │  │
│  │  (Expo Go)   │  │  (Expo Go)   │  │  (Chrome)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼─────────────────┼─────────────────┼───────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │ HTTP / HTTPS
┌───────────────────────────▼─────────────────────────────┐
│              HOST MACHINE / VPS (Docker)                 │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Docker Network (bridge)              │   │
│  │                                                  │   │
│  │  ┌─────────────────────┐  Port 80                │   │
│  │  │  internconnect-     ├──────────────────────►  │   │
│  │  │  frontend           │  nginx serves            │   │
│  │  │  (nginx:alpine)     │  Expo web build          │   │
│  │  └──────────┬──────────┘                          │   │
│  │             │ proxy /api → backend:3000           │   │
│  │  ┌──────────▼──────────┐  Port 3000               │   │
│  │  │  internconnect-     ├──────────────────────►  │   │
│  │  │  backend            │  Express REST API        │   │
│  │  │  (node:22-alpine)   │                          │   │
│  │  └─────────────────────┘                          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│                   SUPABASE CLOUD                         │
│                                                         │
│  ┌────────────────────┐   ┌──────────────────────────┐  │
│  │  PostgreSQL DB     │   │   Object Storage         │  │
│  │  (Managed Cloud)   │   │   (internconnect bucket) │  │
│  └────────────────────┘   └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

### 3.4 Database Schema (Entity-Relationship View)

```
USERS
─────
id (PK) │ email │ password_hash │ name │ type (intern/firm)
profile_picture │ university │ company_name │ industry
address │ reset_token │ reset_token_expires │ created_at
         │                    │
         │ (firm_id FK)       │ (intern_id FK)
         ▼                    ▼
INTERNSHIPS              APPLICATIONS
───────────              ────────────
id (PK)                  id (PK)
firm_id (FK→users)       intern_id (FK→users)
title                    internship_id (FK→internships)
category                 cover_letter
description              document_url
requirements             interview_scheduled_at
location                 status (Pending/Interviewing/
work_type                        Accepted/Rejected)
is_paid                  applied_at
status (active/closed)   UNIQUE(intern_id, internship_id)
posted_on
         │
         │ (internship_id FK)
         ▼
SAVED_INTERNSHIPS
────────────────
id (PK)
intern_id (FK→users)
internship_id (FK→internships)
saved_at
UNIQUE(intern_id, internship_id)
```

---

## 4. Key Architectural Decisions

### 4.1 JWT Stateless Authentication

**Decision:** Use JSON Web Tokens (JWT) instead of server-side sessions.

**Justification:**
- Enables horizontal scaling — any server instance can verify any token
- No session store required (reduces infrastructure complexity)
- Tokens carry user ID and type, enabling role-based access control
- 7-day expiry balances security and user convenience

**Implementation:**
```
Client                    Server
  │                          │
  │── POST /api/auth/login ──►│
  │                          │ Verify email/password (bcrypt)
  │◄── { token, user } ──────│ Sign JWT with user.id + user.type
  │                          │
  │── GET /api/internships ──►│ Authorization: Bearer <token>
  │  + Authorization header  │ Middleware verifies JWT
  │◄── internships[] ─────────│ Returns data
```

### 4.2 Supabase as Backend-as-a-Service

**Decision:** Use Supabase (hosted PostgreSQL) instead of self-managed database.

**Justification:**
- Eliminates database server management overhead
- Built-in Object Storage for files (CVs, avatars)
- Row-Level Security available for future use
- Auto-generated REST API used via the Supabase JS client
- Free tier sufficient for academic/demo scale

### 4.3 Expo Router for Cross-Platform Navigation

**Decision:** Use Expo Router (file-based routing) for both mobile and web navigation.

**Justification:**
- Single codebase serves Android, iOS, and Web
- File structure defines routes automatically
- Deep linking supported out of the box
- Static web export enables Docker deployment

### 4.4 Role-Based Access Control (RBAC)

**Decision:** Enforce user type checks at API middleware level.

**Implementation:**
- Every protected route uses `requireAuth` middleware
- Routes further check `req.user.type === 'intern'` or `'firm'`
- Frontend routes are grouped: `(tabs)/` for interns, `(firm)/` for firms

---

## 5. Quality Attributes

### 5.1 Performance

| Concern | Solution |
|---------|----------|
| Slow API responses | Supabase indexed queries; JOIN queries return all needed data in one request |
| Large file uploads | Base64 encoding → backend → Supabase Storage (async, non-blocking) |
| Redundant API calls | Debounced search (300ms delay), local optimistic UI updates |
| Mobile rendering | React Native native components — no WebView overhead |

**Target:** API response time < 500ms for all endpoints under normal load.

### 5.2 Scalability

| Concern | Solution |
|---------|----------|
| Multiple server instances | Stateless JWT — any instance handles any request |
| Database load | Supabase managed PostgreSQL with connection pooling |
| File storage | Supabase Object Storage — independent of app servers |
| Horizontal scaling | Docker containers → Kubernetes deployment enables auto-scaling |

**Target:** System designed to scale from 10 to 10,000 users by adding container replicas.

### 5.3 Security

| Threat | Mitigation |
|--------|-----------|
| Unauthorized API access | JWT required on all protected routes |
| Password exposure | bcrypt hashing (cost factor 10) — passwords never stored in plain text |
| SQL injection | Supabase parameterized queries — no raw SQL from user input |
| Secrets exposure | Environment variables (`.env`) excluded from Docker image via `.dockerignore` |
| CORS attacks | Explicit CORS configuration on Express server |
| File upload abuse | 10MB size limit; files stored in private Supabase bucket |

### 5.4 Availability

| Concern | Solution |
|---------|----------|
| Container failure | Docker `restart: unless-stopped` policy |
| Health monitoring | `GET /api/health` endpoint with Docker healthcheck |
| Dependency failure | Graceful error states on all screens with retry buttons |
| Offline resilience | JWT stored in AsyncStorage — session survives app restart |

### 5.5 Maintainability

| Concern | Solution |
|---------|----------|
| Code organization | Clear layer separation (frontend/backend/shared) |
| API consistency | Single `api.ts` service file — all endpoints in one place |
| Type safety | TypeScript throughout frontend; typed API interfaces |
| Documentation | Inline comments, README, Swagger docs |

---

## 6. Pros and Cons of Chosen Architecture

### Pros

| # | Advantage | Detail |
|---|-----------|--------|
| 1 | **Clear separation** | UI, business logic, and data are independently developed and tested |
| 2 | **Cross-platform** | One codebase for Android, iOS, and Web reduces development effort by ~60% |
| 3 | **Scalable** | Stateless REST + Docker containers → easy to add replicas |
| 4 | **Rapid development** | Supabase eliminates database server setup; Expo eliminates native build config |
| 5 | **Security** | JWT + bcrypt + parameterized queries covers major OWASP Top 10 risks |
| 6 | **Developer experience** | TypeScript types shared across layers; hot reload during development |

### Cons

| # | Disadvantage | Detail |
|---|-------------|--------|
| 1 | **Vendor lock-in** | Heavy dependency on Supabase; migrating database requires significant refactoring |
| 2 | **Latency overhead** | Every action requires at minimum 2 hops (Client → API → Supabase) |
| 3 | **No real-time push** | Notifications are pull-based (user must refresh); no WebSocket push notifications |
| 4 | **Mobile performance** | React Native bridge adds overhead vs fully native apps for heavy 3D rendering |
| 5 | **Monolithic backend** | All routes in one Express server; high traffic on one route affects all others |
| 6 | **Session not invalidatable** | JWT tokens cannot be revoked before expiry without a token blacklist |

### Trade-offs Summary

```
Developer Speed  ←──────────────────────→  Fine-grained Control
     [Supabase BaaS]                        [Custom PostgreSQL]
        ▲ We chose this for academic timeline

Single Codebase  ←──────────────────────→  Native Performance
    [React Native]                          [Swift / Kotlin]
        ▲ We chose this for cross-platform reach

Simplicity       ←──────────────────────→  Real-time Capability
  [REST + Pull]                             [WebSockets + Push]
        ▲ We chose this for implementation simplicity
```

---

## 7. Architecture Design Process

### Step 1 — Requirements Analysis
Identified functional requirements: user registration, internship posting/browsing, application management, notifications, file uploads. Identified non-functional requirements: cross-platform, secure, maintainable, deployable via Docker.

### Step 2 — Architecture Drivers
Key drivers: cross-platform reach (Android + iOS + Web), small team (rapid development priority), cloud-hosted database (no self-managed servers), Docker containerization for exam deliverable.

### Step 3 — Style Selection
Evaluated Microservices (too complex for team size), Event-Driven (overkill for current notification needs), Layered (fits team size, requirements, and skillset). Selected **Layered + REST**.

### Step 4 — Component Identification
Identified 6 backend route groups, 4 frontend screen groups, 4 database tables, 2 storage paths.

### Step 5 — Interface Design
Defined REST API contract: all endpoints return JSON, authentication via Bearer JWT, errors return `{ error: string }` with appropriate HTTP status codes.

### Step 6 — Quality Attribute Scenarios
Addressed performance (indexed DB queries), security (JWT + bcrypt), scalability (stateless design + Docker), availability (health checks + restart policies).

### Step 7 — Containerization
Packaged backend and frontend as Docker images; orchestrated with docker-compose; prepared Kubernetes manifests for production scaling.

---

## 8. Technology Stack Summary

| Component | Technology | Version | Role |
|-----------|-----------|---------|------|
| Frontend | React Native + Expo | SDK 54 | Cross-platform UI |
| Navigation | Expo Router | 6.x | File-based routing |
| Backend | Node.js + Express | 22 / 4.x | REST API server |
| Database | PostgreSQL (Supabase) | 15 | Relational data store |
| File Storage | Supabase Storage | — | CV and avatar files |
| Authentication | JWT + bcrypt | — | Stateless auth |
| OAuth | Google OAuth 2.0 | — | Social login |
| Containerization | Docker + nginx | 29.x | Deployment packaging |
| Orchestration | Kubernetes | 1.29 | Production scaling |
| CI/CD | Jenkins | 2.x | Automated pipeline |
| Monitoring | Prometheus + Grafana | — | Metrics and alerting |
| IaC | Ansible | 2.x | Infrastructure automation |
| Language | TypeScript (FE) / JS (BE) | 5.9 / ES2022 | Type safety |
