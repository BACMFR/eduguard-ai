import apiClient from "./client";

export async function loginRequest(payload) {
  const response = await apiClient.post("/auth/login", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");
  return response.data.data;
}

export async function logoutRequest() {
  const response = await apiClient.post("/auth/logout");
  return response.data;
}