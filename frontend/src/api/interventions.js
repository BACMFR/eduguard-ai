import apiClient from "./client";

export async function getInterventions(params = {}) {
  const response = await apiClient.get("/interventions", { params });
  return response.data;
}

export async function getIntervention(id) {
  const response = await apiClient.get(`/interventions/${id}`);
  return response.data.data;
}

export async function createIntervention(payload) {
  const response = await apiClient.post("/interventions", payload);
  return response.data;
}

export async function updateIntervention(id, payload) {
  const response = await apiClient.put(`/interventions/${id}`, payload);
  return response.data;
}

export async function deleteIntervention(id) {
  const response = await apiClient.delete(`/interventions/${id}`);
  return response.data;
}

export async function getStudents(params = {}) {
  const response = await apiClient.get("/students", { params });
  return response.data;
}

export async function getLatestRiskScores(params = {}) {
  const response = await apiClient.get("/risk-scores/latest", { params });
  return response.data;
}

export async function getStudentInterventions(studentId) {
  const response = await apiClient.get("/interventions", {
    params: {
      student_id: studentId,
      per_page: 100,
    },
  });

  return response.data;
}
