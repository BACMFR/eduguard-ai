import apiClient from "./client";

export async function getAttendanceSessions(params = {}) {
  const response = await apiClient.get("/attendance-sessions", { params });
  return response.data;
}

export async function getAttendanceSession(id) {
  const response = await apiClient.get(`/attendance-sessions/${id}`);
  return response.data.data;
}

export async function createAttendanceSession(payload) {
  const response = await apiClient.post("/attendance-sessions", payload);
  return response.data;
}

export async function updateAttendanceRecords(sessionId, payload) {
  const response = await apiClient.put(
    `/attendance-sessions/${sessionId}/records/bulk`,
    payload
  );

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