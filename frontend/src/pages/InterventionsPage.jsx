import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Plus, RefreshCcw, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getInterventions } from "../api/interventions";
import Can from "../components/Can";

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

function TypeBadge({ type }) {
  const value = getValue(type);

  return <span className={`type-badge type-${value}`}>{getLabel(type)}</span>;
}

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  const [loading, setLoading] = useState(true);
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

      setInterventions(response.data || []);
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

  const filteredInterventions = useMemo(() => {
    if (!search.trim()) {
      return interventions;
    }

    const keyword = search.toLowerCase();

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
        (item) => getValue(item.status) === "in_progress",
      ).length,
      highPriority: interventions.filter((item) => {
        const priority = getValue(item.priority);
        return priority === "high" || priority === "critical";
      }).length,
    };
  }, [interventions]);

  return (
    <main className="main-content list-page">
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
        <div className="mini-stat">
          <p>Total</p>
          <strong>{summary.total}</strong>
        </div>

        <div className="mini-stat">
          <p>Open</p>
          <strong>{summary.open}</strong>
        </div>

        <div className="mini-stat">
          <p>In Progress</p>
          <strong>{summary.inProgress}</strong>
        </div>

        <div className="mini-stat">
          <p>High / Critical</p>
          <strong>{summary.highPriority}</strong>
        </div>
      </section>

      <section className="panel list-panel">
        <div className="toolbar intervention-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search interventions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

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
          <div className="table-wrapper page-table">
            <table>
              <thead>
                <tr>
                  <th>Intervention</th>
                  <th>Student</th>
                  <th>School / Class</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Risk</th>
                  <th>Assigned To</th>
                </tr>
              </thead>

              <tbody>
                {filteredInterventions.map((intervention) => (
                  <tr key={intervention.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <ClipboardCheck size={16} />
                        </div>

                        <div>
                          <strong>{intervention.title}</strong>
                          <span>Intervention #{intervention.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>{intervention.student?.full_name || "—"}</strong>
                      <span>{intervention.student?.student_number || "—"}</span>
                    </td>

                    <td>
                      <strong>{intervention.school?.name || "—"}</strong>
                      <span>{intervention.classroom?.name || "—"}</span>
                    </td>

                    <td>
                      <TypeBadge type={intervention.type} />
                    </td>

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

                    <td>{intervention.assigned_to?.name || "—"}</td>
                  </tr>
                ))}

                {filteredInterventions.length === 0 && (
                  <tr>
                    <td colSpan="9" className="empty-cell">
                      No interventions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
