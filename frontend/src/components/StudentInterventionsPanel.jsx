import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Plus, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { getStudentInterventions } from "../api/interventions";
import Can from "./Can";

function getValue(value) {
  return value?.value || value || "";
}

function getLabel(value) {
  return value?.label || value?.value || value || "—";
}

function PriorityBadge({ priority }) {
  const value = getValue(priority);

  return (
    <span className={`priority-badge priority-${value}`}>
      {getLabel(priority)}
    </span>
  );
}

function InterventionStatusBadge({ status }) {
  const value = getValue(status);

  return (
    <span className={`intervention-status-badge intervention-${value}`}>
      {getLabel(status)}
    </span>
  );
}

export default function StudentInterventionsPanel({ studentId }) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadInterventions() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getStudentInterventions(studentId);

      setInterventions(response.data || []);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 403) {
        setErrorMessage("You are not allowed to view interventions for this student.");
      } else {
        setErrorMessage("Failed to load student interventions.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (studentId) {
      loadInterventions();
    }
  }, [studentId]);

  const summary = useMemo(() => {
    return {
      total: interventions.length,
      open: interventions.filter((item) => getValue(item.status) === "open")
        .length,
      inProgress: interventions.filter(
        (item) => getValue(item.status) === "in_progress"
      ).length,
      completed: interventions.filter(
        (item) => getValue(item.status) === "completed"
      ).length,
    };
  }, [interventions]);

  return (
    <section className="panel student-interventions-panel">
      <div className="panel-header">
        <div>
          <h3>Student Interventions</h3>
          <p>Follow-up actions linked to this student.</p>
        </div>

        <div className="header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={loadInterventions}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="calculate_risk_scores">
            <Link
              className="primary-button"
              to={`/interventions/create?student_id=${studentId}`}
            >
              <Plus size={16} />
              Add Intervention
            </Link>
          </Can>
        </div>
      </div>

      <div className="student-intervention-summary">
        <div>
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>

        <div>
          <span>Open</span>
          <strong>{summary.open}</strong>
        </div>

        <div>
          <span>In Progress</span>
          <strong>{summary.inProgress}</strong>
        </div>

        <div>
          <span>Completed</span>
          <strong>{summary.completed}</strong>
        </div>
      </div>

      {errorMessage && <p className="form-error">{errorMessage}</p>}

      {loading ? (
        <p className="loading-text">Loading interventions...</p>
      ) : (
        <div className="table-wrapper student-interventions-table">
          <table>
            <thead>
              <tr>
                <th>Intervention</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Risk</th>
              </tr>
            </thead>

            <tbody>
              {interventions.map((intervention) => (
                <tr key={intervention.id}>
                  <td>
                    <div className="student-cell">
                      <div className="avatar">
                        <ClipboardCheck size={16} />
                      </div>

                      <div>
                        <strong>{intervention.title}</strong>
                        <span>#{intervention.id}</span>
                      </div>
                    </div>
                  </td>

                  <td>{getLabel(intervention.type)}</td>

                  <td>
                    <PriorityBadge priority={intervention.priority} />
                  </td>

                  <td>
                    <InterventionStatusBadge status={intervention.status} />
                  </td>

                  <td>{intervention.due_date || "—"}</td>

                  <td>
                    {intervention.risk_score ? (
                      <>
                        <strong>{intervention.risk_score.score}</strong>
                        <span>{getLabel(intervention.risk_score.level)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}

              {interventions.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No interventions linked to this student yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}