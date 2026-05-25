import apiClient from "./client";

function getApiOrigin() {
  const baseURL = apiClient.defaults.baseURL || "";
  const fallbackURL = window.location.origin;

  try {
    return new URL(baseURL, fallbackURL).origin;
  } catch {
    return fallbackURL;
  }
}

function normalizeImageUrl(url) {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  if (url.startsWith("/storage/")) {
    return `${getApiOrigin()}${url}`;
  }

  if (url.startsWith("storage/")) {
    return `${getApiOrigin()}/${url}`;
  }

  return url;
}

function normalizeProfile(profile) {
  return {
    ...profile,
    image_url: normalizeImageUrl(profile.image_url || profile.image_path),
  };
}

function normalizeResponse(responseData) {
  return {
    ...responseData,
    data: Array.isArray(responseData.data)
      ? responseData.data.map(normalizeProfile)
      : [],
  };
}

export async function getStudentFaceProfiles(studentId) {
  const response = await apiClient.get(`/students/${studentId}/face-profiles`);
  return normalizeResponse(response.data);
}

export async function getStudentFaceProfileImageBlobUrl(studentId, faceProfileId) {
  const response = await apiClient.get(
    `/students/${studentId}/face-profiles/${faceProfileId}/image`,
    {
      responseType: "blob",
      headers: {
        Accept: "image/*",
      },
    }
  );

  return URL.createObjectURL(response.data);
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

  return normalizeResponse(response.data);
}

export async function deleteStudentFaceProfile(studentId, faceProfileId) {
  const response = await apiClient.delete(
    `/students/${studentId}/face-profiles/${faceProfileId}`
  );

  return response.data;
}
