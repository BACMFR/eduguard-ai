import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, RefreshCcw, Search } from "lucide-react";
import { getSubjects } from "../api/subjects";
import Can from "../components/Can";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSubjects() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getSubjects({
        per_page: 100,
      });

      setSubjects(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) {
      return subjects;
    }

    const keyword = search.toLowerCase();

    return subjects.filter((subject) => {
      return (
        subject.name?.toLowerCase().includes(keyword) ||
        subject.code?.toLowerCase().includes(keyword) ||
        subject.description?.toLowerCase().includes(keyword)
      );
    });
  }, [subjects, search]);

  return (
    <main className="main-content list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic Management</p>
          <h2>Subjects</h2>
          <p className="page-description">
            Manage academic subjects used in student grading and risk analysis.
          </p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={loadSubjects}>
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="manage_grades">
            <Link className="primary-button" to="/subjects/create">
              <Plus size={16} />
              Add Subject
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
              placeholder="Search subjects..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading subjects...</p>
        ) : (
          <div className="table-wrapper page-table">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <BookOpen size={16} />
                        </div>

                        <div>
                          <strong>{subject.name}</strong>
                          <span>Subject #{subject.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{subject.code || "—"}</td>
                    <td>{subject.description || "—"}</td>
                    <td>{subject.is_active ? "Active" : "Inactive"}</td>
                    <td>{subject.created_at || "—"}</td>
                  </tr>
                ))}

                {filteredSubjects.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-cell">
                      No subjects found.
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