import apiClient from "./client";

export async function getSchools(params = {}) {
  const response = await apiClient.get("/schools", { params });
  return response.data;
}

export async function getClassrooms(params = {}) {
  const response = await apiClient.get("/classrooms", { params });
  return response.data;
}

export async function getDailyAttendanceReport(params = {}) {
  const response = await apiClient.get("/reports/daily-attendance", { params });
  return response.data.data;
}

export async function getWeeklyAttendanceReport(params = {}) {
  const response = await apiClient.get("/reports/weekly-attendance", { params });
  return response.data.data;
}

export async function getLatestRiskScores(params = {}) {
  const response = await apiClient.get("/risk-scores/latest", { params });
  return response.data;
}

export async function getAttendanceSessions(params = {}) {
  const response = await apiClient.get("/attendance-sessions", { params });
  return response.data;
}