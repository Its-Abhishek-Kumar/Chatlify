import { create } from "zustand";
import { getSocket } from "../services/socket";
import { logout as logoutAPI } from "../services/auth";

type AuthState = {
  user: any;
  token: string | null;

  setAuth: (user: any, token: string) => void;
  hydrate: () => void;
  logout: () => void;
  updateUser: (user: any) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),

  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    set({ user, token });
  },

  hydrate: () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    set({ token, user });
  },

  logout: async () => {
    const socket = getSocket();
    if (socket) socket.disconnect();

    // Call backend to revoke the current active session
    try {
      await logoutAPI();
    } catch (err) {
      console.warn("Failed to revoke session on logout:", err);
    }

    const deviceId = localStorage.getItem("device_id");
    localStorage.clear();
    if (deviceId) {
      localStorage.setItem("device_id", deviceId);
    }

    set({ user: null, token: null });
  },

  updateUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  }
}));