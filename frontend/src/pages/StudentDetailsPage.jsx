import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  Camera,
  IdCard,
  Plus,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getGrades,
  getRiskScores,
  getStudent,
  getStudentAttendanceHistory,
} from "../api/students";
import StudentInterventionsPanel from "../components/StudentInterventionsPanel";
import { useAuth } from "../context/AuthContext";

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

function getValue(value) {
  return value?.value || value || "";
}

function getLabel(value) {
  return value?.label || value?.value || value || "—";
}

function safeArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function hasFaceProfile(student) {
  return Boolean(
    student?.face_registered ||
      student?.has_face_profile ||
      student?.face_profile_exists ||
      student?.face_profiles_count > 0 ||
      student?.faceProfile ||
      student?.face_profile?.id ||
      student?.face_profiles?.length
  );
}

function RiskBadge({ level }) {
  const value = getValue(level);
  return (
    <span className={`risk-badge risk-${value || "low"}`}>
      {getLabel(level)}
    </span>
  );
}

function AttendanceStatusBadge({ status }) {
  const value = getValue(status);
  return (
    <span className={`attendance-status-badge attendance-status-${value || "absent"}`}>
      {getLabel(status)}
    </span>
  );
}

function InfoCard({ title, value, subtitle, icon: Icon }) {
  return (
    <article className="info-card">
      <div className="info-card-icon">
        <Icon size={20} />
      </div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
    </article>
  );
}

