import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  RefreshCcw,
  School,
  UserX,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAttendanceSessions,
  getClassrooms,
  getDailyAttendanceReport,
  getLatestRiskScores,
  getSchools,
  getWeeklyAttendanceReport,
} from "../api/dashboard";
import { getInterventions } from "../api/interventions";
import { useAuth } from "../context/AuthContext";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);

  current.setDate(diff);

  return current.toISOString().slice(0, 10);
}

function safeArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function getValue(value) {
  return value?.value || value;
}

function hasStudentFaceProfile(student) {
  return Boolean(
    student?.face_registered ||
    student?.has_face_profile ||
    student?.face_profile_exists ||
    student?.faceProfile ||
    student?.face_profile?.id,
  );
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <article className="stat-card">
      <div className="stat-card-header">
        <div>
          <p className="stat-title">{title}</p>
          <h2>{value}</h2>
        </div>

        <div className="stat-icon">
          <Icon size={20} />
        </div>
      </div>

      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
    </article>
  );
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  function can(permission) {
    return typeof hasPermission === "function" && hasPermission(permission);
  }

  const canViewReports = can("view_reports");
  const canViewRiskScores = can("view_risk_scores");
  const canViewAttendance = can("view_attendance");

  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [riskScores, setRiskScores] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [interventions, setInterventions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLookups() {
    const [schoolsResponse, classroomsResponse] = await Promise.all([
      getSchools({ per_page: 100 }).catch((error) => {
        console.error("Schools lookup failed:", error);
        return { data: [] };
      }),
      getClassrooms({ per_page: 100 }).catch((error) => {
        console.error("Classrooms lookup failed:", error);
        return { data: [] };
      }),
    ]);

    const loadedSchools = safeArray(schoolsResponse);
    const loadedClassrooms = safeArray(classroomsResponse);

    setSchools(loadedSchools);
    setClassrooms(loadedClassrooms);

    const defaultSchoolId =
      user?.scope?.school_id || loadedSchools[0]?.id || "";

    const defaultClassroomId =
      loadedClassrooms.find((classroom) => {
        return (
          String(classroom.school?.id || classroom.school_id) ===
          String(defaultSchoolId)
        );
      })?.id ||
      loadedClassrooms[0]?.id ||
      "";

    setSelectedSchoolId((current) => current || String(defaultSchoolId));
    setSelectedClassroomId((current) => current || String(defaultClassroomId));

    return {
      schoolId: String(defaultSchoolId),
      classroomId: String(defaultClassroomId),
    };
  }

  async function loadDashboard(overrides = {}) {
    setLoading(true);
    setErrorMessage("");

    let schoolId = overrides.schoolId || selectedSchoolId;
    let classroomId = overrides.classroomId || selectedClassroomId;

    if (!schoolId || !classroomId) {
      const lookupDefaults = await loadLookups();
      schoolId = lookupDefaults.schoolId;
      classroomId = lookupDefaults.classroomId;
    }

    const date = todayDate();
    const weekStart = startOfWeek();

    const dailyRequest = canViewReports
      ? getDailyAttendanceReport({
          school_id: schoolId,
          classroom_id: classroomId,
          date,
        }).catch((error) => {
          console.error("Daily report failed:", error);
          return null;
        })
      : Promise.resolve(null);

    const weeklyRequest = canViewReports
      ? getWeeklyAttendanceReport({
          school_id: schoolId,
          week_start: weekStart,
        }).catch((error) => {
          console.error("Weekly report failed:", error);
          return null;
        })
      : Promise.resolve(null);

    const risksRequest = canViewRiskScores
      ? getLatestRiskScores({
          school_id: schoolId,
          per_page: 10,
        }).catch((error) => {
          console.error("Risk scores failed:", error);
          return { data: [] };
        })
      : Promise.resolve({ data: [] });

    const sessionsRequest = canViewAttendance
      ? getAttendanceSessions({
          school_id: schoolId,
          date,
          per_page: 50,
        }).catch((error) => {
          console.error("Attendance sessions failed:", error);
          return { data: [] };
        })
      : Promise.resolve({ data: [] });

    const interventionsRequest = canViewRiskScores
      ? getInterventions({
          school_id: schoolId,
          per_page: 100,
        }).catch((error) => {
          console.error("Interventions failed:", error);
          return { data: [] };
        })
      : Promise.resolve({ data: [] });

    const [
      dailyResponse,
      weeklyResponse,
      riskResponse,
      sessionsResponse,
      interventionsResponse,
    ] = await Promise.all([
      dailyRequest,
      weeklyRequest,
      risksRequest,
      sessionsRequest,
      interventionsRequest,
    ]);

    setDailyReport(dailyResponse);
    setWeeklyReport(weeklyResponse);
    setRiskScores(safeArray(riskResponse));
    setAttendanceSessions(safeArray(sessionsResponse));
    setInterventions(safeArray(interventionsResponse));

    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      try {
        const defaults = await loadLookups();
        await loadDashboard(defaults);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load dashboard.");
        setLoading(false);
      }
    }

    init();
  }, []);

  const availableClassrooms = useMemo(() => {
    if (!selectedSchoolId) {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      return (
        String(classroom.school?.id || classroom.school_id) ===
        String(selectedSchoolId)
      );
    });
  }, [classrooms, selectedSchoolId]);

  const attendanceSummary = dailyReport?.summary || {};
  const weeklySummary = weeklyReport?.summary || {};

  const statusDistribution =
    dailyReport?.charts?.status_distribution ||
    weeklyReport?.charts?.status_distribution ||
    [];

  const dailyAttendance = weeklyReport?.charts?.daily_attendance || [];

  const highRiskStudents = useMemo(() => {
    return riskScores.filter((risk) => {
      const level = getValue(risk.level);
      return level === "high" || level === "critical";
    });
  }, [riskScores]);

  const highRiskCount = highRiskStudents.length;

  const cameraSessions = useMemo(() => {
    return attendanceSessions.filter((session) => {
      const source = getValue(session.source);
      return source === "camera";
    });
  }, [attendanceSessions]);

  const aiDetectedToday = useMemo(() => {
    const presentStudents = dailyReport?.students?.present || [];

    return presentStudents.filter((student) => {
      return (
        student.detection_method === "system" ||
        student.detection_method === "camera"
      );
    }).length;
  }, [dailyReport]);

  const averageAiConfidence = useMemo(() => {
    const groups = dailyReport?.students || {};

    const allStudents = [
      ...(groups.present || []),
      ...(groups.absent || []),
      ...(groups.late || []),
      ...(groups.excused || []),
    ];

    const confidenceValues = allStudents
      .filter((student) => {
        return (
          student.detection_method === "system" ||
          student.detection_method === "camera"
        );
      })
      .map((student) => Number(student.confidence))
      .filter((value) => !Number.isNaN(value));

    if (!confidenceValues.length) {
      return "—";
    }

    const average =
      confidenceValues.reduce((sum, value) => sum + value, 0) /
      confidenceValues.length;

    return average <= 1
      ? `${Math.round(average * 100)}%`
      : `${Math.round(average)}%`;
  }, [dailyReport]);

  const pendingReviews = useMemo(() => {
    const sessions = dailyReport?.sessions || [];

    return sessions.filter((session) => {
      const status = getValue(session.status);
      return status === "draft" || status === "pending_review";
    }).length;
  }, [dailyReport]);

  const openInterventions = useMemo(() => {
    return interventions.filter((intervention) => {
      return getValue(intervention.status) === "open";
    }).length;
  }, [interventions]);

  const highPriorityInterventions = useMemo(() => {
    return interventions.filter((intervention) => {
      const priority = getValue(intervention.priority);
      return priority === "high" || priority === "critical";
    }).length;
  }, [interventions]);

  const completedInterventions = useMemo(() => {
    return interventions.filter((intervention) => {
      return getValue(intervention.status) === "completed";
    }).length;
  }, [interventions]);

  const highRiskStudentsWithoutIntervention = useMemo(() => {
    const studentIdsWithIntervention = new Set(
      interventions
        .map((intervention) => {
          return intervention.student?.id || intervention.student_id;
        })
        .filter(Boolean)
        .map(String),
    );

    return highRiskStudents.filter((risk) => {
      const studentId = risk.student?.id || risk.student_id;
      return studentId && !studentIdsWithIntervention.has(String(studentId));
    }).length;
  }, [highRiskStudents, interventions]);

  const studentsWithoutFaceProfile = useMemo(() => {
    const uniqueStudents = new Map();

    riskScores.forEach((risk) => {
      const student = risk.student;
      const studentId = student?.id || risk.student_id;

      if (studentId && student) {
        uniqueStudents.set(String(studentId), student);
      }
    });

    return Array.from(uniqueStudents.values()).filter((student) => {
      return !hasStudentFaceProfile(student);
    }).length;
  }, [riskScores]);

  function handleSchoolChange(event) {
    const nextSchoolId = event.target.value;

    const firstClassroomForSchool =
      classrooms.find((classroom) => {
        return (
          String(classroom.school?.id || classroom.school_id) ===
          String(nextSchoolId)
        );
      })?.id || "";

    setSelectedSchoolId(nextSchoolId);
    setSelectedClassroomId(String(firstClassroomForSchool));

    loadDashboard({
      schoolId: nextSchoolId,
      classroomId: String(firstClassroomForSchool),
    });
  }

  function handleClassroomChange(event) {
    const nextClassroomId = event.target.value;

    setSelectedClassroomId(nextClassroomId);

    loadDashboard({
      schoolId: selectedSchoolId,
      classroomId: nextClassroomId,
    });
  }

  if (loading && !dailyReport && !weeklyReport) {
    return (
      <div className="dashboard-page">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">EduGuard AI</p>
          <h2>Dashboard</h2>
          <p className="page-description">
            Live overview of attendance, AI recognition, risk scores,
            interventions, and school activity.
          </p>
        </div>

        <div className="header-actions">
          <select
            className="header-select"
            value={selectedSchoolId}
            onChange={handleSchoolChange}
          >
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>

          <select
            className="header-select"
            value={selectedClassroomId}
            onChange={handleClassroomChange}
          >
            {availableClassrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>

          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              loadDashboard({
                schoolId: selectedSchoolId,
                classroomId: selectedClassroomId,
              })
            }
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <section className="stats-grid">
        <StatCard
          title="Attendance Rate"
          value={`${attendanceSummary.attendance_rate ?? weeklySummary.attendance_rate ?? 0}%`}
          subtitle="Today / selected class"
          icon={CheckCircle2}
        />

        <StatCard
          title="Total Records"
          value={
            attendanceSummary.total_records ?? weeklySummary.total_records ?? 0
          }
          subtitle="Attendance records"
          icon={Users}
        />

        <StatCard
          title="High Risk Students"
          value={highRiskCount}
          subtitle="Latest risk calculations"
          icon={AlertTriangle}
        />

        <StatCard
          title="Schools"
          value={schools.length}
          subtitle="Accessible schools"
          icon={School}
        />
      </section>

      <section className="stats-grid ai-stats-grid">
        <StatCard
          title="AI Detected Today"
          value={aiDetectedToday}
          subtitle="Recognized by camera"
          icon={Bot}
        />

        <StatCard
          title="Avg AI Confidence"
          value={averageAiConfidence}
          subtitle="Face recognition confidence"
          icon={BarChart3}
        />

        <StatCard
          title="Camera Sessions"
          value={cameraSessions.length}
          subtitle="Created today"
          icon={Camera}
        />

        <StatCard
          title="Pending AI Reviews"
          value={pendingReviews}
          subtitle="Need teacher confirmation"
          icon={RefreshCcw}
        />
      </section>

      <section className="stats-grid ai-stats-grid">
        <StatCard
          title="Open Interventions"
          value={openInterventions}
          subtitle="Currently active cases"
          icon={ClipboardCheck}
        />

        <StatCard
          title="High Priority Interventions"
          value={highPriorityInterventions}
          subtitle="High or critical priority"
          icon={AlertTriangle}
        />

        <StatCard
          title="Completed Interventions"
          value={completedInterventions}
          subtitle="Resolved support actions"
          icon={CheckCircle2}
        />

        <StatCard
          title="High Risk Without Intervention"
          value={highRiskStudentsWithoutIntervention}
          subtitle="Based on latest risk list"
          icon={UserX}
        />
      </section>

      <section className="stats-grid ai-stats-grid">
        <StatCard
          title="Students Without Face Profile"
          value={studentsWithoutFaceProfile}
          subtitle="From available student data"
          icon={Camera}
        />
      </section>

      <section className="charts-grid dashboard-charts">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Weekly Attendance Trend</h3>
              <p>Present, absent, late, and excused records by day.</p>
            </div>
          </div>

          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <BarChart data={dailyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="present" stackId="a" />
                <Bar dataKey="absent" stackId="a" />
                <Bar dataKey="late" stackId="a" />
                <Bar dataKey="excused" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Status Distribution</h3>
              <p>Attendance distribution for selected data.</p>
            </div>
          </div>

          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="label"
                  outerRadius={82}
                  label
                >
                  {statusDistribution.map((entry) => (
                    <Cell key={entry.status || entry.label} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel dashboard-bottom">
        <div className="panel-header">
          <div>
            <h3>Latest Risk Scores</h3>
            <p>Students with latest calculated dropout risk.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Classroom</th>
                <th>Risk Score</th>
                <th>Level</th>
                <th>Calculated At</th>
              </tr>
            </thead>

            <tbody>
              {riskScores.map((risk) => (
                <tr key={risk.id}>
                  <td>
                    <div className="student-cell">
                      <div className="avatar">
                        <Users size={16} />
                      </div>

                      <div>
                        <strong>{risk.student?.full_name || "—"}</strong>
                        <span>{risk.student?.student_number || "—"}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    {risk.classroom?.name ||
                      risk.student?.classroom?.name ||
                      "—"}
                  </td>

                  <td>
                    <strong>{risk.score ?? "—"}</strong>
                  </td>

                  <td>
                    <span className={`risk-badge risk-${getValue(risk.level)}`}>
                      {risk.level?.label || risk.level || "—"}
                    </span>
                  </td>

                  <td>{risk.calculated_at || "—"}</td>
                </tr>
              ))}

              {riskScores.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    No risk scores found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
