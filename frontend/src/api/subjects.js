import apiClient from "./client";

export async function getSubjects(params = {}) {
  const response = await apiClient.get("/subjects", { params });
  return response.data;
}

export async function getSubject(id) {
  const response = await apiClient.get(`/subjects/${id}`);
  return response.data.data;
}

export async function createSubject(payload) {
  const response = await apiClient.post("/subjects", payload);
  return response.data;
}

export async function updateSubject(id, payload) {
  const response = await apiClient.put(`/subjects/${id}`, payload);
  return response.data;
}