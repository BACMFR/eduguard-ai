import apiClient from "./client";

export async function getSchools(params = {}) {
  const response = await apiClient.get("/schools", { params });
  return response.data;
}

export async function getClassrooms(params = {}) {
  const response = await apiClient.get("/classrooms", { params });
  return response.data;
}

export async function createCameraAttendanceSession(payload) {
  const formData = new FormData();

  formData.append("school_id", payload.school_id);
  formData.append("classroom_id", payload.classroom_id);
  formData.append("session_date", payload.session_date);
  formData.append("camera_source", payload.camera_source);

  if (payload.start_time) {
    formData.append("start_time", payload.start_time);
  }

  if (payload.end_time) {
    formData.append("end_time", payload.end_time);
  }

  if (payload.notes) {
    formData.append("notes", payload.notes);
  }

  if (payload.camera_source === "ip_webcam") {
    formData.append("ip_camera_url", payload.ip_camera_url);
  }

  if (payload.camera_source === "browser" && payload.image) {
    formData.append("image", payload.image);
  }

  const response = await apiClient.post("/attendance-sessions/camera", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}