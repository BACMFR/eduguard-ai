import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, RefreshCcw } from "lucide-react";
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
  getClassrooms,
  getDailyAttendanceReport,
  getSchools,
  getWeeklyAttendanceReport,
} from "../api/reports";
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
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

const initialFilters = {
  school_id: "",
  classroom_id: "",
  date: todayDate(),
  week_start: startOfWeek(),
};

function ReportStatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <article className="mini-stat">
      {Icon && (
        <div className="stat-icon">
          <Icon size={18} />
        </div>
      )}
      <p>{title}</p>
      <strong>{value}</strong>
      {subtitle && <span>{subtitle}</span>}
    </article>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();

  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [filters, setFilters] = useState(initialFilters);

  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);

  const [loadingLookups, setLoadingLookups] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLookups() {
    try {
      setLoadingLookups(true);

      const [schoolsResponse, classroomsResponse] = await Promise.all([
        getSchools({ per_page: 100 }).catch((error) => {
          console.error("Reports schools lookup failed:", error);
          return { data: [] };
        }),
        getClassrooms({ per_page: 100 }).catch((error) => {
          console.error("Reports classrooms lookup failed:", error);
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
          return String(classroom.school?.id || classroom.school_id) === String(defaultSchoolId);
        })?.id || "";

      setFilters((current) => ({
        ...current,
        school_id: current.school_id || String(defaultSchoolId),
        classroom_id: current.classroom_id || String(defaultClassroomId),
      }));

      return {
        school_id: String(defaultSchoolId),
        classroom_id: String(defaultClassroomId),
      };
    } finally {
      setLoadingLookups(false);
    }
  }

  async function loadReports(overrides = {}) {
    try {
      setLoadingReports(true);
      setErrorMessage("");

      const nextFilters = {
        ...filters,
        ...overrides,
      };

      const baseParams = {};

      if (nextFilters.school_id) {
        baseParams.school_id = nextFilters.school_id;
      }

      if (nextFilters.classroom_id) {
        baseParams.classroom_id = nextFilters.classroom_id;
      }

      const dailyRequest = getDailyAttendanceReport({
        ...baseParams,
        date: nextFilters.date,
      }).catch((error) => {
        console.error("Daily report failed:", error);
        return null;
      });

      const weeklyRequest = getWeeklyAttendanceReport({
        ...baseParams,
        week_start: nextFilters.week_start,
      }).catch((error) => {
        console.error("Weekly report failed:", error);
        return null;
      });

      const [daily, weekly] = await Promise.all([dailyRequest, weeklyRequest]);

      setDailyReport(daily);
      setWeeklyReport(weekly);

      if (!daily && !weekly) {
        setErrorMessage("Failed to load reports. Check Laravel API logs.");
      }
    } finally {
      setLoadingReports(false);
    }
  }

  useEffect(() => {
    async function init() {
      const defaults = await loadLookups();
      await loadReports(defaults);
    }

    init();
  }, []);

  const availableClassrooms = useMemo(() => {
    if (!filters.school_id) {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      return String(classroom.school?.id || classroom.school_id) === String(filters.school_id);
    });
  }, [classrooms, filters.school_id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "school_id" ? { classroom_id: "" } : {}),
    }));
  }

  function handleSchoolChange(event) {
    const schoolId = event.target.value;

    const firstClassroomId =
      classrooms.find((classroom) => {
        return String(classroom.school?.id || classroom.school_id) === String(schoolId);
      })?.id || "";

    setFilters((current) => ({
      ...current,
      school_id: schoolId,
      classroom_id: String(firstClassroomId),
    }));
  }

  const dailySummary = dailyReport?.summary || {};
  const weeklySummary = weeklyReport?.summary || {};

  const dailyStatusDistribution = dailyReport?.charts?.status_distribution || [];
  const classroomSummary = dailyReport?.charts?.classroom_summary || [];
  const weeklyDailyAttendance = weeklyReport?.charts?.daily_attendance || [];

  const loading = loadingLookups || loadingReports;

  return (
    <div className="reports-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Reports & Analytics</p>
          <h2>Attendance Reports</h2>
          <p className="page-description">
            Review daily and weekly attendance performance with visual summaries,
            classroom breakdowns, and trend charts.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => loadReports()}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            Refresh Reports
          </button>
        </div>
      </header>

      <section className="panel reports-filters">
        <label>
          School
          <select
            name="school_id"
            value={filters.school_id}
            onChange={handleSchoolChange}
          >
            <option value="">All schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Classroom
          <select
            name="classroom_id"
            value={filters.classroom_id}
            onChange={handleChange}
          >
            <option value="">All classrooms</option>
            {availableClassrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Daily Date
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleChange}
          />
        </label>

        <label>
          Week Start
          <input
            type="date"
            name="week_start"
            value={filters.week_start}
            onChange={handleChange}
          />
        </label>

        <div className="form-checkbox-align">
          <button
            className="primary-button"
            type="button"
            onClick={() => loadReports()}
            disabled={loading}
          >
            <BarChart3 size={16} />
            Apply Filters
          </button>
        </div>
      </section>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {loading && !dailyReport && !weeklyReport ? (
        <section className="panel">
          <p>Loading reports...</p>
        </section>
      ) : (
        <>
          <section className="reports-summary-grid">
            <ReportStatCard
              title="Daily Attendance Rate"
              value={`${dailySummary.attendance_rate ?? 0}%`}
              subtitle="selected date"
              icon={CalendarDays}
            />

            <ReportStatCard
              title="Daily Records"
              value={dailySummary.total_records ?? 0}
              subtitle="attendance records"
              icon={BarChart3}
            />

            <ReportStatCard
              title="Weekly Attendance Rate"
              value={`${weeklySummary.attendance_rate ?? 0}%`}
              subtitle="selected week"
              icon={CalendarDays}
            />

            <ReportStatCard
              title="Weekly Records"
              value={weeklySummary.total_records ?? 0}
              subtitle="attendance records"
              icon={BarChart3}
            />
          </section>

          <section className="reports-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Weekly Attendance Trend</h3>
                  <p>Daily attendance status across the selected week.</p>
                </div>
              </div>

              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260} minWidth={0}>
                  <BarChart data={weeklyDailyAttendance}>
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
                  <h3>Daily Status Distribution</h3>
                  <p>Attendance breakdown for {dailyReport?.date || filters.date}.</p>
                </div>
              </div>

              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={dailyStatusDistribution}
                      dataKey="count"
                      nameKey="label"
                      outerRadius={90}
                      label
                    >
                      {dailyStatusDistribution.map((entry) => (
                        <Cell key={entry.status || entry.label} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Classroom Daily Summary</h3>
                <p>Attendance performance by classroom for the selected day.</p>
              </div>
            </div>

            <div className="reports-table">
              <table>
                <thead>
                  <tr>
                    <th>Classroom</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Excused</th>
                    <th>Attendance Rate</th>
                    <th>Absence Rate</th>
                  </tr>
                </thead>

                <tbody>
                  {classroomSummary.map((row) => (
                    <tr key={row.classroom_id || row.classroom_name}>
                      <td>
                        <strong>{row.classroom_name}</strong>
                        <span>
                          Grade {row.grade_level}
                          {row.section ? ` - ${row.section}` : ""}
                        </span>
                      </td>

                      <td>{row.present_count}</td>
                      <td>{row.absent_count}</td>
                      <td>{row.late_count}</td>
                      <td>{row.excused_count}</td>
                      <td>{row.attendance_rate}%</td>
                      <td>{row.absence_rate}%</td>
                    </tr>
                  ))}

                  {classroomSummary.length === 0 && (
                    <tr>
                      <td className="empty-cell" colSpan="7">
                        No classroom report data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
