import { FormEvent, useEffect, useState } from "react";

import {
  Language,
  detectInitialLanguage,
  getFeatureName,
  getFeatureValue,
  getLanguageName,
  getOptionLabel,
  languageOptions,
  normalizeLanguage,
  persistLanguage,
  translate,
} from "./i18n";

type Role = "patient" | "doctor" | "admin";
type Gender = "male" | "female";
type CoughType = "none" | "dry" | "wet" | "bloody";
type DyspneaLevel = "none" | "mild" | "moderate" | "severe";
type HeadacheLevel = "none" | "mild" | "moderate" | "severe";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  preferred_language: Language;
  is_active: boolean;
};

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
};

type Patient = {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  chronic_diseases: string[];
};

type Diagnosis = {
  id: string;
  predicted_condition: string;
  confidence_score: number;
  risk_level: string;
  urgency_level: string;
  top_predictions: Array<{ disease: string; confidence: number }>;
  rule_engine_alerts: string[];
  recommendations: string[];
  explanation: DiagnosisExplanation;
  summary: string;
  is_confirmed: boolean;
  confirmed_condition: string | null;
  doctor_notes: string | null;
  confirmed_by_user_id: string | null;
  confirmed_at: string | null;
  created_at: string;
};

type AdminStats = {
  total_users: number;
  total_patients: number;
  total_symptom_records: number;
  total_diagnoses: number;
  confirmed_diagnoses: number;
  users_by_role: Record<string, number>;
};

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  preferred_language: Language;
  is_active: boolean;
  created_at: string;
};

type ModelSupportFeature = {
  feature: string;
  value: string;
  support_score: number;
  predicted_support: number;
  runner_up_support: number;
};

type StructuredDiagnosisExplanation = {
  engine_mode: string;
  final_condition: string;
  override_applied: boolean;
  rule_signals: Record<string, number>;
  model_support: {
    predicted_label: string;
    predicted_confidence: number;
    runner_up_label: string | null;
    runner_up_confidence: number | null;
    prior_delta_vs_runner_up: number | null;
    top_supporting_features: ModelSupportFeature[];
    top_counter_features: ModelSupportFeature[];
  } | null;
};

type DiagnosisExplanation = StructuredDiagnosisExplanation | Record<string, number>;

type ModelMetadata = {
  status: string;
  engine_mode: string;
  ml_model_ready: boolean;
  model_path: string;
  metrics_path: string;
  evaluation_path: string;
  evaluation_markdown_path: string;
  explainability_path: string;
  explainability_markdown_path: string;
  cleaning_report_path: string;
  cleaning_report_markdown_path: string;
  data_quality_path: string;
  data_quality_markdown_path: string;
  feature_dataset_path: string;
  dataset_split_path: string;
  dataset_profile_path: string;
  metrics: {
    train_samples: number;
    test_samples: number;
    split_source: string;
    metrics: {
      accuracy: number;
      tested_samples: number;
      per_label_accuracy: Record<string, number>;
    };
  } | null;
  evaluation_report: {
    folds: number;
    samples: number;
    mean_accuracy: number;
    overall_accuracy: number;
    fold_results: Array<{
      fold: number;
      train_samples: number;
      test_samples: number;
      accuracy: number;
    }>;
    per_label_accuracy: Record<string, number>;
  } | null;
  explainability_report: {
    label_count: number;
    feature_count: number;
    top_n: number;
  } | null;
  cleaning_report: {
    rows_with_any_change: number;
    row_change_rate: number;
    total_field_changes: number;
    changed_field_counts: Record<string, number>;
  } | null;
  data_quality_report: {
    duplicate_rows: number;
    duplicate_rate: number;
    class_balance_ratio: number | null;
    warnings: string[];
  } | null;
  split_manifest: {
    train_ids: string[];
    test_ids: string[];
  } | null;
  dataset_profile: {
    total_rows: number;
    total_labels: number;
    label_distribution: Record<string, number>;
  } | null;
};

type RetrainResponse = {
  status: string;
  message: string;
  engine_mode: string;
  metadata: ModelMetadata;
};

type ApiError = {
  message?: string;
  detail?: string;
};

type StatusState = {
  key: string;
  values?: Record<string, string | number>;
};

type WorkspaceTab = "assessment" | "reviews" | "admin";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

const roleOptions: Role[] = ["patient", "doctor"];
const coughOptions: CoughType[] = ["none", "dry", "wet", "bloody"];
const dyspneaOptions: DyspneaLevel[] = ["none", "mild", "moderate", "severe"];
const headacheOptions: HeadacheLevel[] = ["none", "mild", "moderate", "severe"];
const checkboxFields = [
  ["sore_throat", "feature.sore_throat"],
  ["runny_nose", "feature.runny_nose"],
  ["muscle_pain", "feature.muscle_pain"],
  ["chest_pain", "feature.chest_pain"],
  ["loss_of_taste", "feature.loss_of_taste"],
  ["diarrhea", "feature.diarrhea"],
  ["covid_contact", "feature.covid_contact"],
  ["smoker", "feature.smoker"],
] as const;

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = (await response.json()) as T | ApiError;
  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.message ?? error.detail ?? "Request failed");
  }

  return data as T;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatSignedScore(value: number) {
  const rounded = value.toFixed(2);
  return value > 0 ? `+${rounded}` : rounded;
}

