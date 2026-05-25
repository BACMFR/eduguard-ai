import apiClient from "./client";

export async function getLatestRiskScores(params = {}) {
  const response = await apiClient.get("/risk-scores/latest", { params });
  return response.data;
}

export async function calculateStudentRiskScore(payload) {
  const response = await apiClient.post("/risk-scores/calculate", payload);
  return response.data;
}

export async function calculateBulkRiskScores(payload) {
  const response = await apiClient.post("/risk-scores/calculate-bulk", payload);
  return response.data;
}

export async function getSchools(params = {}) {
  const response = await apiClient.get("/schools", { params });
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