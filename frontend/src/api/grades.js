import apiClient from "./client";

export async function getGrades(params = {}) {
  const response = await apiClient.get("/grades", { params });
  return response.data;
}

export async function createGrade(payload) {
  const response = await apiClient.post("/grades", payload);
  return response.data;
}

export async function getStudents(params = {}) {
  const response = await apiClient.get("/students", { params });
  return response.data;
}

export async function getSubjects(params = {}) {
  const response = await apiClient.get("/subjects", { params });
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