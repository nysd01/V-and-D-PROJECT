# Grafana Monitoring Setup — InternConnect

Complete monitoring stack with Prometheus, Grafana, and Node Exporter for real-time performance tracking.

---

## Architecture

```
Backend API (Port 7000)
    ├─► /metrics endpoint ────► Prometheus (Port 9090)
    │                              │
    │                              └─► Grafana (Port 3000) ◄─ Your Dashboard
    │
Node Exporter (Port 9100) ────────────────┘
    ├─ CPU, Memory, Disk
    ├─ Network I/O
    └─ Process info
```

---

## Quick Start (Local)

### 1. Start the monitoring stack

```bash
cd C:\Users\BC\Desktop\V-and-D-PROJECT
docker-compose up -d
```

This starts:
- Backend API: `http://localhost:7000`
- Frontend: `http://localhost:4910`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000`
- Node Exporter: `http://localhost:9100`

### 2. Access Grafana Dashboard

Open **[http://localhost:3000](http://localhost:3000)** in your browser

**Login:**
- Username: `admin`
- Password: `admin`

### 3. Add Prometheus as Data Source

1. Click ⚙️ Settings (bottom left) → Data Sources
2. Click "Add data source"
3. Select **Prometheus**
4. URL: `http://prometheus:9090`
5. Click "Save & test" → Should show "Data source is working"

### 4. Import Pre-built Dashboards

#### Option A: Create from Scratch
1. Click **+** (top left) → New Dashboard
2. Click "Add Panel"
3. Select metrics like:
   - `http_requests_total` — Total requests
   - `http_request_duration_seconds` — Response time
   - `node_cpu_seconds_total` — CPU usage
   - `node_memory_MemFree_bytes` — Available memory

#### Option B: Import Popular Dashboards
1. Click **+** (top left) → Import
2. Enter ID: `1860` (Node Exporter dashboard)
3. Select Prometheus as datasource
4. Click "Import"

---

## Endpoints

| Service | URL | Port |
|---------|-----|------|
| Backend API | http://localhost:7000 | 7000 |
| API Metrics | http://localhost:7000/metrics | 7000 |
| Prometheus | http://localhost:9090 | 9090 |
| Grafana | http://localhost:3000 | 3000 |
| Node Exporter | http://localhost:9100 | 9100 |

---

## Useful Queries (PromQL)

In Grafana, use these queries:

### HTTP Requests
```promql
# Total requests per second
rate(http_requests_total[1m])

# Average response time
histogram_quantile(0.95, http_request_duration_seconds)

# Error rate (4xx + 5xx)
sum(rate(http_requests_total{status_code=~"[45].."}[1m]))
```

### System Health
```promql
# CPU usage %
(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))) * 100

# Memory usage %
(1 - (node_memory_MemFree_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage %
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100
```

---

## Deploy to Remote Server

### 1. SSH into your server
```bash
ssh root@38.242.246.126
```

### 2. Navigate to project
```bash
cd /opt/V-and-D-PROJECT
```

### 3. Pull latest changes
```bash
git pull origin deployment
```

### 4. Start monitoring stack
```bash
docker-compose down  # Stop old containers
docker-compose up -d  # Start everything
```

### 5. Verify services
```bash
docker ps
```

You should see:
- internconnect-backend
- internconnect-frontend
- internconnect-prometheus
- internconnect-grafana
- internconnect-node-exporter

### 6. Access Remote Grafana

**Grafana**: [http://38.242.246.126:3000](http://38.242.246.126:3000)
**Prometheus**: [http://38.242.246.126:9090](http://38.242.246.126:9090)

---

## Grafana Default Credentials

- **Username**: `admin`
- **Password**: `admin`

⚠️ **Change password immediately:**
1. Go to Grafana (http://localhost:3000)
2. Click profile icon → Preferences
3. Change password

---

## Common Troubleshooting

### Prometheus can't reach backend
```bash
# Check backend is running
docker ps | grep backend

# Check prometheus config
docker logs internconnect-prometheus | grep error
```

### Grafana data source not working
```bash
# Verify prometheus is accessible
docker exec internconnect-grafana curl -s http://prometheus:9090/-/healthy
```

### Restart all monitoring services
```bash
docker-compose restart prometheus grafana node-exporter
```

### View logs
```bash
docker logs internconnect-grafana
docker logs internconnect-prometheus
docker logs internconnect-node-exporter
```

---

## Example Dashboard Panels

### Panel 1: HTTP Request Rate
- **Metric**: `rate(http_requests_total[1m])`
- **Title**: "Requests per Second"
- **Graph type**: Time series

### Panel 2: Response Time (p95)
- **Metric**: `histogram_quantile(0.95, http_request_duration_seconds)`
- **Title**: "95th Percentile Response Time"
- **Unit**: seconds

### Panel 3: CPU Usage
- **Metric**: `(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))) * 100`
- **Title**: "CPU Usage %"
- **Unit**: percent

### Panel 4: Memory Usage
- **Metric**: `(1 - (node_memory_MemFree_bytes / node_memory_MemTotal_bytes)) * 100`
- **Title**: "Memory Usage %"
- **Unit**: percent

---

## For Exam/Report

**Screenshots to take:**
1. Grafana login page
2. Dashboard with system metrics
3. HTTP request rate graph
4. Response time histogram
5. CPU and memory usage over time
6. Prometheus targets list (http://localhost:9090/targets)
7. Docker containers running (`docker ps`)

---

## Files Modified

- `docker-compose.yml` — Added Prometheus, Grafana, Node Exporter services
- `prometheus.yml` — Scrape configuration for metrics collection
- `backend/server.js` — Added `/metrics` endpoint and Prometheus middleware
- `backend/package.json` — Already includes `prom-client`
