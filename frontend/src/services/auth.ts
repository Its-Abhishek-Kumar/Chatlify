import { api } from "./api";

export const signup = (data: any) =>
  api.post("/api/auth/signup", data);

export const login = (data: any) =>
  api.post("/api/auth/login", data);

export const forgotPassword = (data: any) =>
  api.post("/api/auth/forgot-password", data);

export const resetPassword = (data: any) =>
  api.post("/api/auth/reset-password", data);

export const logout = () =>
  api.post("/api/auth/logout");