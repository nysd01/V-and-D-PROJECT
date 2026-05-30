#!/bin/bash
# InternConnect — Kubernetes Deployment Script
# Run from project root: bash k8s/deploy.sh

set -e

echo "============================================"
echo "  InternConnect Kubernetes Deployment"
echo "============================================"

# Step 1 — Build Docker images
echo ""
echo "[1/6] Building Docker images..."
docker build -t v-and-d-project-backend:latest ./backend
docker build -t v-and-d-project-frontend:latest ./frontend/InternConnect
echo "✓ Images built"

# Step 2 — Create namespace
echo ""
echo "[2/6] Creating namespace..."
kubectl apply -f k8s/namespace.yaml
echo "✓ Namespace created"

# Step 3 — Apply ConfigMap and Secret
echo ""
echo "[3/6] Applying configuration..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
echo "✓ Config and secrets applied"

# Step 4 — Deploy backend
echo ""
echo "[4/6] Deploying backend..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
echo "✓ Backend deployed"

# Step 5 — Deploy frontend
echo ""
echo "[5/6] Deploying frontend..."
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
echo "✓ Frontend deployed"

# Step 6 — Apply HPA (auto-scaling)
echo ""
echo "[6/6] Applying auto-scaling (HPA)..."
kubectl apply -f k8s/hpa.yaml
echo "✓ HPA applied"

# Show status
echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
kubectl get all -n internconnect
echo ""
echo "App available at: http://localhost:30080"
echo "API health:       http://localhost:30080/api/health"
