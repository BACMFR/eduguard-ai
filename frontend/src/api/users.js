import apiClient from "./client";

export async function getUsers(params = {}) {
  const response = await apiClient.get("/users", { params });
  return response.data;
}

export async function getUser(id) {
  const response = await apiClient.get(`/users/${id}`);
  return response.data.data;
}

export async function createUser(payload) {
  const response = await apiClient.post("/users", payload);
  return response.data;
}

export async function updateUser(id, payload) {
  const response = await apiClient.put(`/users/${id}`, payload);
  return response.data;
}

export async function getRoles() {
  const response = await apiClient.get("/users/roles");
  return response.data.data;
}

export async function getSchools(params = {}) {
  const response = await apiClient.get("/schools", { params });
  return response.data;
}

export async function getGovernorates(params = {}) {
  const response = await apiClient.get("/governorates", { params });
  return response.data;
}

export async function getDistricts(params = {}) {
  const response = await apiClient.get("/districts", { params });
  return response.data;
}