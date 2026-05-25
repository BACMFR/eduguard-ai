import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Plus, RefreshCcw, School, Search } from "lucide-react";
import { getGovernorates, getSchools } from "../api/schools";
import Can from "../components/Can";

function SchoolTypeBadge({ type }) {
  const value = type?.value || type;

  return (
    <span className={`status-badge school-type-${value}`}>
      {type?.label || value}
    </span>
  );
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [governorates, setGovernorates] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedGovernorateId, setSelectedGovernorateId] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLookups() {
    const governoratesResponse = await getGovernorates({ per_page: 100 });
    setGovernorates(governoratesResponse.data || []);
  }

  async function loadSchools() {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {
        per_page: 100,
      };

      if (selectedGovernorateId) {
        params.governorate_id = selectedGovernorateId;
      }

      const response = await getSchools(params);
      setSchools(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load schools.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        await loadLookups();
        await loadSchools();
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load schools page.");
      }
    }

    init();
  }, []);

  useEffect(() => {
    loadSchools();
  }, [selectedGovernorateId]);

  const filteredSchools = useMemo(() => {
    if (!search.trim()) {
      return schools;
    }

    const keyword = search.toLowerCase();

    return schools.filter((school) => {
      return (
        school.name?.toLowerCase().includes(keyword) ||
        school.code?.toLowerCase().includes(keyword) ||
        school.governorate?.name?.toLowerCase().includes(keyword) ||
        school.district?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [schools, search]);

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">School Management</p>
          <h2>Schools</h2>
          <p className="page-description">
            View and manage schools across governorates and districts.
          </p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={loadSchools}>
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="manage_schools">
            <Link className="primary-button" to="/schools/create">
              <Plus size={16} />
              Add School
            </Link>
          </Can>
        </div>
      </header>

      <section className="panel list-panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search schools..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={selectedGovernorateId}
            onChange={(event) => setSelectedGovernorateId(event.target.value)}
          >
            <option value="">All governorates</option>
            {governorates.map((governorate) => (
              <option key={governorate.id} value={governorate.id}>
                {governorate.name}
              </option>
            ))}
          </select>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading schools...</p>
        ) : (
          <div className="table-wrapper page-table">
            <table>
              <thead>
                <tr>
                  <th>School</th>
                  <th>Governorate</th>
                  <th>District</th>
                  <th>Type</th>
                  <th>Gender Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <School size={16} />
                        </div>

                        <div>
                          <strong>{school.name}</strong>
                          <span>{school.code || "No code"}</span>
                        </div>
                      </div>
                    </td>

                    <td>{school.governorate?.name || "—"}</td>
                    <td>{school.district?.name || "—"}</td>
                    <td>
                      <SchoolTypeBadge type={school.type} />
                    </td>
                    <td>
                      {school.gender_type?.label ||
                        school.gender_type?.value ||
                        "—"}
                    </td>
                    <td>{school.is_active ? "Active" : "Inactive"}</td>
                    <td>
                      <Link
                        className="table-action"
                        to={`/schools/${school.id}`}
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredSchools.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      No schools found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
