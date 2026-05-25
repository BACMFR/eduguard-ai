import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCcw, Search, ShieldAlert } from "lucide-react";
import { getLatestRiskScores } from "../api/riskScores";
import Can from "../components/Can";

const SCHOOL_ID = 1;

function RiskBadge({ level }) {
  const value = level?.value || level;

  return (
    <span className={`risk-badge risk-${value}`}>{level?.label || value}</span>
  );
}

export default function RiskScoresPage() {
  const [riskScores, setRiskScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadRiskScores(selectedLevel = level) {
    try {
      setLoading(true);

      const params = {
        school_id: SCHOOL_ID,
      };

      if (selectedLevel) {
        params.level = selectedLevel;
      }

      const response = await getLatestRiskScores(params);
      setRiskScores(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load risk scores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRiskScores("");
  }, []);

  const filteredRiskScores = useMemo(() => {
    if (!search.trim()) {
      return riskScores;
    }

    const keyword = search.toLowerCase();

    return riskScores.filter((risk) => {
      return (
        risk.student?.full_name?.toLowerCase().includes(keyword) ||
        risk.student?.student_number?.toLowerCase().includes(keyword) ||
        risk.classroom?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [riskScores, search]);

  const summary = useMemo(() => {
    return {
      total: riskScores.length,
      low: riskScores.filter((risk) => risk.level?.value === "low").length,
      medium: riskScores.filter((risk) => risk.level?.value === "medium")
        .length,
      high: riskScores.filter((risk) => risk.level?.value === "high").length,
      critical: riskScores.filter((risk) => risk.level?.value === "critical")
        .length,
    };
  }, [riskScores]);

  function handleLevelChange(event) {
    const selectedLevel = event.target.value;
    setLevel(selectedLevel);
    loadRiskScores(selectedLevel);
  }

  return (
    <main className="main-content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Early Warning System</p>
          <h2>Student Risk Scores</h2>
          <p className="page-description">
            Latest dropout risk results with explainable factors.
          </p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={() => loadRiskScores()}>
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="calculate_risk_scores">
            <Link className="primary-button" to="/risk-scores/calculate">
              <ShieldAlert size={16} />
              Calculate Risk
            </Link>
          </Can>
        </div>
      </header>

      <section className="risk-summary-grid">
        <div className="mini-stat">
          <p>Total</p>
          <strong>{summary.total}</strong>
        </div>

        <div className="mini-stat">
          <p>Low</p>
          <strong>{summary.low}</strong>
        </div>

        <div className="mini-stat">
          <p>Medium</p>
          <strong>{summary.medium}</strong>
        </div>

        <div className="mini-stat">
          <p>High</p>
          <strong>{summary.high}</strong>
        </div>

        <div className="mini-stat">
          <p>Critical</p>
          <strong>{summary.critical}</strong>
        </div>
      </section>

      <section className="panel risk-page-panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by student, number, or classroom..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select value={level} onChange={handleLevelChange}>
            <option value="">All levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {loading && <p className="loading-text">Loading risk scores...</p>}

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {!loading && !errorMessage && (
          <div className="table-wrapper large-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Classroom</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Risk Factors</th>
                  <th>Summary</th>
                </tr>
              </thead>

              <tbody>
                {filteredRiskScores.map((risk) => (
                  <tr key={risk.id}>
                    <td>
                      <strong>{risk.student?.full_name}</strong>
                      <span>{risk.student?.student_number}</span>
                    </td>

                    <td>{risk.classroom?.name || "—"}</td>

                    <td>
                      <strong>{risk.score}</strong>
                    </td>

                    <td>
                      <RiskBadge level={risk.level} />
                    </td>

                    <td>
                      <div className="risk-factors">
                        {risk.details?.map((detail) => (
                          <span key={detail.id}>
                            <ShieldAlert size={12} />
                            {detail.factor_label}: +{detail.impact_score}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>{risk.summary}</td>
                  </tr>
                ))}

                {filteredRiskScores.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-cell">
                      <AlertTriangle size={20} />
                      No matching risk scores found.
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
