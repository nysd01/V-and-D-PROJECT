import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// EXPO_PUBLIC_API_URL in .env overrides everything (best for physical devices).
// Falls back to platform-appropriate localhost address.
export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_URL ??
  Platform.select({
    android: 'http://10.0.2.2:3000/api',
    default: 'http://localhost:3000/api',
  });

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  type: 'intern' | 'firm';
  profile_picture?: string;
  university?: string;
  company_name?: string;
  companyName?: string;
  industry?: string;
  address?: string;
}

export interface ApiInternship {
  id: number;
  firm_id: number;
  firm_name: string;
  firm_logo_url?: string;
  company_name: string;
  title: string;
  category: string;
  description: string;
  requirements: string;
  location: string;
  duration: string;
  work_type: 'Remote' | 'Hybrid' | 'In-person';
  is_paid: boolean;
  status: 'active' | 'closed';
  posted_on: string;
  applicant_count?: number;
}

export interface ApiApplication {
  id: number;
  internship_id: number;
  title: string;
  firm_name: string;
  company_name: string;
  location: string;
  work_type: string;
  is_paid: boolean;
  duration: string;
  status: 'Pending' | 'Interviewing' | 'Accepted' | 'Rejected';
  applied_at: string;
}

export interface ApiApplicant {
  id: number;
  intern_id: number;
  name: string;
  email: string;
  university: string;
  profile_picture?: string;
  cover_letter: string;
  document_url?: string | null;
  interview_scheduled_at?: string | null;
  status: 'Pending' | 'Interviewing' | 'Accepted' | 'Rejected';
  applied_at: string;
}

export interface ApiNotification {
  id: number | string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'alert';
  timestamp: string;
  read: boolean;
  icon: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: ApiUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: Record<string, unknown>) =>
      request<{ token: string; user: ApiUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    googleLogin: (accessToken: string) =>
      request<{ token: string; user: ApiUser }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ accessToken }),
      }),
    forgotPassword: (email: string) =>
      request<{ message: string; code: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (email: string, code: string, newPassword: string) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword }),
      }),
    me: () => request<ApiUser>('/auth/me'),
    updateMe: (updates: {
      name?: string;
      university?: string;
      companyName?: string;
      industry?: string;
      address?: string;
      profile_picture?: string;
    }) =>
      request<ApiUser>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
  },

  internships: {
    list: (search = '', filter = 'All') =>
      request<ApiInternship[]>(
        `/internships?search=${encodeURIComponent(search)}&filter=${encodeURIComponent(filter)}`
      ),
    mine: () => request<ApiInternship[]>('/internships/mine'),
    get: (id: number | string) => request<ApiInternship>(`/internships/${id}`),
    create: (data: {
      title: string;
      category: string;
      description: string;
      requirements?: string;
      location?: string;
      duration?: string;
      work_type?: string;
      is_paid?: boolean;
    }) =>
      request<ApiInternship>('/internships', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: number | string, status: 'active' | 'closed') =>
      request<ApiInternship>(`/internships/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    delete: (id: number | string) =>
      request<{ success: boolean }>(`/internships/${id}`, {
        method: 'DELETE',
      }),
  },

  applications: {
    list: () => request<ApiApplication[]>('/applications'),
    forPosting: (internshipId: number | string) =>
      request<ApiApplicant[]>(`/applications/posting/${internshipId}`),
    create: (internship_id: number, cover_letter: string, document_url?: string) =>
      request<{ id: number }>('/applications', {
        method: 'POST',
        body: JSON.stringify({ internship_id, cover_letter, document_url: document_url || null }),
      }),
    updateStatus: (id: number | string, status: string, interview_scheduled_at?: string | null) =>
      request<ApiApplicant>(`/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...(interview_scheduled_at !== undefined && { interview_scheduled_at }) }),
      }),
    withdraw: (id: number | string) =>
      request<{ success: boolean }>(`/applications/${id}`, { method: 'DELETE' }),
  },

  saved: {
    list: () => request<number[]>('/saved'),
    save: (internshipId: number | string) =>
      request<{ saved: boolean }>(`/saved/${internshipId}`, { method: 'POST' }),
    unsave: (internshipId: number | string) =>
      request<{ saved: boolean }>(`/saved/${internshipId}`, { method: 'DELETE' }),
  },

  notifications: {
    list: () => request<ApiNotification[]>('/notifications'),
    create: (application_id: number, company_name: string, title?: string) =>
      request<ApiNotification>('/notifications', {
        method: 'POST',
        body: JSON.stringify({ application_id, company_name, title }),
      }),
  },
};

// Read file as base64 then POST as JSON — avoids all multipart/native-URI issues on Android
async function base64Upload(endpoint: string, fileUri: string, mimeType: string, fileName?: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' } as any);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ base64, mimeType, fileName: fileName ?? 'file' }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.url as string;
}

export function uploadDocument(fileUri: string, fileName: string, mimeType: string): Promise<string> {
  return base64Upload('/upload/document', fileUri, mimeType, fileName);
}

export function uploadAvatar(fileUri: string, fileName: string, mimeType: string): Promise<string> {
  return base64Upload('/upload/avatar', fileUri, mimeType, fileName);
}