export default function StudentDetailsPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();

  function can(permission) {
    return typeof hasPermission === "function" && hasPermission(permission);
  }

  const canViewGrades = can("view_grades");
  const canViewRiskScores = can("view_risk_scores");
  const canViewAttendance = can("view_attendance");
  const canManageStudents = can("manage_students");
  const canManageInterventions = can("calculate_risk_scores");

  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [riskScores, setRiskScores] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadStudentDetails() {
    try {
      setLoading(true);
      setErrorMessage("");

      const studentRequest = getStudent(id).catch((error) => {
        console.error("Student details failed:", error);
        throw error;
      });

      const gradesRequest = canViewGrades
        ? getGrades({ student_id: id, per_page: 20 }).catch((error) => {
            console.error("Grades failed:", error);
            return { data: [] };
          })
        : Promise.resolve({ data: [] });

      const risksRequest = canViewRiskScores
        ? getRiskScores({ student_id: id, per_page: 20 }).catch((error) => {
            console.error("Risk scores failed:", error);
            return { data: [] };
          })
        : Promise.resolve({ data: [] });

      const attendanceRequest = canViewAttendance
        ? getStudentAttendanceHistory(id, {
            date_from: getWeekStartDate(),
            date_to: getTodayDate(),
          }).catch((error) => {
            console.error("Attendance history failed:", error);
            return null;
          })
        : Promise.resolve(null);

      const [
        studentResponse,
        gradesResponse,
        riskResponse,
        attendanceResponse,
      ] = await Promise.all([
        studentRequest,
        gradesRequest,
        risksRequest,
        attendanceRequest,
      ]);

      setStudent(studentResponse);
      setGrades(safeArray(gradesResponse));
      setRiskScores(safeArray(riskResponse));
      setAttendanceReport(attendanceResponse);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 404) {
        setErrorMessage("Student was not found.");
      } else if (error.response?.status === 403) {
        setErrorMessage("You are not allowed to view this student.");
      } else {
        setErrorMessage("Failed to load student details.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudentDetails();
  }, [id, canViewGrades, canViewRiskScores, canViewAttendance]);

  const averageGrade = useMemo(() => {
    if (!grades.length) return 0;
    const total = grades.reduce((sum, grade) => {
      return sum + Number(grade.percentage || 0);
    }, 0);
    return Math.round((total / grades.length) * 100) / 100;
  }, [grades]);

  const latestRiskScore = riskScores[0];
  const attendanceSummary = attendanceReport?.summary || {};
  const attendanceRecords = attendanceReport?.records || [];
  const faceRegistered = hasFaceProfile(student);

  const attendanceRate = useMemo(() => {
    if (attendanceSummary.attendance_rate !== undefined) {
      return `${attendanceSummary.attendance_rate}%`;
    }

    const total = Number(attendanceSummary.total_records || 0);
    const present = Number(attendanceSummary.present_count || 0);

    if (!total) return "0%";
    return `${Math.round((present / total) * 100)}%`;
  }, [attendanceSummary]);

  if (loading) {
    return (
      <div className="details-page centered">
        <p>Loading student details...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="details-page centered">
        <section className="panel">
          <p className="error-message">{errorMessage}</p>
          <div className="form-actions">
            <Link className="secondary-button" to="/students">
              Back to Students
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="details-page student-details-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Management</p>
          <h2>{student?.full_name || "Student"}</h2>
          <p className="page-description">
            {student?.student_number || "—"} · {student?.school?.name || "No school"} ·{" "}
            {student?.classroom?.name || "No classroom"}
          </p>
        </div>

        <div className="header-actions">
          {canManageInterventions && (
            <Link
              className="primary-button"
              to={`/interventions/create?student_id=${student?.id || id}`}
            >
              <Plus size={16} />
              Add Intervention
            </Link>
          )}

          {canManageStudents && (
            <Link
              className="primary-button"
              to={`/students/${student?.id || id}/face-registration`}
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
          value={getLabel(student?.status)}
          subtitle="current academic status"
          icon={UserRound}
        />

        <InfoCard
          title="Average Grade"
          value={`${averageGrade}%`}
          subtitle="based on loaded grades"
          icon={BookOpenCheck}
        />

        <InfoCard
          title="Attendance Rate"
          value={attendanceRate}
          subtitle={`${attendanceSummary.total_records ?? 0} attendance records`}
          icon={CalendarDays}
        />

        <InfoCard
          title="Latest Risk"
          value={latestRiskScore ? latestRiskScore.score : "—"}
          subtitle={latestRiskScore ? getLabel(latestRiskScore.level) : "no risk score"}
          icon={ShieldAlert}
        />

        <InfoCard
          title="Face Profile"
          value={faceRegistered ? "Registered" : "Not Registered"}
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
              <strong>{getLabel(student?.gender)}</strong>
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
                  `${student.guardian.first_name || ""} ${student.guardian.last_name || ""}`}
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
          <p className="empty-cell">No guardian linked to this student.</p>
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
            <div className="details-table">
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
                      <td>{getLabel(grade.grade_type)}</td>
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
                      <td className="empty-cell" colSpan="5">
                        No grades found for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="scope-note">You do not have permission to view grades.</p>
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
            <div className="details-table">
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
                        {risk.calculated_from || "—"} → {risk.calculated_to || "—"}
                      </td>
                      <td>{risk.summary || "—"}</td>
                    </tr>
                  ))}

                  {riskScores.length === 0 && (
                    <tr>
                      <td className="empty-cell" colSpan="4">
                        No risk scores found for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="scope-note">You do not have permission to view risk scores.</p>
          )}
        </div>
      </section>

      {canViewRiskScores && <StudentInterventionsPanel studentId={student?.id || id} />}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Attendance History</h3>
            <p>Student-level attendance history from recorded sessions.</p>
          </div>
          <CalendarDays size={20} />
        </div>

        {canViewAttendance ? (
          <>
            <div className="attendance-summary-grid">
              <div>
                <span>Total</span>
                <strong>{attendanceSummary.total_records ?? 0}</strong>
              </div>

              <div>
                <span>Present</span>
                <strong>{attendanceSummary.present_count ?? 0}</strong>
              </div>

              <div>
                <span>Absent</span>
                <strong>{attendanceSummary.absent_count ?? 0}</strong>
              </div>

              <div>
                <span>Late</span>
                <strong>{attendanceSummary.late_count ?? 0}</strong>
              </div>

              <div>
                <span>Excused</span>
                <strong>{attendanceSummary.excused_count ?? 0}</strong>
              </div>
            </div>

            <div className="details-table">
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

                      <td>{getLabel(record.detection_method)}</td>

                      <td>{getLabel(record.review_status)}</td>

                      <td>{record.notes || "—"}</td>
                    </tr>
                  ))}

                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td className="empty-cell" colSpan="6">
                        No attendance history found for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="scope-note">
            You do not have permission to view attendance history.
          </p>
        )}
      </section>
    </div>
  );
}
