import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Plus, RefreshCcw, Search, UserRound } from "lucide-react";
import { getGuardians } from "../api/guardians";
import Can from "../components/Can";

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadGuardians() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getGuardians({
        per_page: 100,
      });

      setGuardians(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load guardians.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGuardians();
  }, []);

  const filteredGuardians = useMemo(() => {
    if (!search.trim()) {
      return guardians;
    }

    const keyword = search.toLowerCase();

    return guardians.filter((guardian) => {
      return (
        guardian.full_name?.toLowerCase().includes(keyword) ||
        guardian.first_name?.toLowerCase().includes(keyword) ||
        guardian.last_name?.toLowerCase().includes(keyword) ||
        guardian.national_id?.toLowerCase().includes(keyword) ||
        guardian.phone?.toLowerCase().includes(keyword) ||
        guardian.email?.toLowerCase().includes(keyword) ||
        guardian.relationship?.toLowerCase().includes(keyword)
      );
    });
  }, [guardians, search]);

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Support</p>
          <h2>Guardians</h2>
          <p className="page-description">
            Manage parents and guardians linked to student follow-up and school communication.
          </p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={loadGuardians}>
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="manage_students">
            <Link className="primary-button" to="/guardians/create">
              <Plus size={16} />
              Add Guardian
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
              placeholder="Search guardians..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading guardians...</p>
        ) : (
          <div className="table-wrapper page-table">
            <table>
              <thead>
                <tr>
                  <th>Guardian</th>
                  <th>National ID</th>
                  <th>Relationship</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                </tr>
              </thead>

              <tbody>
                {filteredGuardians.map((guardian) => (
                  <tr key={guardian.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <UserRound size={16} />
                        </div>

                        <div>
                          <strong>
                            {guardian.full_name ||
                              `${guardian.first_name || ""} ${guardian.last_name || ""}`}
                          </strong>
                          <span>Guardian #{guardian.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{guardian.national_id || "—"}</td>
                    <td>{guardian.relationship || "—"}</td>
                    <td>
                      {guardian.phone ? (
                        <span className="phone-cell">
                          <Phone size={13} />
                          {guardian.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{guardian.email || "—"}</td>
                    <td>{guardian.address || "—"}</td>
                  </tr>
                ))}

                {filteredGuardians.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-cell">
                      No guardians found.
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