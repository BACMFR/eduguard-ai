import apiClient from "./client";

export async function getStudents(params = {}) {
  const response = await apiClient.get("/students", { params });
  return response.data;
}

export async function getStudent(id) {
  const response = await apiClient.get(`/students/${id}`);
  return response.data.data;
}

export async function createStudent(payload) {
  const response = await apiClient.post("/students", payload);
  return response.data;
}

export async function updateStudent(id, payload) {
  const response = await apiClient.put(`/students/${id}`, payload);
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

export async function getGuardians(params = {}) {
  const response = await apiClient.get("/guardians", { params });
  return response.data;
}

export async function getGrades(params = {}) {
  const response = await apiClient.get("/grades", { params });
  return response.data;
}

export async function getRiskScores(params = {}) {
  const response = await apiClient.get("/risk-scores", { params });
  return response.data;
}

export async function getStudentAttendanceHistory(id, params = {}) {
  const response = await apiClient.get(`/students/${id}/attendance-history`, {
    params,
  });

  return response.data.data;
}