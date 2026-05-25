import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenCheck, Plus, RefreshCcw, Search } from "lucide-react";
import {
  getClassrooms,
  getGrades,
  getSchools,
  getSubjects,
} from "../api/grades";
import Can from "../components/Can";

function GradeTypeBadge({ gradeType }) {
  const value = gradeType?.value || gradeType;

  return (
    <span className={`status-badge grade-type-${value}`}>
      {gradeType?.label || value}
    </span>
  );
}

export default function GradesPage() {
  const [grades, setGrades] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLookups() {
    const [schoolsResponse, classroomsResponse, subjectsResponse] =
      await Promise.all([
        getSchools({ per_page: 100 }),
        getClassrooms({ per_page: 100 }),
        getSubjects({ per_page: 100 }),
      ]);

    setSchools(schoolsResponse.data || []);
    setClassrooms(classroomsResponse.data || []);
    setSubjects(subjectsResponse.data || []);
  }

  async function loadGrades() {
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

      if (selectedSubjectId) {
        params.subject_id = selectedSubjectId;
      }

      const response = await getGrades(params);
      setGrades(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load grades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        await loadLookups();
        await loadGrades();
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load grades page.");
      }
    }

    init();
  }, []);

  useEffect(() => {
    loadGrades();
  }, [selectedSchoolId, selectedClassroomId, selectedSubjectId]);

  const filteredGrades = useMemo(() => {
    if (!search.trim()) {
      return grades;
    }

    const keyword = search.toLowerCase();

    return grades.filter((grade) => {
      return (
        grade.student?.full_name?.toLowerCase().includes(keyword) ||
        grade.student?.student_number?.toLowerCase().includes(keyword) ||
        grade.subject?.name?.toLowerCase().includes(keyword) ||
        grade.exam_name?.toLowerCase().includes(keyword) ||
        grade.classroom?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [grades, search]);

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic Performance</p>
          <h2>Grades</h2>
          <p className="page-description">
            View student grades and academic performance indicators.
          </p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={loadGrades}>
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="manage_grades">
            <Link className="primary-button" to="/grades/create">
              <Plus size={16} />
              Add Grade
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
              placeholder="Search grades..."
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

          <select
            value={selectedSubjectId}
            onChange={(event) => setSelectedSubjectId(event.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading grades...</p>
        ) : (
          <div className="table-wrapper page-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Exam</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredGrades.map((grade) => (
                  <tr key={grade.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <BookOpenCheck size={16} />
                        </div>

                        <div>
                          <strong>{grade.student?.full_name}</strong>
                          <span>{grade.student?.student_number}</span>
                        </div>
                      </div>
                    </td>

                    <td>{grade.subject?.name || "—"}</td>
                    <td>{grade.exam_name}</td>
                    <td>
                      <GradeTypeBadge gradeType={grade.grade_type} />
                    </td>
                    <td>
                      {grade.score} / {grade.max_score}
                    </td>
                    <td>
                      <strong>{grade.percentage}%</strong>
                    </td>
                    <td>{grade.exam_date}</td>
                  </tr>
                ))}

                {filteredGrades.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      No grades found.
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
