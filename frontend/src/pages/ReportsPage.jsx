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

const initialFilters = {
  school_id: "1",
  classroom_id: "1",
  date: "2026-05-24",
  week_start: "2026-05-18",
};

function ReportStatCard({ title, value, subtitle }) {
  return (
    <div className="mini-stat">
      <p>{title}</p>
      <strong>{value}</strong>
      {subtitle && <span>{subtitle}</span>}
    </div>
  );
}

export default function ReportsPage() {
  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [filters, setFilters] = useState(initialFilters);

  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadLookups() {
      const [schoolsResponse, classroomsResponse] = await Promise.all([
        getSchools({ per_page: 100 }),
        getClassrooms({ per_page: 100 }),
      ]);

      setSchools(schoolsResponse.data || []);
      setClassrooms(classroomsResponse.data || []);
    }

    loadLookups();
  }, []);

  const availableClassrooms = useMemo(() => {
    if (!filters.school_id) {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      return String(classroom.school?.id) === String(filters.school_id);
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

  async function loadReports() {
    try {
      setLoading(true);
      setErrorMessage("");

      const baseParams = {};

      if (filters.school_id) {
        baseParams.school_id = filters.school_id;
      }

      if (filters.classroom_id) {
        baseParams.classroom_id = filters.classroom_id;
      }

      const [daily, weekly] = await Promise.all([
        getDailyAttendanceReport({
          ...baseParams,
          date: filters.date,
        }),
        getWeeklyAttendanceReport({
          ...baseParams,
          week_start: filters.week_start,
        }),
      ]);

      setDailyReport(daily);
      setWeeklyReport(weekly);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const dailySummary = dailyReport?.summary || {};
  const weeklySummary = weeklyReport?.summary || {};

  const dailyStatusDistribution =
    dailyReport?.charts?.status_distribution || [];

  const classroomSummary =
    dailyReport?.charts?.classroom_summary || [];

  const weeklyDailyAttendance =
    weeklyReport?.charts?.daily_attendance || [];

  return (
    <main className="main-content reports-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Reports & Analytics</p>
          <h2>Attendance Reports</h2>
          <p className="page-description">
            Review daily and weekly attendance performance with visual summaries.
          </p>
        </div>

        <button className="primary-button" onClick={loadReports}>
          <RefreshCcw size={16} />
          Refresh Reports
        </button>
      </header>

      <section className="panel reports-filters">
        <div className="form-grid four">
          <label>
            School
            <select
              name="school_id"
              value={filters.school_id}
              onChange={handleChange}
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
        </div>
      </section>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {loading ? (
        <section className="panel">
          <p className="loading-text">Loading reports...</p>
        </section>
      ) : (
        <>
          <section className="reports-summary-grid">
            <ReportStatCard
              title="Daily Attendance"
              value={`${dailySummary.attendance_rate ?? 0}%`}
              subtitle={`${dailySummary.present_count ?? 0} present`}
            />

            <ReportStatCard
              title="Daily Absence"
              value={`${dailySummary.absence_rate ?? 0}%`}
              subtitle={`${dailySummary.absent_count ?? 0} absent`}
            />

            <ReportStatCard
              title="Weekly Attendance"
              value={`${weeklySummary.attendance_rate ?? 0}%`}
              subtitle={`${weeklySummary.total_sessions ?? 0} sessions`}
            />

            <ReportStatCard
              title="Weekly Records"
              value={weeklySummary.total_records ?? 0}
              subtitle="attendance records"
            />
          </section>

          <section className="reports-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Weekly Attendance Trend</h3>
                  <p>Daily attendance status across the selected week.</p>
                </div>
                <BarChart3 size={18} />
              </div>

              <div className="report-chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={weeklyDailyAttendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="present" name="Present" />
                    <Bar dataKey="absent" name="Absent" />
                    <Bar dataKey="late" name="Late" />
                    <Bar dataKey="excused" name="Excused" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Daily Status Distribution</h3>
                  <p>Attendance breakdown for {dailyReport?.date}.</p>
                </div>
                <CalendarDays size={18} />
              </div>

              <div className="report-chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={dailyStatusDistribution}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {dailyStatusDistribution.map((entry) => (
                        <Cell key={entry.status} />
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

            <div className="table-wrapper reports-table">
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
                    <tr key={row.classroom_id}>
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
                      <td>
                        <strong>{row.attendance_rate}%</strong>
                      </td>
                      <td>{row.absence_rate}%</td>
                    </tr>
                  ))}

                  {classroomSummary.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty-cell">
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
    </main>
  );
}