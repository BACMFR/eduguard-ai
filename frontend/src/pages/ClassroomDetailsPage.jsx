import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getAttendanceSessions,
  getClassroom,
  getGrades,
  getLatestRiskScores,
  getStudents,
} from "../api/classrooms";
import { useAuth } from "../context/AuthContext";

function RiskBadge({ level }) {
  const value = level?.value || level;

  return (
    <span className={`risk-badge risk-${value}`}>
      {level?.label || value}
    </span>
  );
}

function InfoCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="info-card">
      <div className="info-card-icon">
        <Icon size={20} />
      </div>

      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
    </div>
  );
}

export default function ClassroomDetailsPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const canViewAttendance = hasPermission("view_attendance");
  const canViewGrades = hasPermission("view_grades");
  const canViewRiskScores = hasPermission("view_risk_scores");

  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [riskScores, setRiskScores] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadClassroomDetails() {
      try {
        setLoading(true);
        setErrorMessage("");

        const requests = [
          getClassroom(id),
          getStudents({
            classroom_id: id,
            per_page: 100,
          }),
        ];

        if (canViewAttendance) {
          requests.push(
            getAttendanceSessions({
              classroom_id: id,
              per_page: 10,
            })
          );
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }

        if (canViewGrades) {
          requests.push(
            getGrades({
              classroom_id: id,
              per_page: 10,
            })
          );
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }

        if (canViewRiskScores) {
          requests.push(
            getLatestRiskScores({
              classroom_id: id,
              per_page: 10,
            })
          );
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }

        const [
          classroomResponse,
          studentsResponse,
          attendanceResponse,
          gradesResponse,
          riskResponse,
        ] = await Promise.all(requests);

        setClassroom(classroomResponse);
        setStudents(studentsResponse.data || []);
        setAttendanceSessions(attendanceResponse.data || []);
        setGrades(gradesResponse.data || []);
        setRiskScores(riskResponse.data || []);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load classroom details.");
      } finally {
        setLoading(false);
      }
    }

    loadClassroomDetails();
  }, [id, canViewAttendance, canViewGrades, canViewRiskScores]);

  const activeStudentsCount = useMemo(() => {
    return students.filter((student) => {
      const status = student.status?.value || student.status;
      return status === "active";
    }).length;
  }, [students]);

  const averageGrade = useMemo(() => {
    if (!grades.length) {
      return 0;
    }

    const total = grades.reduce((sum, grade) => {
      return sum + Number(grade.percentage || 0);
    }, 0);

    return Math.round((total / grades.length) * 100) / 100;
  }, [grades]);

  const highRiskCount = useMemo(() => {
    return riskScores.filter((risk) => {
      const level = risk.level?.value || risk.level;
      return level === "high" || level === "critical";
    }).length;
  }, [riskScores]);

  if (loading) {
    return (
      <div className="centered">
        <p>Loading classroom details...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="centered">
        <p className="error-message">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="details-page classroom-details-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Classroom Management</p>
          <h2>{classroom?.name}</h2>
          <p className="page-description">
            {classroom?.school?.name || "No school"} · Grade{" "}
            {classroom?.grade_level || "—"} · Section{" "}
            {classroom?.section || "—"}
          </p>
        </div>

        <Link className="secondary-button" to="/classrooms">
          <ArrowLeft size={16} />
          Back to Classrooms
        </Link>
      </header>

      <section className="details-summary-grid">
        <InfoCard
          title="Students"
          value={students.length}
          subtitle={`${activeStudentsCount} active students`}
          icon={Users}
        />

        <InfoCard
          title="Capacity"
          value={classroom?.capacity || "—"}
          subtitle="maximum classroom capacity"
          icon={GraduationCap}
        />

        <InfoCard
          title="Average Grade"
          value={canViewGrades ? `${averageGrade}%` : "—"}
          subtitle={canViewGrades ? "latest loaded grades" : "no permission"}
          icon={BookOpenCheck}
        />

        <InfoCard
          title="High Risk Students"
          value={canViewRiskScores ? highRiskCount : "—"}
          subtitle={canViewRiskScores ? "high or critical risk" : "no permission"}
          icon={ShieldAlert}
        />
      </section>

      <section className="details-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Classroom Information</h3>
              <p>Basic classroom structure and school assignment.</p>
            </div>
          </div>

          <div className="details-info-list">
            <div>
              <span>Classroom Name</span>
              <strong>{classroom?.name}</strong>
            </div>

            <div>
              <span>School</span>
              <strong>{classroom?.school?.name || "—"}</strong>
            </div>

            <div>
              <span>Grade Level</span>
              <strong>{classroom?.grade_level || "—"}</strong>
            </div>

            <div>
              <span>Section</span>
              <strong>{classroom?.section || "—"}</strong>
            </div>

            <div>
              <span>Capacity</span>
              <strong>{classroom?.capacity || "—"}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{classroom?.is_active ? "Active" : "Inactive"}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Latest Attendance Sessions</h3>
              <p>Recent attendance sessions for this classroom.</p>
            </div>
          </div>

          {canViewAttendance ? (
            <div className="table-wrapper details-table">
              <table>
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceSessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <strong>Session #{session.id}</strong>
                        <span>{session.source?.label || session.source?.value}</span>
                      </td>
                      <td>{session.session_date}</td>
                      <td>
                        {session.start_time || "—"} - {session.end_time || "—"}
                      </td>
                      <td>{session.status?.label || session.status?.value || "—"}</td>
                    </tr>
                  ))}

                  {attendanceSessions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-cell">
                        No attendance sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-cell">
              You do not have permission to view attendance sessions.
            </div>
          )}
        </div>
      </section>

      <section className="details-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Students in this Classroom</h3>
              <p>Students assigned to this classroom.</p>
            </div>
          </div>

          <div className="table-wrapper details-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Face</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <UserRound size={16} />
                        </div>

                        <div>
                          <Link
                            className="inline-link"
                            to={`/students/${student.id}`}
                          >
                            {student.full_name}
                          </Link>
                          <span>{student.student_number}</span>
                        </div>
                      </div>
                    </td>

                    <td>{student.status?.label || student.status?.value || "—"}</td>
                    <td>
                      {student.face_registered ? "Registered" : "Not registered"}
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty-cell">
                      No students found for this classroom.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Latest Grades</h3>
              <p>Recent academic grades for this classroom.</p>
            </div>
          </div>

          {canViewGrades ? (
            <div className="table-wrapper details-table">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Exam</th>
                    <th>Score</th>
                  </tr>
                </thead>

                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.id}>
                      <td>
                        <strong>{grade.student?.full_name}</strong>
                        <span>{grade.student?.student_number}</span>
                      </td>
                      <td>{grade.subject?.name || "—"}</td>
                      <td>{grade.exam_name}</td>
                      <td>
                        <strong>{grade.percentage}%</strong>
                      </td>
                    </tr>
                  ))}

                  {grades.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-cell">
                        No grades found for this classroom.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-cell">
              You do not have permission to view grades.
            </div>
          )}
        </div>
      </section>

      {canViewRiskScores && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Latest Risk Scores</h3>
              <p>Recent dropout risk calculations for this classroom.</p>
            </div>
          </div>

          <div className="table-wrapper details-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Summary</th>
                </tr>
              </thead>

              <tbody>
                {riskScores.map((risk) => (
                  <tr key={risk.id}>
                    <td>
                      <strong>{risk.student?.full_name}</strong>
                      <span>{risk.student?.student_number}</span>
                    </td>
                    <td>{risk.score}</td>
                    <td>
                      <RiskBadge level={risk.level} />
                    </td>
                    <td>{risk.summary}</td>
                  </tr>
                ))}

                {riskScores.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty-cell">
                      No risk scores found for this classroom.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}