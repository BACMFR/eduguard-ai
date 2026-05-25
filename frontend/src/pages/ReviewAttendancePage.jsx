import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  RefreshCcw,
  Save,
  UserCheck,
  UserX,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getAttendanceSession,
  updateAttendanceRecords,
} from "../api/attendance";

const attendanceStatuses = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

function getValue(value) {
  return value?.value || value || "";
}

function getLabel(value) {
  return value?.label || value?.value || value || "—";
}

function confidenceLabel(confidence) {
  if (confidence === null || confidence === undefined || confidence === "") {
    return "—";
  }

  const value = Number(confidence);

  if (Number.isNaN(value)) {
    return "—";
  }

  if (value <= 1) {
    return `${Math.round(value * 100)}%`;
  }

  return `${Math.round(value)}%`;
}

function confidenceClass(confidence) {
  const value = Number(confidence);

  if (Number.isNaN(value)) {
    return "confidence-empty";
  }

  const normalized = value <= 1 ? value : value / 100;

  if (normalized >= 0.8) {
    return "confidence-high";
  }

  if (normalized >= 0.6) {
    return "confidence-medium";
  }

  return "confidence-low";
}

function StatusBadge({ status }) {
  const value = getValue(status);

  return (
    <span className={`attendance-status-badge attendance-status-${value}`}>
      {getLabel(status)}
    </span>
  );
}

function DetectionBadge({ method }) {
  const value = getValue(method);
  const isAi = value === "system" || value === "camera";

  return (
    <span
      className={
        isAi
          ? "detection-badge detection-ai"
          : "detection-badge detection-manual"
      }
    >
      {isAi && <Bot size={13} />}
      {getLabel(method)}
    </span>
  );
}

function ReviewBadge({ status }) {
  const value = getValue(status);

  return (
    <span className={`review-badge review-${value}`}>{getLabel(status)}</span>
  );
}

function getValidationMessages(errors) {
  if (!errors) {
    return [];
  }

  return Object.values(errors).flat();
}

