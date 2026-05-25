import apiClient from "./client";

export async function getClassrooms(params = {}) {
  const response = await apiClient.get("/classrooms", { params });
  return response.data;
}

export async function getClassroom(id) {
  const response = await apiClient.get(`/classrooms/${id}`);
  return response.data.data;
}

export async function createClassroom(payload) {
  const response = await apiClient.post("/classrooms", payload);
  return response.data;
}

export async function getSchools(params = {}) {
  const response = await apiClient.get("/schools", { params });
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

export async function getGrades(params = {}) {
  const response = await apiClient.get("/grades", { params });
  return response.data;
}

export async function getLatestRiskScores(params = {}) {
  const response = await apiClient.get("/risk-scores/latest", { params });
  return response.data;
}