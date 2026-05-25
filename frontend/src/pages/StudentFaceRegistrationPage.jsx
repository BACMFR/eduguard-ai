import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  CameraOff,
  CheckCircle2,
  ImagePlus,
  Images,
  Info,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  deleteStudentFaceProfile,
  getStudentFaceProfileImageBlobUrl,
  getStudentFaceProfiles,
  uploadStudentFaceProfiles,
} from "../api/faceProfiles";

const MAX_IMAGES = 5;

export default function StudentFaceRegistrationPage() {
  const { id } = useParams();

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const registeredBlobUrlsRef = useRef([]);

  const [student, setStudent] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [activeMode, setActiveMode] = useState("camera");

  const [cameraStream, setCameraStream] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function revokeRegisteredBlobUrls() {
    registeredBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    registeredBlobUrlsRef.current = [];
  }

  async function loadProfiles() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getStudentFaceProfiles(id);
      const rawProfiles = response.data || [];

      revokeRegisteredBlobUrls();

      const profilesWithImages = await Promise.all(
        rawProfiles.map(async (profile) => {
          try {
            const blobUrl = await getStudentFaceProfileImageBlobUrl(id, profile.id);
            registeredBlobUrlsRef.current.push(blobUrl);

            return {
              ...profile,
              image_blob_url: blobUrl,
            };
          } catch (error) {
            console.error("Failed to load face image blob:", error);

            return {
              ...profile,
              image_blob_url: null,
            };
          }
        })
      );

      setStudent(response.student?.data || response.student || null);
      setProfiles(profilesWithImages);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load student face profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();

    return () => {
      revokeRegisteredBlobUrls();
    };
  }, [id]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const filePreviews = useMemo(() => {
    return selectedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [filePreviews]);

  const remainingSlots = Math.max(MAX_IMAGES - selectedFiles.length, 0);
  const hasRegisteredFaces = profiles.length > 0;

  function resetMessages() {
    setErrorMessage("");
    setSuccessMessage("");
    setCameraError("");
  }

  function handleFilesChange(event) {
    const incomingFiles = Array.from(event.target.files || []);

    if (incomingFiles.length === 0) {
      return;
    }

    setSelectedFiles((current) => {
      return [...current, ...incomingFiles].slice(0, MAX_IMAGES);
    });

    setActiveMode("review");
    resetMessages();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeSelectedFile(index) {
    setSelectedFiles((current) => {
      return current.filter((_, currentIndex) => currentIndex !== index);
    });

    resetMessages();
  }

  function clearSelection() {
    setSelectedFiles([]);
    setNotes("");
    resetMessages();
  }

  async function startCamera() {
    try {
      setCameraLoading(true);
      setActiveMode("camera");
      resetMessages();

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraStream(stream);
    } catch (error) {
      console.error(error);

      if (error.name === "NotAllowedError") {
        setCameraError("Camera permission was denied. Allow camera access and try again.");
      } else if (error.name === "NotFoundError") {
        setCameraError("No camera was found on this device.");
      } else {
        setCameraError("Failed to start camera.");
      }
    } finally {
      setCameraLoading(false);
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    setCameraStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function captureFromCamera() {
    resetMessages();

    if (!videoRef.current || !cameraStream) {
      setCameraError("Start the camera before capturing an image.");
      return;
    }

    if (selectedFiles.length >= MAX_IMAGES) {
      setCameraError(`You can register up to ${MAX_IMAGES} images at a time.`);
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Failed to capture image from camera.");
          return;
        }

        const file = new File(
          [blob],
          `student-${id}-face-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        setSelectedFiles((current) => [...current, file].slice(0, MAX_IMAGES));
        setActiveMode("review");
        setSuccessMessage("Image captured. Review it below, then register when ready.");
      },
      "image/jpeg",
      0.92
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setErrorMessage("Please upload or capture at least one face image.");
      setActiveMode("review");
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
      setSuccessMessage("Face images registered successfully.");
      setActiveMode("registered");

      await loadProfiles();
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage("Failed to upload face images.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(profileId) {
    const confirmed = window.confirm("Delete this face image?");

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      await deleteStudentFaceProfile(id, profileId);

      setSuccessMessage("Face image deleted.");
      await loadProfiles();
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to delete face image.");
    }
  }

  if (loading) {
    return (
      <div className="face-registration-v2 centered">
        <p>Loading face registration...</p>
      </div>
    );
  }

  return (
    <div className="face-registration-v2">
      <header className="face-reg-hero">
        <div className="face-reg-hero-main">
          <div className="face-reg-student-avatar">
            <UserRound size={30} />
          </div>

          <div>
            <p className="eyebrow">Computer Vision Enrollment</p>
            <h2>Face Registration</h2>
            <p>
              Register clear student face images using the device camera or image
              upload. Capture multiple angles for better recognition.
            </p>

            <div className="face-reg-student-meta">
              <span>{student?.full_name || "Student"}</span>
              <span>{student?.student_number || `ID ${id}`}</span>
              <span>{student?.school?.name || "School not loaded"}</span>
              <span>{student?.classroom?.name || "Classroom not loaded"}</span>
            </div>
          </div>
        </div>

        <div className="face-reg-hero-actions">
          <Link className="secondary-button" to={`/students/${id}`}>
            <ArrowLeft size={16} />
            Back to Student
          </Link>
        </div>
      </header>

      <section className="face-reg-status-grid">
        <article>
          <ShieldCheck size={20} />
          <div>
            <span>Registration Status</span>
            <strong>{hasRegisteredFaces ? "Registered" : "Not Registered"}</strong>
          </div>
        </article>

        <article>
          <Images size={20} />
          <div>
            <span>Registered Images</span>
            <strong>{profiles.length}</strong>
          </div>
        </article>

        <article>
          <ImagePlus size={20} />
          <div>
            <span>Selected Now</span>
            <strong>
              {selectedFiles.length} / {MAX_IMAGES}
            </strong>
          </div>
        </article>

        <article>
          <BadgeCheck size={20} />
          <div>
            <span>Recommended</span>
            <strong>3-5 images</strong>
          </div>
        </article>
      </section>

      <form className="face-reg-workspace" onSubmit={handleSubmit}>
        <section className="face-reg-capture-card">
          <div className="face-reg-tabs">
            <button
              type="button"
              className={activeMode === "camera" ? "active" : ""}
              onClick={() => setActiveMode("camera")}
            >
              <Camera size={16} />
              Camera Capture
            </button>

            <button
              type="button"
              className={activeMode === "upload" ? "active" : ""}
              onClick={() => setActiveMode("upload")}
            >
              <Upload size={16} />
              Upload Images
            </button>

            <button
              type="button"
              className={activeMode === "review" ? "active" : ""}
              onClick={() => setActiveMode("review")}
            >
              <CheckCircle2 size={16} />
              Review Selection
            </button>
          </div>

          <div className="face-reg-stage">
            {activeMode === "camera" && (
              <>
                {cameraStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="face-reg-video"
                  />
                ) : (
                  <div className="face-reg-placeholder">
                    <Camera size={56} />
                    <strong>Start the camera to capture a face image</strong>
                    <p>
                      Place the student in good lighting, keep the face centered,
                      and avoid masks, blur, or strong shadows.
                    </p>
                  </div>
                )}

                <div className="face-reg-stage-overlay">
                  <span>Face should be centered inside the frame</span>
                </div>
              </>
            )}

            {activeMode === "upload" && (
              <div className="face-reg-upload-zone">
                <Upload size={54} />
                <strong>Upload clear face images</strong>
                <p>
                  Choose up to {remainingSlots || 0} more image
                  {remainingSlots === 1 ? "" : "s"}. Use frontal, well-lit
                  photos for best recognition quality.
                </p>

                <label className="primary-button">
                  <Upload size={16} />
                  Select Images
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFilesChange}
                  />
                </label>
              </div>
            )}

            {activeMode === "review" && (
              <div className="face-reg-review-empty">
                {filePreviews.length > 0 ? (
                  <>
                    <CheckCircle2 size={54} />
                    <strong>{filePreviews.length} image(s) ready</strong>
                    <p>
                      Review the thumbnails below. Remove any blurry or incorrect
                      image before registering.
                    </p>
                  </>
                ) : (
                  <>
                    <ImagePlus size={54} />
                    <strong>No images selected yet</strong>
                    <p>
                      Capture from camera or upload images before registering the
                      face profile.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="face-reg-camera-actions">
            {activeMode === "camera" && (
              <>
                {!cameraStream ? (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={startCamera}
                    disabled={cameraLoading}
                  >
                    <Camera size={16} />
                    {cameraLoading ? "Starting Camera..." : "Start Camera"}
                  </button>
                ) : (
                  <>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={captureFromCamera}
                      disabled={selectedFiles.length >= MAX_IMAGES}
                    >
                      <ImagePlus size={16} />
                      Capture Image
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={stopCamera}
                    >
                      <CameraOff size={16} />
                      Stop Camera
                    </button>
                  </>
                )}
              </>
            )}

            {activeMode !== "camera" && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => setActiveMode("camera")}
              >
                <Camera size={16} />
                Use Camera Instead
              </button>
            )}
          </div>

          {cameraError && <p className="form-error">{cameraError}</p>}

          <div className="face-reg-selection-header">
            <div>
              <h3>Selected Images</h3>
              <p>
                {selectedFiles.length} of {MAX_IMAGES} images selected
              </p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={clearSelection}
              disabled={selectedFiles.length === 0}
            >
              <RefreshCcw size={16} />
              Clear
            </button>
          </div>

          {filePreviews.length > 0 ? (
            <div className="face-reg-preview-strip">
              {filePreviews.map((preview, index) => (
                <article key={`${preview.file.name}-${index}`}>
                  <img src={preview.url} alt={preview.file.name} />
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    title="Remove image"
                  >
                    <Trash2 size={15} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="face-reg-empty-selection">
              <ImagePlus size={22} />
              No captured or uploaded images yet.
            </div>
          )}
        </section>

        <aside className="face-reg-side-card">
          <section className="face-reg-submit-card">
            <div className="face-reg-side-title">
              <Sparkles size={20} />
              <div>
                <h3>Enrollment Review</h3>
                <p>Confirm quality before saving.</p>
              </div>
            </div>

            <ul className="face-reg-checklist">
              <li>
                <CheckCircle2 size={16} />
                Face is clear and centered.
              </li>
              <li>
                <CheckCircle2 size={16} />
                Lighting is bright and even.
              </li>
              <li>
                <CheckCircle2 size={16} />
                Avoid duplicate blurry images.
              </li>
              <li>
                <CheckCircle2 size={16} />
                Recommended: 3 to 5 images.
              </li>
            </ul>

            <label>
              Enrollment Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes about this registration"
                rows="4"
              />
            </label>

            <div className="inline-messages">
              {errorMessage && <p className="form-error">{errorMessage}</p>}
              {successMessage && <p className="form-success">{successMessage}</p>}
            </div>

            <button
              className="primary-button face-reg-submit-button"
              type="submit"
              disabled={saving || selectedFiles.length === 0}
            >
              <ImagePlus size={16} />
              {saving ? "Registering..." : "Register Selected Images"}
            </button>
          </section>

          <section className="face-reg-tips-card">
            <div className="face-reg-side-title">
              <Images size={20} />
              <div>
                <h3>Registered Images</h3>
                <p>Already stored for this student.</p>
              </div>
            </div>

            {profiles.length > 0 ? (
              <div className="face-reg-mini-grid">
                {profiles.slice(0, 4).map((profile) => {
                  const src = profile.image_blob_url || profile.image_url;

                  return (
                    <article key={profile.id}>
                      {src ? (
                        <img src={src} alt="Registered face" />
                      ) : (
                        <div>No image</div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="scope-note">No registered images yet.</p>
            )}
          </section>
        </aside>
      </form>

      <section className="face-reg-registered-card">
        <div className="panel-header">
          <div>
            <h3>Registered Face Images</h3>
            <p>Images already stored for this student.</p>
          </div>
        </div>

        {profiles.length > 0 ? (
          <div className="face-reg-registered-grid">
            {profiles.map((profile) => {
              const src = profile.image_blob_url || profile.image_url;

              return (
                <article key={profile.id}>
                  {src ? (
                    <img
                      src={src}
                      alt="Registered face"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="face-reg-image-missing">No image URL</div>
                  )}

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
                </article>
              );
            })}
          </div>
        ) : (
          <div className="face-reg-no-registered">
            <Images size={28} />
            <strong>No registered face images yet</strong>
            <p>Capture or upload images above, then click Register Selected Images.</p>
          </div>
        )}
      </section>
    </div>
  );
}
