import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  createIntervention,
  getLatestRiskScores,
  getStudents,
} from "../api/interventions";

const initialForm = {
  student_id: "",
  risk_score_id: "",
  type: "counseling",
  priority: "medium",
  status: "open",
  title: "",
  description: "",
  action_plan: "",
  due_date: "",
  outcome_notes: "",
};

function getValue(value) {
  return value?.value || value || "";
}

function getLabel(value) {
  return value?.label || value?.value || value || "—";
}

function getValidationMessages(errors) {
  if (!errors) {
    return [];
  }

  return Object.values(errors).flat();
}

export default function CreateInterventionPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get("student_id") || "";

  const [students, setStudents] = useState([]);
  const [riskScores, setRiskScores] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [studentsResponse, riskResponse] = await Promise.all([
          getStudents({ per_page: 100 }),
          getLatestRiskScores({ per_page: 100 }),
        ]);

        const loadedStudents = studentsResponse.data || [];
        const loadedRiskScores = riskResponse.data || [];

        setStudents(loadedStudents);
        setRiskScores(loadedRiskScores);

        if (preselectedStudentId) {
          const student = loadedStudents.find((item) => {
            return String(item.id) === String(preselectedStudentId);
          });

          const latestRisk = loadedRiskScores.find((risk) => {
            return String(risk.student?.id) === String(preselectedStudentId);
          });

          const level = getValue(latestRisk?.level);

          setForm((current) => ({
            ...current,
            student_id: preselectedStudentId,
            risk_score_id: latestRisk?.id ? String(latestRisk.id) : "",
            priority:
              level === "critical"
                ? "critical"
                : level === "high"
                  ? "high"
                  : current.priority,
            title: student
              ? `Follow-up intervention for ${student.full_name}`
              : current.title,
            description: latestRisk?.summary || current.description,
          }));
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load intervention form data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [preselectedStudentId]);

  const selectedStudent = useMemo(() => {
    return students.find((student) => {
      return String(student.id) === String(form.student_id);
    });
  }, [students, form.student_id]);

  const selectedStudentRiskScores = useMemo(() => {
    if (!form.student_id) {
      return riskScores;
    }

    return riskScores.filter((risk) => {
      return String(risk.student?.id) === String(form.student_id);
    });
  }, [riskScores, form.student_id]);

  const selectedRiskScore = useMemo(() => {
    return riskScores.find((risk) => {
      return String(risk.id) === String(form.risk_score_id);
    });
  }, [riskScores, form.risk_score_id]);

  function resetMessages() {
    setErrorMessage("");
    setValidationErrors([]);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    resetMessages();
  }

  function handleStudentChange(event) {
    const studentId = event.target.value;

    const latestRisk = riskScores.find((risk) => {
      return String(risk.student?.id) === String(studentId);
    });

    const student = students.find((item) => {
      return String(item.id) === String(studentId);
    });

    const level = getValue(latestRisk?.level);

    setForm((current) => ({
      ...current,
      student_id: studentId,
      risk_score_id: latestRisk?.id ? String(latestRisk.id) : "",
      priority:
        level === "critical"
          ? "critical"
          : level === "high"
            ? "high"
            : current.priority,
      title:
        student && !current.title
          ? `Follow-up intervention for ${student.full_name}`
          : current.title,
      description:
        latestRisk && !current.description
          ? latestRisk.summary ||
            "Student requires follow-up based on latest risk score."
          : current.description,
    }));

    resetMessages();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setValidationErrors([]);

      const payload = {
        student_id: Number(form.student_id),
        risk_score_id: form.risk_score_id ? Number(form.risk_score_id) : null,
        type: form.type,
        priority: form.priority,
        status: form.status,
        title: form.title.trim(),
        description: form.description.trim() || null,
        action_plan: form.action_plan.trim() || null,
        due_date: form.due_date || null,
        outcome_notes: form.outcome_notes.trim() || null,
      };

      await createIntervention(payload);

      navigate("/interventions");
    } catch (error) {
      console.error(
        "Intervention create error:",
        error.response?.data || error,
      );

      const errors = error.response?.data?.errors;
      const message = error.response?.data?.message;
      const messages = getValidationMessages(errors);

      if (messages.length > 0) {
        setValidationErrors(messages);
        setErrorMessage(message || "Validation error.");
      } else {
        setErrorMessage(message || "Failed to create intervention.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="main-content centered">
        <p>Loading intervention form...</p>
      </main>
    );
  }

  return (
    <main className="main-content form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Follow-up</p>
          <h2>Add Intervention</h2>
          <p className="page-description">
            Create a counseling, parent meeting, attendance follow-up, or
            support action for an at-risk student.
          </p>
        </div>

        <Link className="secondary-button" to="/interventions">
          <ArrowLeft size={16} />
          Back to Interventions
        </Link>
      </header>

      <section className="panel form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Student & Risk Context</h3>

            <div className="form-grid two">
              <label>
                Student
                <select
                  name="student_id"
                  value={form.student_id}
                  onChange={handleStudentChange}
                  required
                >
                  <option value="">Select student</option>

                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} - {student.student_number}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Risk Score
                <select
                  name="risk_score_id"
                  value={form.risk_score_id}
                  onChange={handleChange}
                >
                  <option value="">No risk score linked</option>

                  {selectedStudentRiskScores.map((risk) => (
                    <option key={risk.id} value={risk.id}>
                      Score {risk.score} - {getLabel(risk.level)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {(selectedStudent || selectedRiskScore) && (
              <div className="intervention-context-card">
                <div>
                  <span>Selected Student</span>
                  <strong>{selectedStudent?.full_name || "—"}</strong>
                </div>

                <div>
                  <span>School</span>
                  <strong>{selectedStudent?.school?.name || "—"}</strong>
                </div>

                <div>
                  <span>Classroom</span>
                  <strong>{selectedStudent?.classroom?.name || "—"}</strong>
                </div>

                <div>
                  <span>Risk</span>
                  <strong>
                    {selectedRiskScore
                      ? `${selectedRiskScore.score} - ${getLabel(
                          selectedRiskScore.level,
                        )}`
                      : "—"}
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Intervention Details</h3>

            <div className="form-grid two">
              <label>
                Type
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="counseling">Counseling</option>
                  <option value="parent_meeting">Parent Meeting</option>
                  <option value="home_visit">Home Visit</option>
                  <option value="academic_support">Academic Support</option>
                  <option value="attendance_follow_up">
                    Attendance Follow-up
                  </option>
                  <option value="financial_support">Financial Support</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label>
                Priority
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
            </div>

            <div className="form-grid two">
              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label>
                Due Date
                <input
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label>
              Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Counseling follow-up for attendance risk"
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Explain why this intervention is needed"
                rows="3"
              />
            </label>

            <label>
              Action Plan
              <textarea
                name="action_plan"
                value={form.action_plan}
                onChange={handleChange}
                placeholder="Define the steps to support this student"
                rows="3"
              />
            </label>

            <label>
              Outcome Notes
              <textarea
                name="outcome_notes"
                value={form.outcome_notes}
                onChange={handleChange}
                placeholder="Optional notes after the follow-up"
                rows="3"
              />
            </label>
          </div>

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

          <div className="form-actions">
            <Link className="secondary-button" to="/interventions">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create Intervention"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
