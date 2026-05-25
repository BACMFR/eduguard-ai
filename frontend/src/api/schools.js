import apiClient from "./client";

export async function getSchools(params = {}) {
  const response = await apiClient.get("/schools", { params });
  return response.data;
}

export async function getSchool(id) {
  const response = await apiClient.get(`/schools/${id}`);
  return response.data.data;
}

export async function createSchool(payload) {
  const response = await apiClient.post("/schools", payload);
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

export async function getClassrooms(params = {}) {
  const response = await apiClient.get("/classrooms", { params });
  return response.data;
}

export async function getStudents(params = {}) {
  const response = await apiClient.get("/students", { params });
  return response.data;
}

export async function getAttendanceSessions(params = {}) {
  const response = await apiClient.get("/attendance-sessions", { params });
  return response.data;
}

export async function getLatestRiskScores(params = {}) {
  const response = await apiClient.get("/risk-scores/latest", { params });
  return response.data;
}