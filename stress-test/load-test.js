import http from 'k6/http';
import { check, sleep } from 'k6';

// Replace with your Railway URL after deployment
const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // ramp up to 20 users
    { duration: '60s', target: 50 },  // hold at 50 users
    { duration: '20s', target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed:   ['rate<0.05'],  // less than 5% errors
  },
};

export default function () {
  // Test 1: Health check
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health status 200': (r) => r.status === 200 });

  // Test 2: Browse internships
  const internships = http.get(`${BASE_URL}/internships`);
  check(internships, {
    'internships status 200': (r) => r.status === 200,
    'internships returns array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
    },
  });

  // Test 3: Search internships
  const search = http.get(`${BASE_URL}/internships?search=software`);
  check(search, { 'search status 200': (r) => r.status === 200 });

  // Test 4: Login attempt (validation test)
  const loginPayload = JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' });
  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(loginRes, { 'login responded': (r) => r.status === 200 || r.status === 401 });

  sleep(1);
}
