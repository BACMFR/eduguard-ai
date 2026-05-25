import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getIntervention,
  updateIntervention,
} from "../api/interventions";

const initialForm = {
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

export default function EditInterventionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [intervention, setIntervention] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    async function loadIntervention() {
      try {
        setLoading(true);
        setErrorMessage("");

        const loadedIntervention = await getIntervention(id);

        setIntervention(loadedIntervention);
        setForm({
          type: getValue(loadedIntervention.type) || "counseling",
          priority: getValue(loadedIntervention.priority) || "medium",
          status: getValue(loadedIntervention.status) || "open",
          title: loadedIntervention.title || "",
          description: loadedIntervention.description || "",
          action_plan: loadedIntervention.action_plan || "",
          due_date: loadedIntervention.due_date || "",
          outcome_notes: loadedIntervention.outcome_notes || "",
        });
      } catch (error) {
        console.error(error);

        if (error.response?.status === 403) {
          setErrorMessage("You are not allowed to edit this intervention.");
        } else if (error.response?.status === 404) {
          setErrorMessage("Intervention was not found.");
        } else {
          setErrorMessage("Failed to load intervention.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadIntervention();
  }, [id]);

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

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setValidationErrors([]);

      const payload = {
        type: form.type,
        priority: form.priority,
        status: form.status,
        title: form.title.trim(),
        description: form.description.trim() || null,
        action_plan: form.action_plan.trim() || null,
        due_date: form.due_date || null,
        outcome_notes: form.outcome_notes.trim() || null,
      };

      await updateIntervention(id, payload);
      navigate("/interventions");
    } catch (error) {
      console.error("Intervention update error:", error.response?.data || error);

      const errors = error.response?.data?.errors;
      const message = error.response?.data?.message;
      const messages = getValidationMessages(errors);

      if (messages.length > 0) {
        setValidationErrors(messages);
        setErrorMessage(message || "Validation error.");
      } else {
        setErrorMessage(message || "Failed to update intervention.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="form-page centered">
        <p>Loading intervention...</p>
      </div>
    );
  }

  if (errorMessage && !intervention) {
    return (
      <div className="form-page centered">
        <div className="panel">
          <p className="error-message">{errorMessage}</p>
          <div className="form-actions">
            <Link className="secondary-button" to="/interventions">
              Back to Interventions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Follow-up</p>
          <h2>Edit Intervention</h2>
          <p className="page-description">
            Update the status, priority, action plan, due date, and outcome notes.
          </p>
        </div>

        <div className="header-actions">
          <Link className="secondary-button" to="/interventions">
            <ArrowLeft size={16} />
            Back to Interventions
          </Link>
        </div>
      </header>

      <section className="form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Intervention Context</h3>

            <div className="intervention-context-card">
              <div>
                <span>Student</span>
                <strong>{intervention?.student?.full_name || "—"}</strong>
              </div>

              <div>
                <span>Student Number</span>
                <strong>{intervention?.student?.student_number || "—"}</strong>
              </div>

              <div>
                <span>School</span>
                <strong>{intervention?.school?.name || "—"}</strong>
              </div>

              <div>
                <span>Classroom</span>
                <strong>{intervention?.classroom?.name || "—"}</strong>
              </div>

              <div>
                <span>Linked Risk Score</span>
                <strong>
                  {intervention?.risk_score
                    ? `${intervention.risk_score.score} - ${getLabel(intervention.risk_score.level)}`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Completed At</span>
                <strong>{intervention?.completed_at || "—"}</strong>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Editable Details</h3>

            <div className="form-grid four">
              <label>
                Type
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="counseling">Counseling</option>
                  <option value="parent_meeting">Parent Meeting</option>
                  <option value="home_visit">Home Visit</option>
                  <option value="academic_support">Academic Support</option>
                  <option value="attendance_follow_up">Attendance Follow-up</option>
                  <option value="financial_support">Financial Support</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label>
                Priority
                <select name="priority" value={form.priority} onChange={handleChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>

              <label>
                Status
                <select name="status" value={form.status} onChange={handleChange}>
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
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
              />
            </label>

            <label>
              Action Plan
              <textarea
                name="action_plan"
                value={form.action_plan}
                onChange={handleChange}
                rows="3"
              />
            </label>

            <label>
              Outcome Notes
              <textarea
                name="outcome_notes"
                value={form.outcome_notes}
                onChange={handleChange}
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
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
