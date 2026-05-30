# Jenkins CI/CD Pipeline — InternConnect
## SEN3244 Software Architecture — Section 3 (10 Marks)

---

## Pipeline Overview

```
GitHub Push → Jenkins → Checkout → Install → Test → Build Images → Deploy K8s → Health Check
```

### Stages (10)

| # | Stage | What it does |
|---|-------|-------------|
| 1 | Checkout | Pull latest code from GitHub |
| 2 | Install Backend | npm ci for backend |
| 3 | Install Frontend | npm install for frontend |
| 4 | Test Backend | Run Jest unit + integration tests |
| 5 | Test Frontend | Run frontend component tests |
| 6 | Build Backend Image | docker build backend → tag with build number |
| 7 | Build Frontend Image | docker build frontend → tag with build number |
| 8 | Security Scan | Scan images for vulnerabilities |
| 9 | Deploy to K8s | Apply manifests + rolling update (main branch only) |
| 10 | Health Check | Verify /api/health returns 200 |

---

## Setup Instructions

### Step 1 — Start Jenkins in Docker

```bash
cd C:\Users\BC\Desktop\V-and-D-PROJECT
docker compose -f docker-compose.jenkins.yml up -d
```

Jenkins will be available at: **http://localhost:8080**

### Step 2 — Get initial admin password

```bash
docker exec internconnect-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Copy the password and paste it into `http://localhost:8080` when prompted.

### Step 3 — Install Jenkins plugins

When Jenkins asks to install plugins, click **"Install Suggested Plugins"** and also install:
- **Docker Pipeline**
- **Git**
- **GitHub Integration**
- **Blue Ocean** (optional — better UI)

### Step 4 — Install Docker inside Jenkins container

```bash
docker exec -u root internconnect-jenkins bash -c "
    apt-get update &&
    apt-get install -y docker.io kubectl &&
    chmod 666 /var/run/docker.sock
"
```

### Step 5 — Create Pipeline Job

1. Jenkins dashboard → **New Item**
2. Name: `InternConnect`
3. Type: **Pipeline** → OK
4. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/nysd01/V-and-D-PROJECT`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
5. Click **Save**

### Step 6 — Add GitHub Webhook (for auto-trigger)

1. Go to your GitHub repo → **Settings → Webhooks → Add webhook**
2. Payload URL: `http://YOUR-IP:8080/github-webhook/`
3. Content type: `application/json`
4. Events: **Just the push event**
5. Click **Add webhook**

### Step 7 — Run the pipeline

1. Jenkins dashboard → Click **InternConnect**
2. Click **Build Now**
3. Click the build number → **Console Output** to watch live

---

## Screenshots to Take for Report

Run these commands and screenshot the output:

```bash
# 1. Jenkins running in Docker
docker ps | grep jenkins

# 2. After pipeline runs
docker images | grep "v-and-d-project"
```

**In the Jenkins web UI — screenshot:**
- The pipeline dashboard showing all stages green ✅
- The "Stage View" (shows each stage as a column)
- The Console Output of a successful build
- The build history list

---

## Pipeline Flow Diagram

```
┌─────────────┐     webhook      ┌─────────────────────┐
│   GitHub    │ ─────────────►  │      Jenkins         │
│  (push to   │                 │   (localhost:8080)   │
│   main)     │                 └──────────┬──────────-┘
└─────────────┘                            │
                                           ▼
                              ┌────────────────────────┐
                              │   Stage 1: Checkout    │
                              └────────────┬───────────┘
                                           ▼
                              ┌────────────────────────┐
                              │  Stage 2-3: Install    │
                              └────────────┬───────────┘
                                           ▼
                              ┌────────────────────────┐
                              │  Stage 4-5: Test       │◄── Fails here? Pipeline stops
                              └────────────┬───────────┘
                                           ▼
                              ┌────────────────────────┐
                              │  Stage 6-7: Build      │
                              │  Docker Images         │
                              └────────────┬───────────┘
                                           ▼
                              ┌────────────────────────┐
                              │  Stage 8: Scan         │
                              └────────────┬───────────┘
                                           ▼
                              ┌────────────────────────┐
                              │  Stage 9: Deploy K8s   │◄── Only on main branch
                              └────────────┬───────────┘
                                           ▼
                              ┌────────────────────────┐
                              │  Stage 10: Health ✅   │
                              └────────────────────────┘
```

---

## Explanation of Pipeline Stages

### Stages 1-3: Source & Dependencies
Jenkins pulls the latest code from GitHub using SCM checkout. Dependencies for both backend (Node.js) and frontend (Expo/React Native) are installed separately since they have different dependency trees and package managers.

### Stages 4-5: Testing
Automated tests run against the backend (Jest + Supertest) and frontend (React Testing Library). If any test fails, the pipeline aborts immediately — no broken code reaches production. This enforces test-first quality gates.

### Stages 6-7: Docker Build
Both services are containerized as Docker images tagged with the Jenkins build number (`BUILD_NUMBER`) for traceability, plus a `latest` tag for convenience. Multi-stage builds keep final images small.

### Stage 8: Security Scan
Docker Scout scans the built images for known CVEs (Common Vulnerabilities and Exposures). The pipeline continues even if vulnerabilities are found (`--exit-code 0`), but the results are visible in the build log for developer awareness.

### Stage 9: Kubernetes Deploy (main branch only)
Kubernetes manifests are applied and the rolling update is triggered using `kubectl set image`. The pipeline waits for the rollout to complete before proceeding, ensuring the cluster is fully updated.

### Stage 10: Health Check
A curl request to `/api/health` verifies the deployed application responds correctly. If the API returns anything other than HTTP 200, the pipeline fails and the team is alerted.