function formatDateTime(value: string | null, language: Language) {
  if (!value) {
    return "-";
  }

  const locale = language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ";
  return new Date(value).toLocaleString(locale);
}

function isStructuredExplanation(
  explanation: DiagnosisExplanation,
): explanation is StructuredDiagnosisExplanation {
  return "rule_signals" in explanation;
}

function resolveErrorMessage(requestError: unknown, fallback: string) {
  if (!(requestError instanceof Error)) {
    return fallback;
  }

  return requestError.message === "Request failed" ? fallback : requestError.message;
}

export default function App() {
  const initialLanguage = detectInitialLanguage();

  const [mode, setMode] = useState<"register" | "login">("register");
  const [uiLanguage, setUiLanguage] = useState<Language>(initialLanguage);
  const [token, setToken] = useState(() => localStorage.getItem("cdss_token") ?? "");
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("cdss_refresh_token") ?? "");
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [confirmingDiagnosis, setConfirmingDiagnosis] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("assessment");
  const [statusState, setStatusState] = useState<StatusState>({ key: "status.ready" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [authForm, setAuthForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "patient" as Role,
    preferred_language: initialLanguage,
  });

  const [patientForm, setPatientForm] = useState({
    full_name: "",
    date_of_birth: "2000-01-01",
    gender: "male" as Gender,
    height_cm: "170",
    weight_kg: "65",
    chronic_diseases: "",
    allergies: "",
    smoking_status: false,
    vaccination_covid: true,
    emergency_contact: "+99890",
  });

  const [symptomForm, setSymptomForm] = useState({
    temperature: "37.2",
    cough_type: "none" as CoughType,
    dyspnea_level: "none" as DyspneaLevel,
    sore_throat: false,
    runny_nose: false,
    headache_level: "none" as HeadacheLevel,
    muscle_pain: false,
    fatigue_level: "2",
    duration_days: "2",
    oxygen_saturation: "98",
    heart_rate: "84",
    respiratory_rate: "18",
    chest_pain: false,
    loss_of_taste: false,
    diarrhea: false,
    chronic_diseases: "",
    covid_contact: false,
    smoker: false,
    notes: "",
  });

  const [confirmationForm, setConfirmationForm] = useState({
    confirmed_condition: "",
    doctor_notes: "",
  });

  const t = (key: string, values?: Record<string, string | number>) =>
    translate(uiLanguage, key, values);
  const statusText = t(statusState.key, statusState.values);
  const canReview = user?.role === "doctor" || user?.role === "admin";
  const canAdmin = user?.role === "admin";
  const availableTabs: WorkspaceTab[] = canAdmin
    ? ["assessment", "reviews", "admin"]
    : canReview
      ? ["assessment", "reviews"]
      : ["assessment"];
  const explanation = diagnosis?.explanation;
  const ruleSignals = explanation
    ? isStructuredExplanation(explanation)
      ? explanation.rule_signals
      : explanation
    : null;
  const modelSupport = explanation && isStructuredExplanation(explanation) ? explanation.model_support : null;
  const pendingReviews = history.filter((item) => !item.is_confirmed);
  const confirmedReviews = history.filter((item) => item.is_confirmed);
  const endpointLabel = apiBaseUrl.replace(/^https?:\/\//, "");
  const heroTags = [
    user ? getOptionLabel(uiLanguage, "role", user.role) : t("section.account"),
    patient ? patient.full_name : t("section.patientProfile"),
    diagnosis ? diagnosis.predicted_condition : t("section.result"),
  ];

  useEffect(() => {
    persistLanguage(uiLanguage);
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  useEffect(() => {
    if (user?.preferred_language) {
      setUiLanguage(normalizeLanguage(user.preferred_language));
    }
  }, [user?.preferred_language]);

  useEffect(() => {
    const loadModelMetadata = async () => {
      try {
        const metadata = await apiRequest<ModelMetadata>("/health/model-metadata");
        setModelMetadata(metadata);
      } catch {
        setModelMetadata(null);
      }
    };

    loadModelMetadata();
  }, []);

  useEffect(() => {
    setConfirmationForm({
      confirmed_condition: diagnosis?.confirmed_condition ?? diagnosis?.predicted_condition ?? "",
      doctor_notes: diagnosis?.doctor_notes ?? "",
    });
  }, [diagnosis]);

  useEffect(() => {
    if (!availableTabs.includes(workspaceTab)) {
      setWorkspaceTab(availableTabs[0]);
    }
  }, [availableTabs, workspaceTab]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setHistory([]);
      return;
    }

    const loadUserAndHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const me = await apiRequest<User>("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(me);
        setUiLanguage(normalizeLanguage(me.preferred_language));
        const diagnosisHistory = await apiRequest<Diagnosis[]>("/diagnoses/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(diagnosisHistory);
      } catch (requestError) {
        if (refreshToken) {
          try {
            const refreshed = await apiRequest<AuthResponse>("/auth/refresh", {
              method: "POST",
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
            localStorage.setItem("cdss_token", refreshed.access_token);
            localStorage.setItem("cdss_refresh_token", refreshed.refresh_token);
            setToken(refreshed.access_token);
            setRefreshToken(refreshed.refresh_token);
            setUser(refreshed.user);
            setUiLanguage(normalizeLanguage(refreshed.user.preferred_language));
            return;
          } catch {
            localStorage.removeItem("cdss_token");
            localStorage.removeItem("cdss_refresh_token");
            setToken("");
            setRefreshToken("");
            setUser(null);
            setError(t("status.sessionRestoreFailed"));
          }
        } else {
          localStorage.removeItem("cdss_token");
          setToken("");
          setUser(null);
          setError(resolveErrorMessage(requestError, t("status.sessionRestoreFailed")));
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserAndHistory();
  }, [token, refreshToken]);

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      setAdminStats(null);
      setAdminUsers([]);
      return;
    }

    const loadAdminData = async () => {
      setAdminLoading(true);
      try {
        const [stats, users] = await Promise.all([
          apiRequest<AdminStats>("/admin/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiRequest<AdminUser[]>("/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setAdminStats(stats);
        setAdminUsers(users);
      } catch {
        setAdminStats(null);
        setAdminUsers([]);
      } finally {
        setAdminLoading(false);
      }
    };

    loadAdminData();
  }, [token, user?.role]);

  function handleLanguageChange(language: Language) {
    setUiLanguage(language);
    if (!user) {
      setAuthForm((current) => ({
        ...current,
        preferred_language: language,
      }));
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatusState({ key: "status.authInProgress" });

    try {
      if (mode === "register") {
        await apiRequest<User>("/auth/register", {
          method: "POST",
          body: JSON.stringify(authForm),
        });
      }

      const loginPayload = {
        email: authForm.email,
        password: authForm.password,
      };
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginPayload),
      });

      localStorage.setItem("cdss_token", response.access_token);
      localStorage.setItem("cdss_refresh_token", response.refresh_token);
      setToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setUser(response.user);
      setUiLanguage(normalizeLanguage(response.user.preferred_language));
      setStatusState({ key: "status.loginSuccess" });
      setPatientForm((current) => ({
        ...current,
        full_name: current.full_name || response.user.full_name,
      }));
    } catch (requestError) {
      setError(resolveErrorMessage(requestError, t("status.authFailed")));
      setStatusState({ key: "status.authFailed" });
    } finally {
      setLoading(false);
    }
  }

  async function handlePatientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError(t("status.loginRequired"));
      return;
    }

    setLoading(true);
    setError("");
    setStatusState({ key: "status.patientSaveProgress" });

    try {
      const response = await apiRequest<Patient>("/patients/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: patientForm.full_name,
          date_of_birth: patientForm.date_of_birth,
          gender: patientForm.gender,
          height_cm: Number(patientForm.height_cm),
          weight_kg: Number(patientForm.weight_kg),
          chronic_diseases: patientForm.chronic_diseases
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          allergies: patientForm.allergies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          smoking_status: patientForm.smoking_status,
          vaccination_status: { covid: patientForm.vaccination_covid },
          emergency_contact: patientForm.emergency_contact,
        }),
      });
      setPatient(response);
      setStatusState({ key: "status.patientSaved" });
    } catch (requestError) {
      setError(resolveErrorMessage(requestError, t("status.patientCreateFailed")));
      setStatusState({ key: "status.patientCreateFailed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSymptomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !patient) {
      setError(t("status.patientRequired"));
      return;
    }

    setLoading(true);
    setError("");
    setStatusState({ key: "status.symptomProgress" });

    try {
      const symptomRecord = await apiRequest<{ id: string }>("/symptoms/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: patient.id,
          temperature: Number(symptomForm.temperature),
          cough_type: symptomForm.cough_type,
          dyspnea_level: symptomForm.dyspnea_level,
          sore_throat: symptomForm.sore_throat,
          runny_nose: symptomForm.runny_nose,
          headache_level: symptomForm.headache_level,
          muscle_pain: symptomForm.muscle_pain,
          fatigue_level: Number(symptomForm.fatigue_level),
          duration_days: Number(symptomForm.duration_days),
          oxygen_saturation: Number(symptomForm.oxygen_saturation),
          heart_rate: Number(symptomForm.heart_rate),
          respiratory_rate: Number(symptomForm.respiratory_rate),
          chest_pain: symptomForm.chest_pain,
          loss_of_taste: symptomForm.loss_of_taste,
          diarrhea: symptomForm.diarrhea,
          chronic_diseases: symptomForm.chronic_diseases
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          covid_contact: symptomForm.covid_contact,
          smoker: symptomForm.smoker,
          notes: symptomForm.notes,
        }),
      });

      const diagnosisResponse = await apiRequest<Diagnosis>("/diagnoses/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ record_id: symptomRecord.id }),
      });

      setDiagnosis(diagnosisResponse);
      const diagnosisHistory = await apiRequest<Diagnosis[]>("/diagnoses/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(diagnosisHistory);
      setStatusState({ key: "status.diagnosisReady" });
    } catch (requestError) {
      setError(resolveErrorMessage(requestError, t("status.diagnosisFailed")));
      setStatusState({ key: "status.diagnosisFailed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (refreshToken) {
      try {
        await apiRequest<{ status: string; message: string }>("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Local cleanup is still required even if revoke call fails.
      }
    }

    localStorage.removeItem("cdss_token");
    localStorage.removeItem("cdss_refresh_token");
    setToken("");
    setRefreshToken("");
    setUser(null);
    setPatient(null);
    setDiagnosis(null);
    setHistory([]);
    setStatusState({ key: "status.loggedOut" });
    setError("");
  }

  async function handleRetrain() {
    if (!token || user?.role !== "admin") {
      return;
    }

    setRetraining(true);
    setError("");
    setStatusState({ key: "status.retrainProgress" });
    try {
      const response = await apiRequest<RetrainResponse>("/admin/ml/retrain", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setModelMetadata(response.metadata);
      setStatusState({ key: "status.retrainSuccess" });
    } catch (requestError) {
      setError(resolveErrorMessage(requestError, t("status.retrainFailed")));
      setStatusState({ key: "status.retrainFailed" });
    } finally {
      setRetraining(false);
    }
  }

  async function handleDiagnosisConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !diagnosis || (user?.role !== "doctor" && user?.role !== "admin")) {
      return;
    }

    setConfirmingDiagnosis(true);
    setError("");
    setStatusState({ key: "status.confirmationProgress" });

    try {
      const response = await apiRequest<Diagnosis>(`/diagnoses/${diagnosis.id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          confirmed_condition: confirmationForm.confirmed_condition.trim() || null,
          doctor_notes: confirmationForm.doctor_notes.trim() || null,
        }),
      });

      setDiagnosis(response);
      const diagnosisHistory = await apiRequest<Diagnosis[]>("/diagnoses/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(diagnosisHistory);
      if (user.role === "admin") {
        const stats = await apiRequest<AdminStats>("/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdminStats(stats);
      }
      setStatusState({ key: "status.confirmationSuccess" });
    } catch (requestError) {
      setError(resolveErrorMessage(requestError, t("status.confirmationFailed")));
      setStatusState({ key: "status.confirmationFailed" });
    } finally {
      setConfirmingDiagnosis(false);
    }
  }

  function handleDiagnosisSelect(selectedDiagnosis: Diagnosis) {
    setDiagnosis(selectedDiagnosis);
    if (canReview) {
      setWorkspaceTab("reviews");
    }
  }

  const completedSteps = [user, patient, diagnosis].filter(Boolean).length;

  return (
    <main className="page">
      <div className="page-glow glow-a" />
      <div className="page-glow glow-b" />
      <div className="page-glow glow-c" />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t("app.project")}</p>
          <h1>{t("app.title")}</h1>
          <p className="lead">{t("app.lead")}</p>
          <div className="hero-tags">
            {heroTags.map((tag) => (
              <span key={tag} className="hero-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-meta">
          <div className="metric">
            <span>{t("metric.stage")}</span>
            <strong>{completedSteps}/3</strong>
          </div>
          <div className="metric">
            <span>{t("metric.api")}</span>
            <strong>FastAPI</strong>
          </div>
          <div className="metric">
            <span>{t("metric.engine")}</span>
            <strong>{modelMetadata?.engine_mode ?? t("common.loading")}</strong>
          </div>
        </div>
      </section>

      <section className="status-bar">
        <div className="status-copy">
          <span className="status-label">{t("status.label")}</span>
          <p className="status-text">{statusText}</p>
        </div>
        <div className="status-actions">
          <div className="segmented language-switcher" aria-label={t("label.language")}>
            {languageOptions.map((language) => (
              <button
                key={language}
                type="button"
                className={uiLanguage === language ? "active" : ""}
                onClick={() => handleLanguageChange(language)}
              >
                {getLanguageName(language)}
              </button>
            ))}
          </div>
          {user ? (
            <div className="user-chip">
              <span className="user-chip-label">{user.full_name}</span>
              <button type="button" onClick={handleLogout}>
                {t("action.logout")}
              </button>
            </div>
          ) : (
            <span className="endpoint-chip">{endpointLabel}</span>
          )}
        </div>
      </section>

      {error ? <section className="alert error">{error}</section> : null}
      {loading ? <section className="alert info">{t("status.loading")}</section> : null}

      <section className="layout">
        <div className="main-stack">
          {user ? (
            <section className="card sidebar-card">
              <div className="card-header">
                <h2>{t("section.workspace")}</h2>
              </div>
              <div className="segmented workspace-tabs">
                {availableTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={workspaceTab === tab ? "active" : ""}
                    onClick={() => setWorkspaceTab(tab)}
                  >
                    {t(`workspace.${tab}`)}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {!user ? (
            <section className="card form-card">
              <div className="card-header">
                <h2>{t("section.account")}</h2>
                <div className="segmented">
                  <button
                    type="button"
                    className={mode === "register" ? "active" : ""}
                    onClick={() => setMode("register")}
                  >
                    {t("action.register")}
                  </button>
                  <button
                    type="button"
                    className={mode === "login" ? "active" : ""}
                    onClick={() => setMode("login")}
                  >
                    {t("action.login")}
                  </button>
                </div>
              </div>

              <form className="form-grid" onSubmit={handleAuthSubmit}>
                {mode === "register" ? (
                  <>
                    <label>
                      {t("label.fullName")}
                      <input
                        value={authForm.full_name}
                        onChange={(event) =>
                          setAuthForm({ ...authForm, full_name: event.target.value })
                        }
                        required
                      />
                    </label>
                    <label>
                      {t("label.role")}
                      <select
                        value={authForm.role}
                        onChange={(event) =>
                          setAuthForm({ ...authForm, role: event.target.value as Role })
                        }
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {getOptionLabel(uiLanguage, "role", role)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}

                <label>
                  {t("label.email")}
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                    required
                  />
                </label>

                <label>
                  {t("label.password")}
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) =>
                      setAuthForm({ ...authForm, password: event.target.value })
                    }
                    required
                  />
                </label>

                {mode === "register" ? (
                  <label>
                    {t("label.language")}
                    <select
                      value={authForm.preferred_language}
                      onChange={(event) => {
                        const nextLanguage = event.target.value as Language;
                        setAuthForm({
                          ...authForm,
                          preferred_language: nextLanguage,
                        });
                        setUiLanguage(nextLanguage);
                      }}
                    >
                      {languageOptions.map((language) => (
                        <option key={language} value={language}>
                          {getLanguageName(language)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <button className="primary-button" type="submit">
                  {mode === "register" ? t("form.registerSubmit") : t("form.loginSubmit")}
                </button>
              </form>
            </section>
          ) : null}

          {user && workspaceTab === "assessment" && !patient ? (
            <section className="card form-card">
              <div className="card-header">
                <h2>{t("section.patientProfile")}</h2>
              </div>

              <form className="form-grid" onSubmit={handlePatientSubmit}>
                <label>
                  {t("label.fullName")}
                  <input
                    value={patientForm.full_name}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, full_name: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.birthDate")}
                  <input
                    type="date"
                    value={patientForm.date_of_birth}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, date_of_birth: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.gender")}
                  <select
                    value={patientForm.gender}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, gender: event.target.value as Gender })
                    }
                  >
                    <option value="male">{getOptionLabel(uiLanguage, "gender", "male")}</option>
                    <option value="female">{getOptionLabel(uiLanguage, "gender", "female")}</option>
                  </select>
                </label>
                <label>
                  {t("label.height")}
                  <input
                    type="number"
                    value={patientForm.height_cm}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, height_cm: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.weight")}
                  <input
                    type="number"
                    value={patientForm.weight_kg}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, weight_kg: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.chronicDiseases")}
                  <input
                    value={patientForm.chronic_diseases}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, chronic_diseases: event.target.value })
                    }
                    placeholder={t("placeholder.chronicDiseases")}
                  />
                </label>
                <label>
                  {t("label.allergies")}
                  <input
                    value={patientForm.allergies}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, allergies: event.target.value })
                    }
                    placeholder={t("placeholder.allergies")}
                  />
                </label>
                <label>
                  {t("label.emergencyContact")}
                  <input
                    value={patientForm.emergency_contact}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, emergency_contact: event.target.value })
                    }
                  />
                </label>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={patientForm.smoking_status}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, smoking_status: event.target.checked })
                    }
                  />
                  {t("description.smoking")}
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={patientForm.vaccination_covid}
                    onChange={(event) =>
                      setPatientForm({ ...patientForm, vaccination_covid: event.target.checked })
                    }
                  />
                  {t("description.vaccinated")}
                </label>

                <button className="primary-button" type="submit">
                  {t("action.saveProfile")}
                </button>
              </form>
            </section>
          ) : null}

          {user && workspaceTab === "assessment" && patient ? (
            <section className="card form-card">
              <div className="card-header">
                <div>
                  <h2>{t("section.symptomAssessment")}</h2>
                  <p>{t("description.symptomAssessment", { name: patient.full_name })}</p>
                </div>
                <span className="pill">{getOptionLabel(uiLanguage, "gender", patient.gender)}</span>
              </div>

              <form className="form-grid" onSubmit={handleSymptomSubmit}>
                <label>
                  {t("label.temperature")}
                  <input
                    type="number"
                    step="0.1"
                    value={symptomForm.temperature}
                    onChange={(event) =>
                      setSymptomForm({ ...symptomForm, temperature: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.coughType")}
                  <select
                    value={symptomForm.cough_type}
                    onChange={(event) =>
                      setSymptomForm({
                        ...symptomForm,
                        cough_type: event.target.value as CoughType,
                      })
                    }
                  >
                    {coughOptions.map((option) => (
                      <option key={option} value={option}>
                        {getOptionLabel(uiLanguage, "coughType", option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("label.dyspnea")}
                  <select
                    value={symptomForm.dyspnea_level}
                    onChange={(event) =>
                      setSymptomForm({
                        ...symptomForm,
                        dyspnea_level: event.target.value as DyspneaLevel,
                      })
                    }
                  >
                    {dyspneaOptions.map((option) => (
                      <option key={option} value={option}>
                        {getOptionLabel(uiLanguage, "dyspneaLevel", option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("label.headache")}
                  <select
                    value={symptomForm.headache_level}
                    onChange={(event) =>
                      setSymptomForm({
                        ...symptomForm,
                        headache_level: event.target.value as HeadacheLevel,
                      })
                    }
                  >
                    {headacheOptions.map((option) => (
                      <option key={option} value={option}>
                        {getOptionLabel(uiLanguage, "headacheLevel", option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("label.durationDays")}
                  <input
                    type="number"
                    value={symptomForm.duration_days}
                    onChange={(event) =>
                      setSymptomForm({ ...symptomForm, duration_days: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.fatigue")}
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={symptomForm.fatigue_level}
                    onChange={(event) =>
                      setSymptomForm({ ...symptomForm, fatigue_level: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.spo2")}
                  <input
                    type="number"
                    value={symptomForm.oxygen_saturation}
                    onChange={(event) =>
                      setSymptomForm({
                        ...symptomForm,
                        oxygen_saturation: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.heartRate")}
                  <input
                    type="number"
                    value={symptomForm.heart_rate}
                    onChange={(event) =>
                      setSymptomForm({ ...symptomForm, heart_rate: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.respiratoryRate")}
                  <input
                    type="number"
                    value={symptomForm.respiratory_rate}
                    onChange={(event) =>
                      setSymptomForm({
                        ...symptomForm,
                        respiratory_rate: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  {t("label.additionalDiseases")}
                  <input
                    value={symptomForm.chronic_diseases}
                    onChange={(event) =>
                      setSymptomForm({
                        ...symptomForm,
                        chronic_diseases: event.target.value,
                      })
                    }
                    placeholder={t("placeholder.additionalDiseases")}
                  />
                </label>
                <label className="full-span">
                  {t("label.notes")}
                  <textarea
                    rows={4}
                    value={symptomForm.notes}
                    onChange={(event) =>
                      setSymptomForm({ ...symptomForm, notes: event.target.value })
                    }
                    placeholder={t("placeholder.notes")}
                  />
                </label>

                <div className="checkbox-grid full-span">
                  {checkboxFields.map(([key, labelKey]) => (
                    <label className="checkbox" key={key}>
                      <input
                        type="checkbox"
                        checked={symptomForm[key]}
                        onChange={(event) =>
                          setSymptomForm({
                            ...symptomForm,
                            [key]: event.target.checked,
                          })
                        }
                      />
                      {getFeatureName(uiLanguage, labelKey.replace("feature.", ""))}
                    </label>
                  ))}
                </div>

                <button className="primary-button" type="submit">
                  {t("action.assess")}
                </button>
              </form>
            </section>
          ) : null}

          {canReview && workspaceTab === "reviews" ? (
            <section className="card form-card">
              <div className="card-header">
                <h2>{t("section.reviewQueue")}</h2>
                <span className="pill">{pendingReviews.length}</span>
              </div>

              {pendingReviews.length > 0 ? (
                <ul className="queue-list">
                  {pendingReviews.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`queue-item ${diagnosis?.id === item.id ? "active" : ""}`}
                        onClick={() => handleDiagnosisSelect(item)}
                      >
                        <span>{item.predicted_condition}</span>
                        <strong>{getOptionLabel(uiLanguage, "riskLevel", item.risk_level)}</strong>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">{t("description.noPendingReviews")}</p>
              )}

              {confirmedReviews.length > 0 ? (
                <div className="review-subsection">
                  <p className="explanation-label">{t("section.recentConfirmed")}</p>
                  <ul className="queue-list compact-queue">
                    {confirmedReviews.slice(0, 4).map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`queue-item ${diagnosis?.id === item.id ? "active" : ""}`}
                          onClick={() => handleDiagnosisSelect(item)}
                        >
                          <span>{item.confirmed_condition ?? item.predicted_condition}</span>
                          <strong>{t("label.confirmed")}</strong>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {canAdmin && workspaceTab === "admin" ? (
            <>
              <section className="card form-card">
                <div className="card-header">
                  <h2>{t("section.adminStats")}</h2>
                </div>
                {adminLoading ? (
                  <p className="muted">{t("status.loading")}</p>
                ) : adminStats ? (
                  <div className="stats-grid">
                    <article className="stat-card">
                      <span>{t("label.totalUsers")}</span>
                      <strong>{adminStats.total_users}</strong>
                    </article>
                    <article className="stat-card">
                      <span>{t("label.totalPatients")}</span>
                      <strong>{adminStats.total_patients}</strong>
                    </article>
                    <article className="stat-card">
                      <span>{t("label.totalRecords")}</span>
                      <strong>{adminStats.total_symptom_records}</strong>
                    </article>
                    <article className="stat-card">
                      <span>{t("label.totalDiagnoses")}</span>
                      <strong>{adminStats.total_diagnoses}</strong>
                    </article>
                    <article className="stat-card">
                      <span>{t("label.confirmedDiagnoses")}</span>
                      <strong>{adminStats.confirmed_diagnoses}</strong>
                    </article>
                    <article className="stat-card">
                      <span>{t("label.role")}</span>
                      <strong>
                        {getOptionLabel(uiLanguage, "role", "doctor")}: {adminStats.users_by_role.doctor ?? 0}
                      </strong>
                    </article>
                  </div>
                ) : (
                  <p className="muted">{t("description.noAdminStats")}</p>
                )}
              </section>

              <section className="card form-card">
                <div className="card-header">
                  <h2>{t("section.adminUsers")}</h2>
                </div>

                {adminLoading ? (
                  <p className="muted">{t("status.loading")}</p>
                ) : adminUsers.length > 0 ? (
                  <ul className="admin-user-list">
                    {adminUsers.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.full_name}</strong>
                          <p className="muted">{item.email}</p>
                        </div>
                        <div className="user-meta">
                          <span className="status-chip neutral">
                            {getOptionLabel(uiLanguage, "role", item.role)}
                          </span>
                          <span className={`status-chip ${item.is_active ? "confirmed" : "pending"}`}>
                            {item.is_active ? t("common.active") : t("common.inactive")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">{t("description.noAdminUsers")}</p>
                )}
              </section>
            </>
          ) : null}

          {canReview && workspaceTab === "reviews" && !diagnosis ? (
            <section className="card form-card">
              <div className="card-header">
                <div>
                  <h2>{t("section.result")}</h2>
                  <p>{t("description.selectDiagnosis")}</p>
                </div>
              </div>
            </section>
          ) : null}

          {diagnosis && workspaceTab !== "admin" ? (
            <section className="card result-card">
              <div className="result-head">
                <div>
                  <p className="eyebrow">{t("section.result")}</p>
                  <h2>{diagnosis.predicted_condition}</h2>
                </div>
                <div className={`risk-badge ${diagnosis.risk_level}`}>
                  {getOptionLabel(uiLanguage, "riskLevel", diagnosis.risk_level)}
                </div>
              </div>

              <p className="summary">{diagnosis.summary}</p>

              <div className="result-grid">
                <article className="result-panel">
                  <h3>{t("label.topPredictions")}</h3>
                  <ul className="result-list">
                    {diagnosis.top_predictions.map((item) => (
                      <li key={item.disease}>
                        <span>{item.disease}</span>
                        <strong>{formatPercent(item.confidence)}</strong>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="result-panel">
                  <h3>{t("label.recommendations")}</h3>
                  <ul className="text-list">
                    {diagnosis.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="result-panel">
                  <h3>{t("label.alerts")}</h3>
                  <ul className="text-list">
                    {diagnosis.rule_engine_alerts.length > 0 ? (
                      diagnosis.rule_engine_alerts.map((item) => <li key={item}>{item}</li>)
                    ) : (
                      <li>{t("description.noUrgentAlerts")}</li>
                    )}
                  </ul>
                </article>

                <article className="result-panel">
                  <h3>{t("label.explanation")}</h3>
                  <div className="explanation-group">
                    <p className="explanation-label">{t("label.ruleSignals")}</p>
                    <ul className="result-list">
                      {ruleSignals && Object.keys(ruleSignals).length > 0 ? (
                        Object.entries(ruleSignals).map(([feature, score]) => (
                          <li key={feature}>
                            <span>{getFeatureName(uiLanguage, feature)}</span>
                            <strong>{score.toFixed(2)}</strong>
                          </li>
                        ))
                      ) : (
                        <li>
                          <span>{t("description.noRuleSignals")}</span>
                          <strong>-</strong>
                        </li>
                      )}
                    </ul>
                  </div>

                  {modelSupport ? (
                    <>
                      <p className="explanation-note">
                        {modelSupport.runner_up_label
                          ? t("explanation.mlCompare", {
                              predicted: modelSupport.predicted_label,
                              runnerUp: modelSupport.runner_up_label,
                            })
                          : t("explanation.mlSingle", {
                              predicted: modelSupport.predicted_label,
                            })}
                      </p>
                      <div className="explanation-group">
                        <p className="explanation-label">{t("label.supportingFeatures")}</p>
                        <ul className="result-list">
                          {modelSupport.top_supporting_features.map((item) => (
                            <li key={`${item.feature}-${item.value}`}>
                              <span>
                                {getFeatureName(uiLanguage, item.feature)}:{" "}
                                {getFeatureValue(uiLanguage, item.value)}
                              </span>
                              <strong className="score-positive">
                                {formatSignedScore(item.support_score)}
                              </strong>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {modelSupport.top_counter_features.length > 0 ? (
                        <div className="explanation-group">
                          <p className="explanation-label">{t("label.counterFeatures")}</p>
                          <ul className="result-list">
                            {modelSupport.top_counter_features.map((item) => (
                              <li key={`${item.feature}-${item.value}`}>
                                <span>
                                  {getFeatureName(uiLanguage, item.feature)}:{" "}
                                  {getFeatureValue(uiLanguage, item.value)}
                                </span>
                                <strong className="score-negative">
                                  {formatSignedScore(item.support_score)}
                                </strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="explanation-note">{t("description.mlUnavailable")}</p>
                  )}
                </article>
              </div>

              {(user?.role === "doctor" || user?.role === "admin") && diagnosis ? (
                <article className="review-panel">
                  <div className="card-header">
                    <div>
                      <h3>{t("section.doctorReview")}</h3>
                      <p>
                        {diagnosis.is_confirmed
                          ? t("description.confirmedAs", {
                              condition: diagnosis.confirmed_condition ?? diagnosis.predicted_condition,
                            })
                          : t("description.notConfirmed")}
                      </p>
                    </div>
                    <span className={`status-chip ${diagnosis.is_confirmed ? "confirmed" : "pending"}`}>
                      {diagnosis.is_confirmed ? t("label.confirmed") : t("label.pending")}
                    </span>
                  </div>

                  {diagnosis.is_confirmed ? (
                    <ul className="text-list compact">
                      <li>
                        {t("label.confirmedCondition")}:{" "}
                        {diagnosis.confirmed_condition ?? diagnosis.predicted_condition}
                      </li>
                      <li>
                        {t("label.confirmedBy")}: {diagnosis.confirmed_by_user_id ?? "-"}
                      </li>
                      <li>
                        {t("label.confirmedAt")}: {formatDateTime(diagnosis.confirmed_at, uiLanguage)}
                      </li>
                      <li>
                        {t("label.doctorNotes")}: {diagnosis.doctor_notes ?? "-"}
                      </li>
                    </ul>
                  ) : null}

                  <form className="form-grid review-form" onSubmit={handleDiagnosisConfirm}>
                    <label>
                      {t("label.confirmedCondition")}
                      <input
                        value={confirmationForm.confirmed_condition}
                        onChange={(event) =>
                          setConfirmationForm({
                            ...confirmationForm,
                            confirmed_condition: event.target.value,
                          })
                        }
                        placeholder={t("placeholder.confirmedCondition")}
                      />
                    </label>
                    <label className="full-span">
                      {t("label.doctorNotes")}
                      <textarea
                        rows={3}
                        value={confirmationForm.doctor_notes}
                        onChange={(event) =>
                          setConfirmationForm({
                            ...confirmationForm,
                            doctor_notes: event.target.value,
                          })
                        }
                        placeholder={t("placeholder.doctorNotes")}
                      />
                    </label>
                    <button className="secondary-button" type="submit" disabled={confirmingDiagnosis}>
                      {confirmingDiagnosis ? t("action.confirmingDiagnosis") : t("action.confirmDiagnosis")}
                    </button>
                  </form>
                </article>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="sidebar">
          <section className="card sidebar-card">
            <h2>{t("section.workflow")}</h2>
            <ol className="steps">
              <li className={user ? "done" : ""}>{t("description.accountStep")}</li>
              <li className={patient ? "done" : ""}>{t("description.profileStep")}</li>
              <li className={diagnosis ? "done" : ""}>{t("description.assessmentStep")}</li>
            </ol>
          </section>

          <section className="card sidebar-card">
            <h2>{t("section.modelMetadata")}</h2>
            {modelMetadata ? (
              <>
                <ul className="text-list compact">
                  <li>
                    {t("metric.engine")}: {modelMetadata.engine_mode}
                  </li>
                  <li>
                    {t("label.modelReady")}:{" "}
                    {modelMetadata.ml_model_ready ? t("common.yes") : t("common.no")}
                  </li>
                  <li>
                    {t("label.rows")}: {modelMetadata.dataset_profile?.total_rows ?? "-"}
                  </li>
                  <li>
                    {t("label.labels")}: {modelMetadata.dataset_profile?.total_labels ?? "-"}
                  </li>
                  <li>
                    {t("label.train")}: {modelMetadata.metrics?.train_samples ?? "-"}
                  </li>
                  <li>
                    {t("label.test")}: {modelMetadata.metrics?.test_samples ?? "-"}
                  </li>
                  <li>
                    {t("label.cvFolds")}: {modelMetadata.evaluation_report?.folds ?? "-"}
                  </li>
                  <li>
                    {t("label.qualityWarnings")}:{" "}
                    {modelMetadata.data_quality_report?.warnings.length ?? "-"}
                  </li>
                  <li>
                    {t("label.holdoutAccuracy")}:{" "}
                    {modelMetadata.metrics?.metrics.accuracy !== undefined
                      ? formatPercent(modelMetadata.metrics.metrics.accuracy)
                      : "-"}
                  </li>
                  <li>
                    {t("label.cvAccuracy")}:{" "}
                    {modelMetadata.evaluation_report?.overall_accuracy !== undefined
                      ? formatPercent(modelMetadata.evaluation_report.overall_accuracy)
                      : "-"}
                  </li>
                </ul>
                {user?.role === "admin" ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleRetrain}
                    disabled={retraining}
                  >
                    {retraining ? t("action.retraining") : t("action.retrain")}
                  </button>
                ) : null}
              </>
            ) : (
              <p className="muted">{t("description.metadataUnavailable")}</p>
            )}
          </section>

          <section className="card sidebar-card">
            <h2>{t("section.diagnosisHistory")}</h2>
            {history.length > 0 ? (
              <ul className="history-list interactive-list">
                {history.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`history-button ${diagnosis?.id === item.id ? "active" : ""}`}
                      onClick={() => handleDiagnosisSelect(item)}
                    >
                      <strong>
                        {item.is_confirmed && item.confirmed_condition
                          ? item.confirmed_condition
                          : item.predicted_condition}
                      </strong>
                      <span>
                        {item.is_confirmed
                          ? t("label.confirmed")
                          : getOptionLabel(uiLanguage, "riskLevel", item.risk_level)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">{t("description.noResults")}</p>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
