import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Plus, RefreshCcw, Search, UserRound } from "lucide-react";
import { getClassrooms, getSchools, getStudents } from "../api/students";
import Can from "../components/Can";

function StatusBadge({ status }) {
  const value = status?.value || status;

  return (
    <span className={`status-badge status-${value}`}>
      {status?.label || value}
    </span>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLookups() {
    const [schoolsResponse, classroomsResponse] = await Promise.all([
      getSchools({ per_page: 100 }),
      getClassrooms({ per_page: 100 }),
    ]);

    setSchools(schoolsResponse.data || []);
    setClassrooms(classroomsResponse.data || []);
  }

  async function loadStudents() {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {
        per_page: 100,
      };

      if (selectedSchoolId) {
        params.school_id = selectedSchoolId;
      }

      if (selectedClassroomId) {
        params.classroom_id = selectedClassroomId;
      }

      const response = await getStudents(params);
      setStudents(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        await loadLookups();
        await loadStudents();
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load students page.");
      }
    }

    init();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [selectedSchoolId, selectedClassroomId]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) {
      return students;
    }

    const keyword = search.toLowerCase();

    return students.filter((student) => {
      return (
        student.full_name?.toLowerCase().includes(keyword) ||
        student.student_number?.toLowerCase().includes(keyword) ||
        student.national_id?.toLowerCase().includes(keyword) ||
        student.school?.name?.toLowerCase().includes(keyword) ||
        student.classroom?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [students, search]);

  return (
    <main className="main-content list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Management</p>
          <h2>Students</h2>
          <p className="page-description">View and manage student records.</p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={loadStudents}>
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="manage_students">
            <Link className="primary-button" to="/students/create">
              <Plus size={16} />
              Add Student
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
              placeholder="Search students..."
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
            value={selectedClassroomId}
            onChange={(event) => setSelectedClassroomId(event.target.value)}
          >
            <option value="">All classrooms</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading students...</p>
        ) : (
          <div className="table-wrapper page-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>School</th>
                  <th>Classroom</th>
                  <th>Status</th>
                  <th>Face Profile</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <UserRound size={16} />
                        </div>

                        <div>
                          <strong>{student.full_name}</strong>
                          <span>{student.student_number}</span>
                        </div>
                      </div>
                    </td>

                    <td>{student.school?.name || "—"}</td>
                    <td>{student.classroom?.name || "—"}</td>
                    <td>
                      <StatusBadge status={student.status} />
                    </td>
                    <td>
                      {student.face_registered
                        ? "Registered"
                        : "Not registered"}
                    </td>
                    <td>
                      <Link
                        className="table-action"
                        to={`/students/${student.id}`}
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-cell">
                      No students found.
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
