import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Layers, Plus, RefreshCcw, Search } from "lucide-react";
import { getClassrooms, getSchools } from "../api/classrooms";
import Can from "../components/Can";

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [schools, setSchools] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLookups() {
    const schoolsResponse = await getSchools({ per_page: 100 });
    setSchools(schoolsResponse.data || []);
  }

  async function loadClassrooms() {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {
        per_page: 100,
      };

      if (selectedSchoolId) {
        params.school_id = selectedSchoolId;
      }

      if (selectedGradeLevel) {
        params.grade_level = selectedGradeLevel;
      }

      const response = await getClassrooms(params);
      setClassrooms(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load classrooms.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        await loadLookups();
        await loadClassrooms();
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load classrooms page.");
      }
    }

    init();
  }, []);

  useEffect(() => {
    loadClassrooms();
  }, [selectedSchoolId, selectedGradeLevel]);

  const filteredClassrooms = useMemo(() => {
    if (!search.trim()) {
      return classrooms;
    }

    const keyword = search.toLowerCase();

    return classrooms.filter((classroom) => {
      return (
        classroom.name?.toLowerCase().includes(keyword) ||
        classroom.section?.toLowerCase().includes(keyword) ||
        classroom.school?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [classrooms, search]);

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Classroom Management</p>
          <h2>Classrooms</h2>
          <p className="page-description">
            View and manage classrooms, grade levels, and sections.
          </p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={loadClassrooms}>
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="manage_classrooms">
            <Link className="primary-button" to="/classrooms/create">
              <Plus size={16} />
              Add Classroom
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
              placeholder="Search classrooms..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={selectedSchoolId}
            onChange={(event) => setSelectedSchoolId(event.target.value)}
          >
            <option value="">All schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>

          <select
            value={selectedGradeLevel}
            onChange={(event) => setSelectedGradeLevel(event.target.value)}
          >
            <option value="">All grades</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map(
              (grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              )
            )}
          </select>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading classrooms...</p>
        ) : (
          <div className="table-wrapper page-table">
            <table>
              <thead>
                <tr>
                  <th>Classroom</th>
                  <th>School</th>
                  <th>Grade</th>
                  <th>Section</th>
                  <th>Capacity</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredClassrooms.map((classroom) => (
                  <tr key={classroom.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <Layers size={16} />
                        </div>

                        <div>
                          <strong>{classroom.name}</strong>
                          <span>
                            Grade {classroom.grade_level}
                            {classroom.section ? ` - ${classroom.section}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{classroom.school?.name || "—"}</td>
                    <td>{classroom.grade_level}</td>
                    <td>{classroom.section || "—"}</td>
                    <td>{classroom.capacity || "—"}</td>
                    <td>{classroom.students_count ?? 0}</td>
                    <td>{classroom.is_active ? "Active" : "Inactive"}</td>
                    <td>
                      <Link
                        className="table-action"
                        to={`/classrooms/${classroom.id}`}
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredClassrooms.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-cell">
                      No classrooms found.
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