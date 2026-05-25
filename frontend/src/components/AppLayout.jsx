import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Camera,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers3,
  LogOut,
  School,
  ShieldAlert,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout, hasPermission } = useAuth();

  function can(permission) {
    return typeof hasPermission === "function" && hasPermission(permission);
  }

  function handleLogout() {
    if (typeof logout === "function") {
      logout();
    }
  }

  const roleName = user?.roles?.[0] || user?.role || user?.role_name || "user";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={24} />
          </div>

          <div>
            <h1>EduGuard AI</h1>
            <p>Dropout Early Warning</p>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end>
            <BarChart3 size={18} />
            Dashboard
          </NavLink>

          {can("view_schools") && (
            <NavLink to="/schools">
              <School size={18} />
              Schools
            </NavLink>
          )}

          {can("view_classrooms") && (
            <NavLink to="/classrooms">
              <Layers3 size={18} />
              Classrooms
            </NavLink>
          )}

          {can("view_students") && (
            <NavLink to="/students">
              <Users size={18} />
              Students
            </NavLink>
          )}

          {can("view_students") && (
            <NavLink to="/guardians">
              <UserRound size={18} />
              Guardians
            </NavLink>
          )}

          {can("view_attendance") && (
            <NavLink to="/attendance">
              <CalendarDays size={18} />
              Attendance
            </NavLink>
          )}

          {can("manage_attendance") && (
            <NavLink to="/attendance/camera">
              <Camera size={18} />
              Camera
            </NavLink>
          )}

          {can("view_grades") && (
            <NavLink to="/subjects">
              <BookOpen size={18} />
              Subjects
            </NavLink>
          )}

          {can("view_grades") && (
            <NavLink to="/grades">
              <GraduationCap size={18} />
              Grades
            </NavLink>
          )}

          {can("view_reports") && (
            <NavLink to="/reports">
              <FileText size={18} />
              Reports
            </NavLink>
          )}

          {can("view_risk_scores") && (
            <NavLink to="/risk-scores">
              <ShieldAlert size={18} />
              Risk Scores
            </NavLink>
          )}

          {can("view_risk_scores") && (
            <NavLink to="/interventions">
              <ClipboardCheck size={18} />
              Interventions
            </NavLink>
          )}

          {can("manage_users") && (
            <NavLink to="/users">
              <UserCog size={18} />
              Users
            </NavLink>
          )}
        </nav>

        <div className="sidebar-user">
          <div>
            <strong>{user?.name || "User"}</strong>
            <span>{roleName}</span>
          </div>

          <button type="button" onClick={handleLogout} title="Logout">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
