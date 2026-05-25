import apiClient from "./client";

export async function getStudentFaceProfiles(studentId) {
  const response = await apiClient.get(`/students/${studentId}/face-profiles`);
  return response.data;
}

export async function uploadStudentFaceProfiles(studentId, payload) {
  const formData = new FormData();

  payload.images.forEach((image) => {
    formData.append("images[]", image);
  });

  if (payload.notes) {
    formData.append("notes", payload.notes);
  }

  const response = await apiClient.post(
    `/students/${studentId}/face-profiles`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function deleteStudentFaceProfile(studentId, faceProfileId) {
  const response = await apiClient.delete(
    `/students/${studentId}/face-profiles/${faceProfileId}`
  );

  return response.data;
}