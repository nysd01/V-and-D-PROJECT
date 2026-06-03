# InternConnect

A cross-platform internship management platform connecting university students with hiring firms.
Built with React Native (Expo), Node.js, Supabase, Docker, Kubernetes, and Jenkins CI/CD.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Backend](#backend)
- [Frontend](#frontend)
- [Docker](#docker)
- [Kubernetes](#kubernetes)
- [Jenkins](#jenkins)
- [Testing](#testing)
- [Stress Testing](#stress-testing)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)

---

## Prerequisites

Install these before running the project:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 22+ | https://nodejs.org |
| npm | 10+ | Included with Node.js |
| Docker Desktop | Latest | https://docker.com |
| Git | Latest | https://git-scm.com |
| Expo Go (phone) | Latest | App Store / Play Store |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/nysd01/V-and-D-PROJECT.git
cd V-and-D-PROJECT

# 2. Start backend
cd backend
npm install
node server.js

# 3. Start frontend (new terminal)
cd frontend/InternConnect
npm install --legacy-peer-deps
npx expo start
```

---

## Backend

### Install dependencies
```bash
cd backend
npm install
```

### Start in development mode (auto-restart on file change)
```bash
cd backend
npm run dev
```

### Start in production mode
```bash
cd backend
npm start
```

### Run database migration (create tables)
```bash
cd backend
npm run migrate
```

### Check API is running
```bash
curl http://localhost:3000/api/health
```

---

## Frontend

### Install dependencies
```bash
cd frontend/InternConnect
npm install --legacy-peer-deps
```

### Start Expo development server
```bash
cd frontend/InternConnect
npx expo start
```

### Start on specific platform
```bash
# Android (opens emulator or shows QR for Expo Go)
npx expo start --android

# iOS simulator
npx expo start --ios

# Web browser
npx expo start --web

# With tunnel (access from any network)
npx expo start --tunnel
```

### Build web export (static files)
```bash
cd frontend/InternConnect
npx expo export --platform web --output-dir dist
```

### Clear Expo cache (if something breaks)
```bash
cd frontend/InternConnect
npx expo start --clear
```

---

## Docker

### Build images
```bash
# Build backend image
docker build -t v-and-d-project-backend:latest ./backend

# Build frontend image
docker build -t v-and-d-project-frontend:latest ./frontend/InternConnect
```

### Run with Docker Compose (backend + frontend together)
```bash
# Start all services
docker compose up -d

# Start and rebuild images
docker compose up -d --build

# Stop all services
docker compose down

# Stop and delete volumes
docker compose down -v

# View logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View frontend logs only
docker compose logs -f frontend
```

### Access running app via Docker
```
Frontend:  http://localhost:80
Backend:   http://localhost:3000/api/health
```

### Docker container management
```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Enter backend container shell
docker exec -it internconnect-backend sh

# Enter frontend container shell
docker exec -it internconnect-frontend sh

# View container logs
docker logs internconnect-backend
docker logs internconnect-frontend

# Stop a container
docker stop internconnect-backend

# Remove a container
docker rm internconnect-backend
```

### Docker image management
```bash
# List all images
docker images

# Remove an image
docker rmi v-and-d-project-backend:latest

# Remove all unused images
docker image prune -f

# Remove everything (containers, images, volumes, networks)
docker system prune -a
```

---

## Jenkins

### Start Jenkins
```bash
docker compose -f docker-compose.jenkins.yml up -d
```

### Stop Jenkins
```bash
docker compose -f docker-compose.jenkins.yml down
```

### Get initial admin password
```bash
docker exec internconnect-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### View Jenkins logs
```bash
docker logs -f internconnect-jenkins
```

### Access Jenkins
```
URL: http://localhost:8080
```

### Install tools inside Jenkins container (one-time setup)
```bash
# Install Node.js
docker exec -u root internconnect-jenkins bash -c "apt-get update && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs"

# Install Docker
docker exec -u root internconnect-jenkins bash -c "apt-get install -y docker.io && chmod 666 /var/run/docker.sock"
```

---

## Kubernetes

> Requires Kubernetes enabled in Docker Desktop: Settings → Kubernetes → Enable Kubernetes

### Deploy everything
```bash
# Apply all manifests in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/hpa.yaml

# Or use the deploy script
bash k8s/deploy.sh
```

### Check deployment status
```bash
# See all resources in the namespace
kubectl get all -n internconnect

# Watch pods start up
kubectl get pods -n internconnect -w

# Check deployments
kubectl get deployments -n internconnect

# Check services
kubectl get services -n internconnect

# Check auto-scaling status
kubectl get hpa -n internconnect
```

### View logs
```bash
# Backend pod logs
kubectl logs -n internconnect deployment/backend

# Frontend pod logs
kubectl logs -n internconnect deployment/frontend

# Follow logs in real time
kubectl logs -n internconnect deployment/backend -f
```

### Rolling update (after rebuilding image)
```bash
# Rebuild image
docker build -t v-and-d-project-backend:latest ./backend

# Trigger rolling update
kubectl rollout restart deployment/backend -n internconnect

# Watch the update progress
kubectl rollout status deployment/backend -n internconnect

# View rollout history
kubectl rollout history deployment/backend -n internconnect
```

### Scale manually
```bash
# Scale backend to 3 replicas
kubectl scale deployment backend -n internconnect --replicas=3

# Scale back down
kubectl scale deployment backend -n internconnect --replicas=2
```

### Access app via Kubernetes
```
Frontend:  http://localhost:30080
API:       http://localhost:30080/api/health
```

### Cleanup
```bash
# Delete everything in the namespace
kubectl delete namespace internconnect

# Delete specific resource
kubectl delete deployment backend -n internconnect
```

---

## Testing

### Run all backend tests
```bash
cd backend
npm test
```

### Run tests with verbose output
```bash
cd backend
npm test -- --verbose
```

### Run tests and watch for changes
```bash
cd backend
npm test -- --watch
```

### Run a specific test file
```bash
cd backend
npm test -- tests/auth.test.js
npm test -- tests/middleware.test.js
npm test -- tests/internships.test.js
npm test -- tests/validation.test.js
npm test -- tests/health.test.js
```

### Run tests with coverage report
```bash
cd backend
npm test -- --coverage
```

### Run frontend tests
```bash
cd frontend/InternConnect
npm test -- --passWithNoTests --watchAll=false
```

---

## Stress Testing

> Requires k6 installed: https://k6.io/docs/get-started/installation/

### Install k6 (Windows)
```powershell
winget install k6 --source winget
```

### Install k6 (Mac)
```bash
brew install k6
```

### Run stress test against local backend
```bash
k6 run stress-test/load-test.js
```

### Run against a specific API URL
```bash
k6 run -e API_URL=http://localhost:3000/api stress-test/load-test.js
```

### Run with custom users and duration
```bash
# 100 virtual users for 60 seconds
k6 run --vus 100 --duration 60s stress-test/load-test.js
```

### Run against deployed server
```bash
k6 run -e API_URL=https://your-deployment-url/api stress-test/load-test.js
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-long-random-secret
PORT=3000
```

### Frontend (`frontend/InternConnect/.env`)
```env
# Your local machine IP (find with: ipconfig on Windows, ifconfig on Mac)
EXPO_PUBLIC_API_URL=http://192.168.1.144:3000/api

# Google OAuth (from Google Cloud Console)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/google` | Login with Google OAuth | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PATCH | `/api/auth/me` | Update profile | Yes |
| POST | `/api/auth/forgot-password` | Request reset code | No |
| POST | `/api/auth/reset-password` | Reset password with code | No |

### Internships
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/internships` | Browse all active internships | No |
| GET | `/api/internships/mine` | Firm's own postings | Firm |
| GET | `/api/internships/:id` | Get single internship | No |
| POST | `/api/internships` | Create new posting | Firm |
| PATCH | `/api/internships/:id/status` | Open/close posting | Firm |
| DELETE | `/api/internships/:id` | Delete posting | Firm |

### Applications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/applications` | My applications (intern) | Intern |
| POST | `/api/applications` | Apply to internship | Intern |
| GET | `/api/applications/forPosting/:id` | Applicants for a posting | Firm |
| PATCH | `/api/applications/:id/status` | Accept/reject applicant | Firm |

### Saved Internships
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/saved` | Get saved internships | Intern |
| POST | `/api/saved` | Save an internship | Intern |
| DELETE | `/api/saved/:id` | Unsave an internship | Intern |

### Upload
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/document` | Upload CV/document | Yes |
| POST | `/api/upload/avatar` | Upload profile picture | Yes |

### Other
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |
| GET | `/api/notifications` | Get notifications | Intern |

---

## Project Structure

```
V-and-D-PROJECT/
├── backend/                        ← Node.js Express REST API
│   ├── routes/                     ← API route handlers
│   │   ├── auth.js                 ← Authentication routes
│   │   ├── internships.js          ← Internship CRUD
│   │   ├── applications.js         ← Application management
│   │   ├── saved.js                ← Saved internships
│   │   ├── notifications.js        ← Notifications
│   │   └── upload.js              ← File upload to Supabase
│   ├── middleware/
│   │   └── auth.js                 ← JWT verification middleware
│   ├── tests/                      ← Jest test suites (61 tests)
│   ├── db.js                       ← Supabase client
│   ├── server.js                   ← Express app entry point
│   ├── migrate.js                  ← Database schema migration
│   ├── Dockerfile                  ← Backend container
│   └── .env                        ← Environment variables
├── frontend/InternConnect/         ← React Native / Expo app
│   ├── app/                        ← Screens (Expo Router)
│   │   ├── (tabs)/                 ← Intern tab screens
│   │   ├── (firm)/                 ← Firm tab screens
│   │   ├── login.tsx               ← Login screen
│   │   ├── register.tsx            ← Registration screen
│   │   └── forgot_password.tsx     ← Password reset screen
│   ├── components/                 ← Reusable UI components
│   ├── context/
│   │   └── AuthContext.tsx         ← Global authentication state
│   ├── services/
│   │   └── api.ts                  ← All API service functions
│   ├── constants/                  ← Theme, colors
│   ├── Dockerfile                  ← Multi-stage build (Expo → nginx)
│   ├── nginx.conf                  ← nginx configuration
│   └── .env                        ← Frontend environment variables
├── k8s/                            ← Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   └── deploy.sh
├── docs/                           ← Documentation
│   ├── ARCHITECTURE.md             ← System architecture (20 marks)
│   ├── JENKINS_SETUP.md            ← Jenkins setup guide
│   └── UML_DIAGRAMS.md             ← 7 PlantUML diagrams
├── stress-test/
│   └── load-test.js                ← k6 stress test script
├── Jenkinsfile                     ← CI/CD pipeline (10 stages)
├── docker-compose.yml              ← Local Docker orchestration
├── docker-compose.jenkins.yml      ← Jenkins container
└── README.md                       ← This file
```

---

## Built With

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) — Cross-platform mobile/web
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) — REST API
- [Supabase](https://supabase.com/) — PostgreSQL database + file storage
- [Docker](https://docker.com/) — Containerization
- [Kubernetes](https://kubernetes.io/) — Container orchestration
- [Jenkins](https://jenkins.io/) — CI/CD automation
- [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest) — Testing
- [k6](https://k6.io/) — Load/stress testing

---

## Team

- **Noumbissi Yamdjeuson Stanley Derek** — Full Stack Developer
- SEN3244 Software Architecture — 2025/2026
