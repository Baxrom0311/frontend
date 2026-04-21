import axios, { AxiosError, type AxiosRequestConfig } from "axios";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "https://bronh.boos.uz/api/v1";

const TOKEN_KEY = "cdss.access_token";
const REFRESH_KEY = "cdss.refresh_token";

export const tokenStore = {
  get access() {
    return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
  },
  get refresh() {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({ baseURL: API_BASE_URL });

export function getApiErrorMessage(error: unknown, fallback = "Xatolik yuz berdi") {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const payload = data as { message?: unknown; detail?: unknown; details?: unknown };
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.detail === "string") return payload.detail;
    if (Array.isArray(payload.details) && payload.details.length > 0)
      return "Ma'lumotlarni tekshirib qayta kiriting";
  }
  return fallback;
}

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flush(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry && tokenStore.refresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) return reject(error);
            original.headers = original.headers ?? {};
            (original.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: tokenStore.refresh,
        });
        tokenStore.set(data.access_token, data.refresh_token);
        flush(data.access_token);
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (e) {
        flush(null);
        tokenStore.clear();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export type UserRole = "patient" | "doctor" | "admin";
export type LanguageCode = "uz" | "ru" | "en";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  preferred_language: LanguageCode;
  is_active?: boolean;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  user: User;
}

export interface PredictionItem {
  disease: string;
  confidence: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data),
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    role?: UserRole;
    preferred_language?: LanguageCode;
  }) => api.post<User>("/auth/register", payload).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
  logout: (refresh_token: string) =>
    api.post("/auth/logout", { refresh_token }).then((r) => r.data),
};

export interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female";
  height_cm: number | null;
  weight_kg: number | null;
  chronic_diseases: string[];
  allergies: string[];
  smoking_status: boolean;
  vaccination_status: Record<string, boolean>;
  emergency_contact: string | null;
  created_at: string;
}

export const patientsApi = {
  list: () => api.get<Patient[]>("/patients/").then((r) => r.data),
  create: (data: Partial<Patient>) => api.post<Patient>("/patients/", data).then((r) => r.data),
  get: (id: string) => api.get<Patient>(`/patients/${id}`).then((r) => r.data),
};

export interface SymptomRecord {
  id: string;
  patient_id: string;
  temperature: number;
  cough_type: "none" | "dry" | "wet" | "bloody";
  dyspnea_level: "none" | "mild" | "moderate" | "severe";
  sore_throat: boolean;
  runny_nose: boolean;
  headache_level: "none" | "mild" | "moderate" | "severe";
  muscle_pain: boolean;
  fatigue_level: number;
  duration_days: number;
  oxygen_saturation: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  chest_pain: boolean;
  loss_of_taste: boolean;
  diarrhea: boolean;
  chronic_diseases: string[];
  covid_contact: boolean;
  smoker: boolean;
  notes: string | null;
  created_at?: string;
}

export const symptomsApi = {
  list: () => api.get<SymptomRecord[]>("/symptoms/").then((r) => r.data),
  create: (data: Partial<SymptomRecord>) =>
    api.post<SymptomRecord>("/symptoms/", data).then((r) => r.data),
  get: (id: string) => api.get<SymptomRecord>(`/symptoms/${id}`).then((r) => r.data),
};

export interface Diagnosis {
  id: string;
  record_id: string;
  predicted_condition: string;
  confidence_score: number;
  risk_level: string;
  urgency_level: string;
  top_predictions: PredictionItem[];
  rule_engine_alerts: string[];
  recommendations: string[];
  explanation: Record<string, unknown>;
  summary: string;
  is_confirmed: boolean;
  confirmed_condition: string | null;
  doctor_notes: string | null;
  confirmed_by_user_id: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export const diagnosesApi = {
  create: (record_id: string, force_recompute = false) =>
    api.post<Diagnosis>("/diagnoses/", { record_id, force_recompute }).then((r) => r.data),
  history: () => api.get<Diagnosis[]>("/diagnoses/history").then((r) => r.data),
  get: (id: string) => api.get<Diagnosis>(`/diagnoses/${id}`).then((r) => r.data),
  confirm: (id: string, payload: { confirmed_condition?: string; doctor_notes?: string }) =>
    api.post<Diagnosis>(`/diagnoses/${id}/confirm`, payload).then((r) => r.data),
};

export interface AdminStats {
  total_users: number;
  total_patients: number;
  total_symptom_records: number;
  total_diagnoses: number;
  confirmed_diagnoses: number;
  users_by_role: Record<string, number>;
}

export const adminApi = {
  stats: () => api.get<AdminStats>("/admin/stats").then((r) => r.data),
  users: () => api.get<User[]>("/admin/users").then((r) => r.data),
  modelMeta: () => api.get<Record<string, unknown>>("/admin/ml/metadata").then((r) => r.data),
  retrain: () => api.post<Record<string, unknown>>("/admin/ml/retrain").then((r) => r.data),
  health: () => api.get<Record<string, unknown>>("/health").then((r) => r.data),
};
