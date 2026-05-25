import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, ImagePlus, Trash2, Upload } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteStudentFaceProfile,
  getStudentFaceProfiles,
  uploadStudentFaceProfiles,
} from "../api/faceProfiles";

export default function StudentFaceRegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [profiles, setProfiles] = useState([]);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadProfiles() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getStudentFaceProfiles(id);

      setStudent(response.student?.data || response.student || null);
      setProfiles(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load student face profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, [id]);

  const filePreviews = useMemo(() => {
    return selectedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [selectedFiles]);

  function handleFilesChange(event) {
    const files = Array.from(event.target.files || []);

    setSelectedFiles(files.slice(0, 5));
    setSuccessMessage("");
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setErrorMessage("Please select at least one face image.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await uploadStudentFaceProfiles(id, {
        images: selectedFiles,
        notes,
      });

      setSelectedFiles([]);
      setNotes("");
      setSuccessMessage("Face profile images uploaded successfully.");

      await loadProfiles();
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage("Failed to upload face profile images.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(profileId) {
    const confirmed = window.confirm("Delete this face profile image?");

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      await deleteStudentFaceProfile(id, profileId);
      setSuccessMessage("Face profile image deleted.");

      await loadProfiles();
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to delete face profile image.");
    }
  }

  if (loading) {
    return (
      <main className="main-content centered">
        <p>Loading face registration...</p>
      </main>
    );
  }

  return (
    <main className="main-content form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Computer Vision Enrollment</p>
          <h2>Face Registration</h2>
          <p className="page-description">
            Register face images for {student?.full_name || "this student"}.
          </p>
        </div>

        <div className="header-actions">
          <Link className="secondary-button" to={`/students/${id}`}>
            <ArrowLeft size={16} />
            Back to Student
          </Link>

          <button
            className="secondary-button"
            type="button"
            onClick={() => navigate("/students")}
          >
            Students
          </button>
        </div>
      </header>

      <section className="face-registration-layout">
        <section className="panel form-card">
          <form className="clean-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Upload Face Images</h3>

              <div className="face-upload-box">
                <Camera size={34} />

                <div>
                  <strong>Upload 1 to 5 clear face images</strong>
                  <p>
                    Use frontal, well-lit student images. Supported formats:
                    JPG, PNG, WEBP. Max size: 4MB per image.
                  </p>
                </div>

                <label className="file-upload-button">
                  <ImagePlus size={16} />
                  Select Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesChange}
                  />
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="face-preview-grid">
                  {filePreviews.map((preview) => (
                    <div key={preview.url} className="face-preview-card">
                      <img src={preview.url} alt={preview.file.name} />
                      <span>{preview.file.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <label>
                Notes
                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional notes about this enrollment"
                />
              </label>
            </div>

            {errorMessage && <p className="form-error">{errorMessage}</p>}
            {successMessage && <p className="form-success">{successMessage}</p>}

            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={saving}
              >
                <Upload size={16} />
                {saving ? "Uploading..." : "Register Face"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel face-profile-panel">
          <div className="panel-header">
            <div>
              <h3>Registered Face Images</h3>
              <p>Images already stored for this student.</p>
            </div>
          </div>

          {profiles.length > 0 ? (
            <div className="registered-face-grid">
              {profiles.map((profile) => (
                <div key={profile.id} className="registered-face-card">
                  <img src={profile.image_url} alt="Registered face" />

                  <div>
                    <strong>{profile.status}</strong>
                    <span>{profile.registered_at || profile.created_at}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(profile.id)}
                    title="Delete image"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-cell">
              No face images registered for this student yet.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
