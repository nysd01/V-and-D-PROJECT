# InternConnect — Kubernetes Setup & Deployment

## Prerequisites

Enable Kubernetes in Docker Desktop:
1. Open Docker Desktop
2. Settings → Kubernetes → Enable Kubernetes → Apply & Restart
3. Wait ~3 minutes for K8s to start
4. Verify: `kubectl get nodes` — should show one node "Ready"

---

## File Structure

```
k8s/
├── namespace.yaml          # internconnect namespace
├── configmap.yaml          # Non-sensitive environment variables
├── secret.yaml             # Sensitive keys (Supabase, JWT)
├── backend-deployment.yaml # Backend pods (2 replicas, rolling update)
├── backend-service.yaml    # Backend ClusterIP service
├── frontend-deployment.yaml# Frontend nginx pods (2 replicas)
├── frontend-service.yaml   # Frontend NodePort service (port 30080)
├── ingress.yaml            # Ingress routing rules
├── hpa.yaml                # Auto-scaling (CPU/Memory based)
└── deploy.sh               # One-command deploy script
```

---

## Deploy (Step by Step)

### Step 1 — Update the secret.yaml with real values

Open `k8s/secret.yaml` and fill in your actual keys:
```yaml
stringData:
  SUPABASE_URL: "https://fjtovibtkvupkwitwunj.supabase.co"
  SUPABASE_SERVICE_ROLE_KEY: "your-actual-key"
  JWT_SECRET: "your-actual-jwt-secret"
```

### Step 2 — Build Docker images

```bash
docker build -t v-and-d-project-backend:latest ./backend
docker build -t v-and-d-project-frontend:latest ./frontend/InternConnect
```

### Step 3 — Deploy everything

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/hpa.yaml
```

### Step 4 — Verify deployment

```bash
# See all resources
kubectl get all -n internconnect

# Watch pods start up
kubectl get pods -n internconnect -w

# Check backend logs
kubectl logs -n internconnect deployment/backend

# Check frontend logs  
kubectl logs -n internconnect deployment/frontend
```

### Step 5 — Access the app

```
Frontend:  http://localhost:30080
API:       http://localhost:30080/api/health
```

---

## Useful Commands (Screenshots for Report)

```bash
# Show all running pods
kubectl get pods -n internconnect

# Show all services
kubectl get services -n internconnect

# Show deployments
kubectl get deployments -n internconnect

# Show auto-scaling status
kubectl get hpa -n internconnect

# Describe a pod (detailed info)
kubectl describe pod -n internconnect -l app=backend

# Scale backend manually to 3 replicas
kubectl scale deployment backend -n internconnect --replicas=3

# Trigger rolling update (after rebuilding image)
kubectl rollout restart deployment/backend -n internconnect

# Watch rolling update progress
kubectl rollout status deployment/backend -n internconnect

# View rollout history
kubectl rollout history deployment/backend -n internconnect

# Delete everything (clean up)
kubectl delete namespace internconnect
```

---

## Architecture: How K8s Manages InternConnect

```
Internet
    │
    ▼
[NodePort :30080]
    │
    ├──► frontend-service ──► frontend Pod 1 (nginx)
    │                    ──► frontend Pod 2 (nginx)
    │
    └──► [/api/*] backend-service ──► backend Pod 1 (Node.js)
                                 ──► backend Pod 2 (Node.js)

HPA watches CPU/Memory:
  backend: min=2, max=10 pods @ 70% CPU
  frontend: min=2, max=5 pods @ 70% CPU
```

---

## Rolling Update Demo (for exam)

```bash
# 1. Rebuild backend image with a change
docker build -t v-and-d-project-backend:latest ./backend

# 2. Trigger rolling update
kubectl rollout restart deployment/backend -n internconnect

# 3. Watch it happen (screenshot this!)
kubectl rollout status deployment/backend -n internconnect

# 4. Verify new pods
kubectl get pods -n internconnect
```
