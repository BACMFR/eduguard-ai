import apiClient from "./client";

export async function getGuardians(params = {}) {
  const response = await apiClient.get("/guardians", { params });
  return response.data;
}

export async function getGuardian(id) {
  const response = await apiClient.get(`/guardians/${id}`);
  return response.data.data;
}

export async function createGuardian(payload) {
  const response = await apiClient.post("/guardians", payload);
  return response.data;
}

export async function updateGuardian(id, payload) {
  const response = await apiClient.put(`/guardians/${id}`, payload);
  return response.data;
}