import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Edit3,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  deleteIntervention,
  getInterventions,
} from "../api/interventions";
import Can from "../components/Can";

function getValue(value) {
  return value?.value || value || "";
}

function getLabel(value) {
  return value?.label || value?.value || value || "—";
}

function safeData(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

function PriorityBadge({ priority }) {
  const value = getValue(priority);

  return (
    <span className={`priority-badge priority-${value || "low"}`}>
      {getLabel(priority)}
    </span>
  );
}

function InterventionStatusBadge({ status }) {
  const value = getValue(status);

  return (
    <span className={`intervention-status-badge intervention-${value || "open"}`}>
      {getLabel(status)}
    </span>
  );
}

function TypeBadge({ type }) {
  const value = getValue(type);

  return (
    <span className={`type-badge type-${value || "other"}`}>
      {getLabel(type)}
    </span>
  );
}

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadInterventions() {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {
        per_page: 100,
      };

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      if (selectedPriority) {
        params.priority = selectedPriority;
      }

      const response = await getInterventions(params);
      setInterventions(safeData(response));
    } catch (error) {
      console.error(error);

      if (error.response?.status === 403) {
        setErrorMessage("You are not allowed to view these interventions.");
      } else {
        setErrorMessage("Failed to load interventions.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterventions();
  }, [selectedStatus, selectedPriority]);

  async function handleDelete(intervention) {
    const title = intervention.title || `Intervention #${intervention.id}`;

    const confirmed = window.confirm(
      `Delete "${title}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(intervention.id);
      setErrorMessage("");

      await deleteIntervention(intervention.id);

      setInterventions((current) => {
        return current.filter((item) => item.id !== intervention.id);
      });
    } catch (error) {
      console.error(error);

      if (error.response?.status === 403) {
        setErrorMessage("You are not allowed to delete this intervention.");
      } else {
        setErrorMessage("Failed to delete intervention.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  const filteredInterventions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return interventions;
    }

    return interventions.filter((intervention) => {
      return (
        intervention.title?.toLowerCase().includes(keyword) ||
        intervention.student?.full_name?.toLowerCase().includes(keyword) ||
        intervention.student?.student_number?.toLowerCase().includes(keyword) ||
        intervention.school?.name?.toLowerCase().includes(keyword) ||
        intervention.classroom?.name?.toLowerCase().includes(keyword) ||
        getLabel(intervention.type).toLowerCase().includes(keyword) ||
        getLabel(intervention.priority).toLowerCase().includes(keyword) ||
        getLabel(intervention.status).toLowerCase().includes(keyword)
      );
    });
  }, [interventions, search]);

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
      highPriority: interventions.filter((item) => {
        const priority = getValue(item.priority);
        return priority === "high" || priority === "critical";
      }).length,
    };
  }, [interventions]);

  return (
    <div className="list-page interventions-compact-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Follow-up</p>
          <h2>Interventions</h2>
          <p className="page-description">
            Track counseling, parent meetings, academic support, and follow-up
            actions for at-risk students.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={loadInterventions}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="calculate_risk_scores">
            <Link className="primary-button" to="/interventions/create">
              <Plus size={16} />
              Add Intervention
            </Link>
          </Can>
        </div>
      </header>

      <section className="intervention-summary-grid">
        <article className="mini-stat">
          <p>Total</p>
          <strong>{summary.total}</strong>
        </article>

        <article className="mini-stat">
          <p>Open</p>
          <strong>{summary.open}</strong>
        </article>

        <article className="mini-stat">
          <p>In Progress</p>
          <strong>{summary.inProgress}</strong>
        </article>

        <article className="mini-stat">
          <p>Completed</p>
          <strong>{summary.completed}</strong>
        </article>

        <article className="mini-stat">
          <p>High / Critical</p>
          <strong>{summary.highPriority}</strong>
        </article>
      </section>

      <section className="panel interventions-compact-panel">
        <div className="intervention-toolbar interventions-compact-toolbar">
          <label className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student, title, school, status..."
            />
          </label>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(event) => setSelectedPriority(event.target.value)}
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading interventions...</p>
        ) : (
          <div className="interventions-card-list">
            {filteredInterventions.map((intervention) => (
              <article className="intervention-card" key={intervention.id}>
                <div className="intervention-card-main">
                  <div>
                    <p className="intervention-card-label">Intervention #{intervention.id}</p>
                    <h3>{intervention.title}</h3>
                  </div>

                  <div className="intervention-card-badges">
                    <TypeBadge type={intervention.type} />
                    <PriorityBadge priority={intervention.priority} />
                    <InterventionStatusBadge status={intervention.status} />
                  </div>
                </div>

                <div className="intervention-card-grid">
                  <div>
                    <span>Student</span>
                    <strong>{intervention.student?.full_name || "—"}</strong>
                    <small>{intervention.student?.student_number || "—"}</small>
                  </div>

                  <div>
                    <span>School / Class</span>
                    <strong>{intervention.school?.name || "—"}</strong>
                    <small>{intervention.classroom?.name || "—"}</small>
                  </div>

                  <div>
                    <span>Due Date</span>
                    <strong>{intervention.due_date || "—"}</strong>
                    <small>Target follow-up date</small>
                  </div>

                  <div>
                    <span>Risk</span>
                    <strong>
                      {intervention.risk_score
                        ? intervention.risk_score.score
                        : "—"}
                    </strong>
                    <small>
                      {intervention.risk_score
                        ? getLabel(intervention.risk_score.level)
                        : "No linked score"}
                    </small>
                  </div>

                  <div>
                    <span>Assigned To</span>
                    <strong>{intervention.assigned_to?.name || "—"}</strong>
                    <small>{intervention.assigned_to?.email || "Not assigned"}</small>
                  </div>
                </div>

                <Can permission="calculate_risk_scores">
                  <div className="intervention-card-actions">
                    <Link
                      className="secondary-button"
                      to={`/interventions/${intervention.id}/edit`}
                    >
                      <Edit3 size={15} />
                      Edit
                    </Link>

                    <button
                      className="danger-button"
                      type="button"
                      disabled={deletingId === intervention.id}
                      onClick={() => handleDelete(intervention)}
                    >
                      <Trash2 size={15} />
                      {deletingId === intervention.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </Can>
              </article>
            ))}

            {filteredInterventions.length === 0 && (
              <div className="empty-cell interventions-empty-card">
                <ClipboardCheck size={24} />
                <strong>No interventions found.</strong>
                <span>Try changing the filters or add a new intervention.</span>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
