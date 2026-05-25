import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Eye,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAttendanceSessions,
  getClassrooms,
  getSchools,
} from "../api/attendance";
import { useAuth } from "../context/AuthContext";
import Can from "../components/Can";

function getValue(value) {
  return value?.value || value || "";
}

function getLabel(value) {
  return value?.label || value?.value || value || "—";
}

function StatusBadge({ status }) {
  const value = getValue(status);

  return (
    <span className={`status-badge attendance-${value}`}>
      {getLabel(status)}
    </span>
  );
}

function SourceBadge({ source }) {
  const value = getValue(source);

  return (
    <span
      className={
        value === "camera"
          ? "detection-badge detection-ai"
          : "detection-badge detection-manual"
      }
    >
      {getLabel(source)}
    </span>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();

  const userSchoolId = user?.scope?.school_id
    ? String(user.scope.school_id)
    : "";

  const [sessions, setSessions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState(userSchoolId);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLookups() {
    const [schoolsResponse, classroomsResponse] = await Promise.all([
      getSchools({ per_page: 100 }),
      getClassrooms({ per_page: 100 }),
    ]);

    const loadedSchools = schoolsResponse.data || [];
    const loadedClassrooms = classroomsResponse.data || [];

    setSchools(loadedSchools);
    setClassrooms(loadedClassrooms);

    const allowedSchoolId =
      userSchoolId ||
      String(loadedSchools[0]?.id || "");

    setSelectedSchoolId((current) => {
      if (userSchoolId) {
        return userSchoolId;
      }

      const exists = loadedSchools.some(
        (school) => String(school.id) === String(current)
      );

      return exists ? current : allowedSchoolId;
    });

    return {
      schoolId: allowedSchoolId,
      classrooms: loadedClassrooms,
    };
  }

  async function loadSessions(overrides = {}) {
    try {
      setLoading(true);
      setErrorMessage("");

      const schoolId =
        overrides.schoolId ||
        selectedSchoolId ||
        userSchoolId ||
        schools[0]?.id ||
        "";

      const classroomId =
        overrides.classroomId !== undefined
          ? overrides.classroomId
          : selectedClassroomId;

      const params = {
        per_page: 100,
      };

      if (schoolId) {
        params.school_id = schoolId;
      }

      if (classroomId) {
        params.classroom_id = classroomId;
      }

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const response = await getAttendanceSessions(params);

      setSessions(response.data || []);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 403) {
        setErrorMessage(
          "You are not allowed to view attendance sessions for the selected school. The filter was reset to your allowed school."
        );

        if (userSchoolId) {
          setSelectedSchoolId(userSchoolId);
        }
      } else {
        setErrorMessage("Failed to load attendance sessions.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const defaults = await loadLookups();
        await loadSessions({
          schoolId: defaults.schoolId,
          classroomId: "",
        });
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load attendance page.");
        setLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      loadSessions({
        schoolId: selectedSchoolId,
        classroomId: selectedClassroomId,
      });
    }
  }, [selectedSchoolId, selectedClassroomId, selectedStatus]);

  const availableClassrooms = useMemo(() => {
    if (!selectedSchoolId) {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      return String(classroom.school?.id) === String(selectedSchoolId);
    });
  }, [classrooms, selectedSchoolId]);

  const filteredSessions = useMemo(() => {
    if (!search.trim()) {
      return sessions;
    }

    const keyword = search.toLowerCase();

    return sessions.filter((session) => {
      return (
        session.school?.name?.toLowerCase().includes(keyword) ||
        session.classroom?.name?.toLowerCase().includes(keyword) ||
        session.session_date?.toLowerCase().includes(keyword) ||
        getLabel(session.source).toLowerCase().includes(keyword) ||
        getLabel(session.status).toLowerCase().includes(keyword)
      );
    });
  }, [sessions, search]);

  function handleSchoolChange(event) {
    const schoolId = event.target.value;

    setSelectedSchoolId(schoolId);
    setSelectedClassroomId("");
  }

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Attendance Management</p>
          <h2>Attendance Sessions</h2>
          <p className="page-description">
            Review manual and AI camera attendance sessions by school and classroom.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              loadSessions({
                schoolId: selectedSchoolId,
                classroomId: selectedClassroomId,
              })
            }
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="manage_attendance">
            <Link className="secondary-button" to="/attendance/camera">
              <Camera size={16} />
              Camera
            </Link>
          </Can>

          <Can permission="manage_attendance">
            <Link className="primary-button" to="/attendance/create">
              <Plus size={16} />
              Add Session
            </Link>
          </Can>
        </div>
      </header>

      <section className="panel list-panel">
        <div className="toolbar attendance-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search attendance sessions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={selectedSchoolId}
            onChange={handleSchoolChange}
            disabled={Boolean(userSchoolId)}
            title={
              userSchoolId
                ? "Your account is scoped to one school"
                : "Select school"
            }
          >
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
            {availableClassrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading attendance sessions...</p>
        ) : (
          <div className="table-wrapper page-table">
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>School</th>
                  <th>Classroom</th>
                  <th>Time</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Records</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <strong>Session #{session.id}</strong>
                      <span>{session.session_date}</span>
                    </td>

                    <td>{session.school?.name || "—"}</td>

                    <td>
                      <strong>{session.classroom?.name || "—"}</strong>
                      <span>
                        Grade {session.classroom?.grade_level || "—"} ·{" "}
                        {session.classroom?.section || "—"}
                      </span>
                    </td>

                    <td>
                      {session.start_time || "—"} - {session.end_time || "—"}
                    </td>

                    <td>
                      <SourceBadge source={session.source} />
                    </td>

                    <td>
                      <StatusBadge status={session.status} />
                    </td>

                    <td>{session.records?.length ?? session.records_count ?? "—"}</td>

                    <td>
                      <Link
                        className="table-action"
                        to={`/attendance/${session.id}/review`}
                      >
                        <Eye size={15} />
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-cell">
                      No attendance sessions found.
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