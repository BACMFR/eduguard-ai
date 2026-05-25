import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  RefreshCcw,
  Send,
  Smartphone,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  createCameraAttendanceSession,
  getClassrooms,
  getSchools,
} from "../api/cameraAttendance";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function addCacheBuster(url) {
  if (!url) {
    return "";
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_=${Date.now()}`;
}

export default function CameraAttendancePage() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [form, setForm] = useState({
    school_id: "",
    classroom_id: "",
    session_date: todayDate(),
    start_time: currentTime(),
    end_time: "",
    notes: "Camera attendance session",
    camera_source: "ip_webcam",
    ip_camera_url: "http://192.168.1.15:8080/shot.jpg",
  });

  const [cameraReady, setCameraReady] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState("");
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [ipPreviewUrl, setIpPreviewUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadLookups() {
      try {
        const [schoolsResponse, classroomsResponse] = await Promise.all([
          getSchools({ per_page: 100 }),
          getClassrooms({ per_page: 100 }),
        ]);

        setSchools(schoolsResponse.data || []);
        setClassrooms(classroomsResponse.data || []);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load schools and classrooms.");
      } finally {
        setLoading(false);
      }
    }

    loadLookups();

    return () => stopBrowserCamera();
  }, []);

  useEffect(() => {
    if (form.camera_source === "browser") {
      startBrowserCamera();
    } else {
      stopBrowserCamera();
      setCameraReady(false);
      setCapturedPreview("");
      setCapturedBlob(null);
    }
  }, [form.camera_source]);

  const availableClassrooms = useMemo(() => {
    if (!form.school_id) {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      return String(classroom.school?.id) === String(form.school_id);
    });
  }, [classrooms, form.school_id]);

  async function startBrowserCamera() {
    try {
      setErrorMessage("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
      setSuccessMessage("Laptop camera started.");
    } catch (error) {
      console.error(error);
      setCameraReady(false);
      setErrorMessage(
        "Laptop camera is not available. Use Phone IP Webcam instead."
      );
    }
  }

  function stopBrowserCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "school_id" ? { classroom_id: "" } : {}),
    }));

    setSuccessMessage("");
    setErrorMessage("");
  }

  function handleSourceChange(source) {
    setForm((current) => ({
      ...current,
      camera_source: source,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  }

  function refreshIpPreview() {
    if (!form.ip_camera_url.trim()) {
      setErrorMessage("Enter the IP Webcam snapshot URL first.");
      return;
    }

    setIpPreviewUrl(addCacheBuster(form.ip_camera_url.trim()));
    setSuccessMessage("IP Webcam preview refreshed.");
    setErrorMessage("");
  }

  function captureBrowserFrame() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setErrorMessage("Failed to capture camera frame.");
          return;
        }

        setCapturedBlob(blob);
        setCapturedPreview(URL.createObjectURL(blob));
        setSuccessMessage("Frame captured successfully.");
        setErrorMessage("");
      },
      "image/jpeg",
      0.92
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.school_id || !form.classroom_id) {
      setErrorMessage("Please select school and classroom.");
      return;
    }

    if (form.camera_source === "ip_webcam" && !form.ip_camera_url.trim()) {
      setErrorMessage("Please enter IP Webcam snapshot URL.");
      return;
    }

    if (form.camera_source === "browser" && !capturedBlob) {
      setErrorMessage("Please capture an image before creating the session.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      let imageFile = null;

      if (form.camera_source === "browser") {
        imageFile = new File([capturedBlob], "camera-attendance.jpg", {
          type: "image/jpeg",
        });
      }

      const response = await createCameraAttendanceSession({
        ...form,
        ip_camera_url: form.ip_camera_url.trim(),
        image: imageFile,
      });

      const sessionId = response.data?.id;

      if (sessionId) {
        navigate(`/attendance/${sessionId}/review`);
      } else {
        navigate("/attendance");
      }
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "Failed to create camera attendance session."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="centered">
        <p>Loading camera attendance...</p>
      </div>
    );
  }

  return (
    <div className="camera-page camera-attendance-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Computer Vision Attendance</p>
          <h2>Camera Attendance</h2>
          <p className="page-description">
            Use a phone IP camera or laptop camera to create an attendance
            session for review.
          </p>
        </div>

        <div className="header-actions">
          <Link className="secondary-button" to="/attendance">
            <ArrowLeft size={16} />
            Back to Attendance
          </Link>
        </div>
      </header>

      <section className="camera-layout improved-camera-layout">
        <section className="panel camera-panel">
          <div className="camera-source-tabs">
            <button
              type="button"
              className={
                form.camera_source === "ip_webcam"
                  ? "camera-source-tab active"
                  : "camera-source-tab"
              }
              onClick={() => handleSourceChange("ip_webcam")}
            >
              <Smartphone size={17} />
              Phone IP Webcam
            </button>

            <button
              type="button"
              className={
                form.camera_source === "browser"
                  ? "camera-source-tab active"
                  : "camera-source-tab"
              }
              onClick={() => handleSourceChange("browser")}
            >
              <Camera size={17} />
              Laptop Camera
            </button>
          </div>

          <div className="camera-stage">
            {form.camera_source === "ip_webcam" ? (
              <>
                {ipPreviewUrl ? (
                  <img
                    className="ip-camera-preview"
                    src={ipPreviewUrl}
                    alt="IP Webcam preview"
                    onError={() =>
                      setErrorMessage(
                        "Unable to preview IP Webcam. Check the URL and Wi-Fi connection."
                      )
                    }
                  />
                ) : (
                  <div className="camera-placeholder">
                    <Smartphone size={52} />
                    <strong>Phone IP Webcam Mode</strong>
                    <p>
                      Open IP Webcam on your phone, start server, then use the
                      snapshot URL ending with /shot.jpg.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {cameraReady ? (
                  <video ref={videoRef} autoPlay playsInline muted />
                ) : (
                  <div className="camera-placeholder">
                    <CameraOff size={52} />
                    <strong>Laptop camera is not ready</strong>
                    <p>Use Phone IP Webcam if your laptop camera is unavailable.</p>
                  </div>
                )}

                <canvas ref={canvasRef} hidden />
              </>
            )}
          </div>

          <div className="camera-actions improved-camera-actions">
            {form.camera_source === "ip_webcam" ? (
              <button
                className="secondary-button"
                type="button"
                onClick={refreshIpPreview}
              >
                <RefreshCcw size={16} />
                Refresh Phone Preview
              </button>
            ) : (
              <>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={startBrowserCamera}
                >
                  <RefreshCcw size={16} />
                  Restart Laptop Camera
                </button>

                <button
                  className="primary-button"
                  type="button"
                  onClick={captureBrowserFrame}
                  disabled={!cameraReady}
                >
                  <Camera size={16} />
                  Capture Frame
                </button>
              </>
            )}
          </div>
        </section>

        <section className="panel camera-side-panel">
          <div className="panel-header">
            <div>
              <h3>Session Details</h3>
              <p>Choose the classroom and camera source.</p>
            </div>
          </div>

          <form className="camera-form" onSubmit={handleSubmit}>
            <label>
              School
              <select
                name="school_id"
                value={form.school_id}
                onChange={handleChange}
                required
              >
                <option value="">Select school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Classroom
              <select
                name="classroom_id"
                value={form.classroom_id}
                onChange={handleChange}
                required
              >
                <option value="">Select classroom</option>
                {availableClassrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </label>

            {form.camera_source === "ip_webcam" && (
              <div className="ip-webcam-card">
                <label>
                  IP Webcam Snapshot URL
                  <input
                    name="ip_camera_url"
                    value={form.ip_camera_url}
                    onChange={handleChange}
                    placeholder="http://192.168.1.10:8080/shot.jpg"
                    required
                  />
                </label>

                <p>
                  Use the phone app URL with <strong>/shot.jpg</strong>. Example:
                  <br />
                  <code>http://192.168.1.10:8080/shot.jpg</code>
                </p>
              </div>
            )}

            <div className="form-grid two">
              <label>
                Date
                <input
                  type="date"
                  name="session_date"
                  value={form.session_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Start Time
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label>
              Notes
              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Camera attendance session"
              />
            </label>

            {form.camera_source === "browser" && capturedPreview && (
              <div className="captured-preview">
                <img src={capturedPreview} alt="Captured frame" />
                <span>Captured frame ready for AI recognition.</span>
              </div>
            )}

            {errorMessage && <p className="form-error">{errorMessage}</p>}
            {successMessage && <p className="form-success">{successMessage}</p>}

            <button className="primary-button" type="submit" disabled={saving}>
              <Send size={16} />
              {saving ? "Creating Session..." : "Create Attendance Session"}
            </button>
          </form>
        </section>
      </section>
    </div>
  );
}