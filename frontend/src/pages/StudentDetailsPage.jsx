import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  IdCard,
  ShieldAlert,
  UserRound,
  Camera,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getGrades,
  getRiskScores,
  getStudent,
  getStudentAttendanceHistory,
} from "../api/students";
import { useAuth } from "../context/AuthContext";
import StudentInterventionsPanel from "../components/StudentInterventionsPanel";

function RiskBadge({ level }) {
  const value = level?.value || level;

  return (
    <span className={`risk-badge risk-${value}`}>
      {level?.label || value || "—"}
    </span>
  );
}

function AttendanceStatusBadge({ status }) {
  const value = status?.value || status;

  return (
    <span className={`attendance-status-badge attendance-status-${value}`}>
      {status?.label || value || "—"}
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

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekStartDate() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);

  date.setDate(diff);

  return date.toISOString().slice(0, 10);
}

export default function StudentDetailsPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const canViewGrades = hasPermission("view_grades");
  const canViewRiskScores = hasPermission("view_risk_scores");
  const canViewAttendance = hasPermission("view_attendance");
  const canManageStudents = hasPermission("manage_students");

  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [riskScores, setRiskScores] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadStudentDetails() {
      try {
        setLoading(true);
        setErrorMessage("");

        const requests = [getStudent(id)];

        if (canViewGrades) {
          requests.push(
            getGrades({
              student_id: id,
              per_page: 20,
            }),
          );
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }

        if (canViewRiskScores) {
          requests.push(
            getRiskScores({
              student_id: id,
              per_page: 20,
            }),
          );
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }

        if (canViewAttendance) {
          requests.push(
            getStudentAttendanceHistory(id, {
              date_from: getWeekStartDate(),
              date_to: getTodayDate(),
            }),
          );
        } else {
          requests.push(Promise.resolve(null));
        }

        const [
          studentResponse,
          gradesResponse,
          riskResponse,
          attendanceResponse,
        ] = await Promise.all(requests);

        setStudent(studentResponse);
        setGrades(gradesResponse.data || []);
        setRiskScores(riskResponse.data || []);
        setAttendanceReport(attendanceResponse);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load student details.");
      } finally {
        setLoading(false);
      }
    }

    loadStudentDetails();
  }, [id, canViewGrades, canViewRiskScores, canViewAttendance]);

  const averageGrade = useMemo(() => {
    if (!grades.length) {
      return 0;
    }

    const total = grades.reduce((sum, grade) => {
      return sum + Number(grade.percentage || 0);
    }, 0);

    return Math.round((total / grades.length) * 100) / 100;
  }, [grades]);

  const latestRiskScore = riskScores[0];
  const attendanceSummary = attendanceReport?.summary || {};
  const attendanceRecords = attendanceReport?.records || [];

  if (loading) {
    return (
      <main className="main-content centered">
        <p>Loading student details...</p>
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
          <p className="eyebrow">Student Management</p>
          <h2>{student?.full_name}</h2>
          <p className="page-description">
            {student?.student_number} · {student?.school?.name || "No school"} ·{" "}
            {student?.classroom?.name || "No classroom"}
          </p>
        </div>

        <div className="header-actions">
          {canManageStudents && (
            <Link
              className="primary-button"
              to={`/students/${id}/face-registration`}
            >
              <Camera size={16} />
              Register Face
            </Link>
          )}

          <Link className="secondary-button" to="/students">
            <ArrowLeft size={16} />
            Back to Students
          </Link>
        </div>
      </header>

      <section className="details-summary-grid">
        <InfoCard
          title="Student Status"
          value={student?.status?.label || student?.status?.value || "—"}
          subtitle="current academic status"
          icon={UserRound}
        />

        <InfoCard
          title="Average Grade"
          value={canViewGrades ? `${averageGrade}%` : "—"}
          subtitle={canViewGrades ? "based on loaded grades" : "no permission"}
          icon={BookOpenCheck}
        />

        <InfoCard
          title="Attendance Rate"
          value={
            canViewAttendance
              ? `${attendanceSummary.attendance_rate ?? 0}%`
              : "—"
          }
          subtitle={
            canViewAttendance
              ? `${attendanceSummary.total_records ?? 0} attendance records`
              : "no permission"
          }
          icon={CalendarDays}
        />

        <InfoCard
          title="Latest Risk"
          value={canViewRiskScores ? (latestRiskScore?.score ?? "—") : "—"}
          subtitle={
            canViewRiskScores
              ? latestRiskScore?.level?.label || "no risk score"
              : "no permission"
          }
          icon={ShieldAlert}
        />

        <InfoCard
          title="Face Profile"
          value={student?.face_registered ? "Registered" : "Not Registered"}
          subtitle="computer vision enrollment"
          icon={IdCard}
        />
      </section>

      <section className="details-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Student Information</h3>
              <p>Basic identity and enrollment information.</p>
            </div>
          </div>

          <div className="details-info-list">
            <div>
              <span>Student Number</span>
              <strong>{student?.student_number || "—"}</strong>
            </div>

            <div>
              <span>National ID</span>
              <strong>{student?.national_id || "—"}</strong>
            </div>

            <div>
              <span>First Name</span>
              <strong>{student?.first_name || "—"}</strong>
            </div>

            <div>
              <span>Last Name</span>
              <strong>{student?.last_name || "—"}</strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>
                {student?.gender?.label || student?.gender?.value || "—"}
              </strong>
            </div>

            <div>
              <span>Birth Date</span>
              <strong>{student?.birth_date || "—"}</strong>
            </div>

            <div>
              <span>Enrollment Date</span>
              <strong>{student?.enrollment_date || "—"}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>School Assignment</h3>
              <p>Where this student belongs in the school structure.</p>
            </div>
          </div>

          <div className="details-info-list">
            <div>
              <span>School</span>
              <strong>{student?.school?.name || "—"}</strong>
            </div>

            <div>
              <span>School Code</span>
              <strong>{student?.school?.code || "—"}</strong>
            </div>

            <div>
              <span>Classroom</span>
              <strong>{student?.classroom?.name || "—"}</strong>
            </div>

            <div>
              <span>Grade Level</span>
              <strong>{student?.classroom?.grade_level || "—"}</strong>
            </div>

            <div>
              <span>Section</span>
              <strong>{student?.classroom?.section || "—"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Guardian Information</h3>
            <p>Parent or guardian contact details for student follow-up.</p>
          </div>
        </div>

        {student?.guardian ? (
          <div className="details-info-list">
            <div>
              <span>Guardian Name</span>
              <strong>
                {student.guardian.full_name ||
                  `${student.guardian.first_name || ""} ${
                    student.guardian.last_name || ""
                  }`}
              </strong>
            </div>

            <div>
              <span>Relationship</span>
              <strong>{student.guardian.relationship || "—"}</strong>
            </div>

            <div>
              <span>National ID</span>
              <strong>{student.guardian.national_id || "—"}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{student.guardian.phone || "—"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{student.guardian.email || "—"}</strong>
            </div>

            <div>
              <span>Address</span>
              <strong>{student.guardian.address || "—"}</strong>
            </div>
          </div>
        ) : (
          <div className="empty-cell">No guardian linked to this student.</div>
        )}
      </section>

      <section className="details-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Latest Grades</h3>
              <p>Recent academic performance for this student.</p>
            </div>
          </div>

          {canViewGrades ? (
            <div className="table-wrapper details-table">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Exam</th>
                    <th>Type</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.id}>
                      <td>
                        <strong>{grade.subject?.name || "—"}</strong>
                        <span>{grade.subject?.code || ""}</span>
                      </td>
                      <td>{grade.exam_name}</td>
                      <td>
                        {grade.grade_type?.label ||
                          grade.grade_type?.value ||
                          "—"}
                      </td>
                      <td>
                        <strong>{grade.percentage}%</strong>
                        <span>
                          {grade.score} / {grade.max_score}
                        </span>
                      </td>
                      <td>{grade.exam_date}</td>
                    </tr>
                  ))}

                  {grades.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-cell">
                        No grades found for this student.
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

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Risk Score History</h3>
              <p>Recent dropout risk calculations for this student.</p>
            </div>
          </div>

          {canViewRiskScores ? (
            <div className="table-wrapper details-table">
              <table>
                <thead>
                  <tr>
                    <th>Score</th>
                    <th>Level</th>
                    <th>Period</th>
                    <th>Summary</th>
                  </tr>
                </thead>

                <tbody>
                  {riskScores.map((risk) => (
                    <tr key={risk.id}>
                      <td>
                        <strong>{risk.score}</strong>
                      </td>
                      <td>
                        <RiskBadge level={risk.level} />
                      </td>
                      <td>
                        {risk.calculated_from} → {risk.calculated_to}
                      </td>
                      <td>{risk.summary}</td>
                    </tr>
                  ))}

                  {riskScores.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-cell">
                        No risk scores found for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-cell">
              You do not have permission to view risk scores.
            </div>
          )}
        </div>
      </section>

      {canViewRiskScores && <StudentInterventionsPanel studentId={id} />}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Attendance History</h3>
            <p>Student-level attendance history from recorded sessions.</p>
          </div>
          <CalendarDays size={18} />
        </div>

        {canViewAttendance ? (
          <>
            <section className="attendance-summary-grid">
              <div>
                <p>Total</p>
                <strong>{attendanceSummary.total_records ?? 0}</strong>
              </div>

              <div>
                <p>Present</p>
                <strong>{attendanceSummary.present_count ?? 0}</strong>
              </div>

              <div>
                <p>Absent</p>
                <strong>{attendanceSummary.absent_count ?? 0}</strong>
              </div>

              <div>
                <p>Late</p>
                <strong>{attendanceSummary.late_count ?? 0}</strong>
              </div>

              <div>
                <p>Excused</p>
                <strong>{attendanceSummary.excused_count ?? 0}</strong>
              </div>
            </section>

            <div className="table-wrapper details-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Classroom</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Review</th>
                    <th>Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.session?.session_date || "—"}</strong>
                        <span>
                          {record.session?.start_time || "—"} -{" "}
                          {record.session?.end_time || "—"}
                        </span>
                      </td>

                      <td>{record.classroom?.name || "—"}</td>

                      <td>
                        <AttendanceStatusBadge status={record.status} />
                      </td>

                      <td>
                        {record.detection_method?.label ||
                          record.detection_method?.value ||
                          "—"}
                      </td>

                      <td>
                        {record.review_status?.label ||
                          record.review_status?.value ||
                          "—"}
                      </td>

                      <td>{record.notes || "—"}</td>
                    </tr>
                  ))}

                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-cell">
                        No attendance history found for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-cell">
            You do not have permission to view attendance history.
          </div>
        )}
      </section>
    </main>
  );
}
