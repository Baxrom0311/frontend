import { create } from "zustand";
import { authApi, tokenStore, type User } from "./api";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    role?: User["role"];
    preferred_language?: User["preferred_language"];
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  async init() {
    if (!tokenStore.access) {
      set({ initialized: true });
      return;
    }
    try {
      const user = await authApi.me();
      set({ user, initialized: true });
    } catch {
      tokenStore.clear();
      set({ user: null, initialized: true });
    }
  },
  async login(email, password) {
    set({ loading: true });
    try {
      const tokens = await authApi.login(email, password);
      tokenStore.set(tokens.access_token, tokens.refresh_token);
      const user = await authApi.me();
      set({ user });
      return user;
    } finally {
      set({ loading: false });
    }
  },
  async register(payload) {
    await authApi.register(payload);
  },
  async logout() {
    const refresh = tokenStore.refresh;
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      /* noop */
    }
    tokenStore.clear();
    set({ user: null });
  },
}));