export default function ReviewAttendancePage() {
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  async function loadSession() {
    try {
      setLoading(true);
      setErrorMessage("");
      setValidationErrors([]);

      const data = await getAttendanceSession(id);

      setSession(data);

      setRecords(
        (data.records || []).map((record) => ({
          id: record.id,
          student: record.student,
          status: getValue(record.status),
          detection_method: getValue(record.detection_method) || "manual",
          confidence: record.confidence,
          review_status: getValue(record.review_status) || "pending",
          notes: record.notes || "",
        })),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load attendance session.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, [id]);

  const summary = useMemo(() => {
    const total = records.length;

    const present = records.filter(
      (record) => record.status === "present",
    ).length;
    const absent = records.filter(
      (record) => record.status === "absent",
    ).length;
    const late = records.filter((record) => record.status === "late").length;
    const excused = records.filter(
      (record) => record.status === "excused",
    ).length;

    const aiRecords = records.filter((record) => {
      const method = getValue(record.detection_method);
      return method === "system" || method === "camera";
    });

    const confidenceValues = aiRecords
      .map((record) => Number(record.confidence))
      .filter((value) => !Number.isNaN(value));

    const averageConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((sum, value) => sum + value, 0) /
          confidenceValues.length
        : null;

    return {
      total,
      present,
      absent,
      late,
      excused,
      aiCount: aiRecords.length,
      averageConfidence,
    };
  }, [records]);

  function updateRecord(recordId, field, value) {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId
          ? {
              ...record,
              [field]: value,
              review_status: "confirmed",
            }
          : record,
      ),
    );

    setSuccessMessage("");
    setErrorMessage("");
    setValidationErrors([]);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setValidationErrors([]);
      setSuccessMessage("");

      const payload = {
        records: records.map((record) => ({
          id: record.id,
          attendance_record_id: record.id,
          student_id: record.student?.id,
          status: record.status,
          detection_method: record.detection_method || "manual",
          review_status: "confirmed",
          notes: record.notes?.trim() ? record.notes.trim() : null,
        })),
      };

      await updateAttendanceRecords(id, payload);

      setSuccessMessage("Attendance records saved successfully.");
      await loadSession();
    } catch (error) {
      console.error("Attendance save error:", error.response?.data || error);

      const errors = error.response?.data?.errors;
      const message = error.response?.data?.message;
      const messages = getValidationMessages(errors);

      if (messages.length > 0) {
        setValidationErrors(messages);
        setErrorMessage(message || "Validation error.");
      } else {
        setErrorMessage(message || "Failed to save attendance records.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="main-content centered">
        <p>Loading attendance review...</p>
      </main>
    );
  }

  if (errorMessage && !session) {
    return (
      <main className="main-content centered">
        <p className="error-message">{errorMessage}</p>
      </main>
    );
  }

  return (
    <main className="main-content review-page">
      <header className="page-header compact-header">
        <div>
          <p className="eyebrow">Attendance Review</p>
          <h2>Review Session #{session?.id}</h2>
          <p className="page-description">
            {session?.classroom?.name || "No classroom"} ·{" "}
            {session?.session_date} · {session?.start_time}
          </p>
        </div>

        <div className="header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={loadSession}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Link className="secondary-button" to="/attendance">
            <ArrowLeft size={16} />
            Back
          </Link>

          <button
            className="primary-button"
            type="button"
            onClick={handleSubmit}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      {(successMessage || errorMessage) && (
        <section className="inline-messages">
          {successMessage && <p className="form-success">{successMessage}</p>}

          {errorMessage && (
            <div className="form-error">
              <strong>{errorMessage}</strong>

              {validationErrors.length > 0 && (
                <ul className="validation-list">
                  {validationErrors.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      <section className="review-summary-grid">
        <div className="review-summary-card">
          <UserCheck size={18} />
          <p>Present</p>
          <strong>{summary.present}</strong>
        </div>

        <div className="review-summary-card">
          <UserX size={18} />
          <p>Absent</p>
          <strong>{summary.absent}</strong>
        </div>

        <div className="review-summary-card">
          <CheckCircle2 size={18} />
          <p>Total</p>
          <strong>{summary.total}</strong>
        </div>

        <div className="review-summary-card ai-summary-card">
          <Bot size={18} />
          <p>AI Detected</p>
          <strong>{summary.aiCount}</strong>
          <span>Avg: {confidenceLabel(summary.averageConfidence)}</span>
        </div>
      </section>

      <section className="review-meta-grid">
        <div className="panel compact-panel">
          <div className="panel-header">
            <div>
              <h3>Session Info</h3>
              <p>Review before final save.</p>
            </div>
          </div>

          <div className="compact-info-grid">
            <div>
              <span>School</span>
              <strong>{session?.school?.name || "—"}</strong>
            </div>

            <div>
              <span>Classroom</span>
              <strong>{session?.classroom?.name || "—"}</strong>
            </div>

            <div>
              <span>Source</span>
              <strong>{getLabel(session?.source)}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{getLabel(session?.status)}</strong>
            </div>
          </div>
        </div>

        <div className="panel compact-panel ai-review-panel">
          <div className="ai-review-box compact-ai-box">
            <Bot size={28} />

            <div>
              <strong>{summary.aiCount} AI-generated records</strong>
              <p>
                Average confidence:{" "}
                <b>{confidenceLabel(summary.averageConfidence)}</b>. Confirm or
                correct records below.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel review-records-panel">
        <div className="panel-header">
          <div>
            <h3>Attendance Records</h3>
            <p>Update status or notes, then save the final attendance.</p>
          </div>
        </div>

        <form className="review-form" onSubmit={handleSubmit}>
          <div className="table-wrapper review-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Detected</th>
                  <th>Final Status</th>
                  <th>Method</th>
                  <th>Confidence</th>
                  <th>Review</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          {record.status === "present" ? (
                            <UserCheck size={16} />
                          ) : (
                            <UserX size={16} />
                          )}
                        </div>

                        <div>
                          <strong>{record.student?.full_name}</strong>
                          <span>{record.student?.student_number}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={record.status} />
                    </td>

                    <td>
                      <select
                        className={`attendance-status-select attendance-status-${record.status}`}
                        value={record.status}
                        onChange={(event) =>
                          updateRecord(record.id, "status", event.target.value)
                        }
                      >
                        {attendanceStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <DetectionBadge method={record.detection_method} />
                    </td>

                    <td>
                      <span
                        className={`confidence-pill ${confidenceClass(
                          record.confidence,
                        )}`}
                      >
                        {confidenceLabel(record.confidence)}
                      </span>
                    </td>

                    <td>
                      <ReviewBadge status={record.review_status} />
                    </td>

                    <td>
                      <input
                        className="table-input"
                        value={record.notes}
                        onChange={(event) =>
                          updateRecord(record.id, "notes", event.target.value)
                        }
                        placeholder="Notes"
                      />
                    </td>
                  </tr>
                ))}

                {records.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      No records found for this session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="review-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
