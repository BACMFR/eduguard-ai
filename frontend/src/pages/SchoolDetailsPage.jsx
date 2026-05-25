import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Layers,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getAttendanceSessions,
  getClassrooms,
  getLatestRiskScores,
  getSchool,
  getStudents,
} from "../api/schools";
import { useAuth } from "../context/AuthContext";

function RiskBadge({ level }) {
  const value = level?.value || level;

  return (
    <span className={`risk-badge risk-${value}`}>{level?.label || value}</span>
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

export default function SchoolDetailsPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const canViewAttendance = hasPermission("view_attendance");
  const canViewRiskScores = hasPermission("view_risk_scores");

  const [school, setSchool] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [riskScores, setRiskScores] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSchoolDetails() {
      try {
        setLoading(true);
        setErrorMessage("");

        const requests = [
          getSchool(id),
          getClassrooms({
            school_id: id,
            per_page: 100,
          }),
          getStudents({
            school_id: id,
            per_page: 100,
          }),
        ];

        if (canViewAttendance) {
          requests.push(
            getAttendanceSessions({
              school_id: id,
              per_page: 10,
            }),
          );
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }

        if (canViewRiskScores) {
          requests.push(
            getLatestRiskScores({
              school_id: id,
              per_page: 10,
            }),
          );
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }

        const [
          schoolResponse,
          classroomsResponse,
          studentsResponse,
          attendanceResponse,
          riskResponse,
        ] = await Promise.all(requests);

        setSchool(schoolResponse);
        setClassrooms(classroomsResponse.data || []);
        setStudents(studentsResponse.data || []);
        setAttendanceSessions(attendanceResponse.data || []);
        setRiskScores(riskResponse.data || []);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load school details.");
      } finally {
        setLoading(false);
      }
    }

    loadSchoolDetails();
  }, [id, canViewAttendance, canViewRiskScores]);

  const activeStudentsCount = useMemo(() => {
    return students.filter((student) => {
      const status = student.status?.value || student.status;
      return status === "active";
    }).length;
  }, [students]);

  const highRiskCount = useMemo(() => {
    return riskScores.filter((risk) => {
      const level = risk.level?.value || risk.level;
      return level === "high" || level === "critical";
    }).length;
  }, [riskScores]);

  if (loading) {
    return (
      <main className="main-content centered">
        <p>Loading school details...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="main-content centered">
        <p className="error-message">{errorMessage}</p>
      </main>
    );
  }

  return (
    <main className="main-content details-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">School Management</p>
          <h2>{school?.name}</h2>
          <p className="page-description">
            {school?.governorate?.name || "No governorate"} ·{" "}
            {school?.district?.name || "No district"} ·{" "}
            {school?.code || "No code"}
          </p>
        </div>

        <Link className="secondary-button" to="/schools">
          <ArrowLeft size={16} />
          Back to Schools
        </Link>
      </header>

      <section className="details-summary-grid">
        <InfoCard
          title="Classrooms"
          value={classrooms.length}
          subtitle="classrooms in this school"
          icon={Layers}
        />

        <InfoCard
          title="Students"
          value={students.length}
          subtitle={`${activeStudentsCount} active students`}
          icon={Users}
        />

        <InfoCard
          title="Attendance Sessions"
          value={canViewAttendance ? attendanceSessions.length : "—"}
          subtitle={canViewAttendance ? "latest sessions" : "no permission"}
          icon={CalendarDays}
        />

        <InfoCard
          title="High Risk Students"
          value={canViewRiskScores ? highRiskCount : "—"}
          subtitle={
            canViewRiskScores ? "high or critical risk" : "no permission"
          }
          icon={ShieldAlert}
        />
      </section>

      <section className="details-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>School Information</h3>
              <p>Basic administrative information.</p>
            </div>
          </div>

          <div className="details-info-list">
            <div>
              <span>School Name</span>
              <strong>{school?.name}</strong>
            </div>

            <div>
              <span>Code</span>
              <strong>{school?.code || "—"}</strong>
            </div>

            <div>
              <span>Type</span>
              <strong>
                {school?.type?.label || school?.type?.value || "—"}
              </strong>
            </div>

            <div>
              <span>Gender Type</span>
              <strong>
                {school?.gender_type?.label ||
                  school?.gender_type?.value ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>Address</span>
              <strong>{school?.address || "—"}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{school?.phone || "—"}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Latest Attendance Sessions</h3>
              <p>Recent sessions linked to this school.</p>
            </div>
          </div>

          {canViewAttendance ? (
            <div className="table-wrapper details-table">
              <table>
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Classroom</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceSessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <strong>Session #{session.id}</strong>
                        <span>{session.start_time || "No start time"}</span>
                      </td>
                      <td>{session.classroom?.name || "—"}</td>
                      <td>{session.session_date}</td>
                      <td>
                        {session.status?.label || session.status?.value || "—"}
                      </td>
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
              <h3>Classrooms in this School</h3>
              <p>The school structure: grade levels and sections.</p>
            </div>
          </div>

          <div className="table-wrapper details-table">
            <table>
              <thead>
                <tr>
                  <th>Classroom</th>
                  <th>Grade</th>
                  <th>Section</th>
                  <th>Capacity</th>
                  <th>Students</th>
                </tr>
              </thead>

              <tbody>
                {classrooms.map((classroom) => (
                  <tr key={classroom.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <Layers size={16} />
                        </div>

                        <div>
                          <Link
                            className="inline-link"
                            to={`/classrooms/${classroom.id}`}
                          >
                            {classroom.name}
                          </Link>
                          <span>Classroom #{classroom.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>{classroom.grade_level}</td>
                    <td>{classroom.section || "—"}</td>
                    <td>{classroom.capacity || "—"}</td>
                    <td>{classroom.students_count ?? "—"}</td>
                  </tr>
                ))}

                {classrooms.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-cell">
                      No classrooms found for this school.
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
              <h3>Students in this School</h3>
              <p>Latest loaded students linked to this school.</p>
            </div>
          </div>

          <div className="table-wrapper details-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Classroom</th>
                  <th>Status</th>
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
                          <strong>{student.full_name}</strong>
                          <span>{student.student_number}</span>
                        </div>
                      </div>
                    </td>
                    <td>{student.classroom?.name || "—"}</td>
                    <td>
                      {student.status?.label || student.status?.value || "—"}
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty-cell">
                      No students found for this school.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {canViewRiskScores && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Latest Risk Scores</h3>
              <p>Recent dropout risk calculations for this school.</p>
            </div>
          </div>

          <div className="table-wrapper details-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Classroom</th>
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
                    <td>{risk.classroom?.name || "—"}</td>
                    <td>{risk.score}</td>
                    <td>
                      <RiskBadge level={risk.level} />
                    </td>
                    <td>{risk.summary}</td>
                  </tr>
                ))}

                {riskScores.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-cell">
                      No risk scores found for this school.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
