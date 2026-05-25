import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionRoute from "./components/PermissionRoute";
import { AuthProvider } from "./context/AuthContext";

import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

import SchoolsPage from "./pages/SchoolsPage";
import SchoolDetailsPage from "./pages/SchoolDetailsPage";
import CreateSchoolPage from "./pages/CreateSchoolPage";

import ClassroomsPage from "./pages/ClassroomsPage";
import ClassroomDetailsPage from "./pages/ClassroomDetailsPage";
import CreateClassroomPage from "./pages/CreateClassroomPage";

import StudentsPage from "./pages/StudentsPage";
import StudentDetailsPage from "./pages/StudentDetailsPage";
import CreateStudentPage from "./pages/CreateStudentPage";
import StudentFaceRegistrationPage from "./pages/StudentFaceRegistrationPage";

import GuardiansPage from "./pages/GuardiansPage";
import CreateGuardianPage from "./pages/CreateGuardianPage";

import AttendancePage from "./pages/AttendancePage";
import CreateAttendanceSessionPage from "./pages/CreateAttendanceSessionPage";
import ReviewAttendancePage from "./pages/ReviewAttendancePage";
import CameraAttendancePage from "./pages/CameraAttendancePage";

import SubjectsPage from "./pages/SubjectsPage";
import CreateSubjectPage from "./pages/CreateSubjectPage";

import GradesPage from "./pages/GradesPage";
import CreateGradePage from "./pages/CreateGradePage";

import ReportsPage from "./pages/ReportsPage";

import RiskScoresPage from "./pages/RiskScoresPage";
import CalculateRiskScorePage from "./pages/CalculateRiskScorePage";

import InterventionsPage from "./pages/InterventionsPage";
import CreateInterventionPage from "./pages/CreateInterventionPage";
import EditInterventionPage from "./pages/EditInterventionPage";

import UsersPage from "./pages/UsersPage";
import CreateUserPage from "./pages/CreateUserPage";

import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/" element={<DashboardPage />} />

              <Route element={<PermissionRoute permission="manage_users" />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/create" element={<CreateUserPage />} />
              </Route>

              <Route element={<PermissionRoute permission="view_schools" />}>
                <Route path="/schools" element={<SchoolsPage />} />
                <Route path="/schools/:id" element={<SchoolDetailsPage />} />
              </Route>

              <Route element={<PermissionRoute permission="manage_schools" />}>
                <Route path="/schools/create" element={<CreateSchoolPage />} />
              </Route>

              <Route element={<PermissionRoute permission="view_classrooms" />}>
                <Route path="/classrooms" element={<ClassroomsPage />} />
                <Route path="/classrooms/:id" element={<ClassroomDetailsPage />} />
              </Route>

              <Route element={<PermissionRoute permission="manage_classrooms" />}>
                <Route path="/classrooms/create" element={<CreateClassroomPage />} />
              </Route>

              <Route element={<PermissionRoute permission="view_students" />}>
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:id" element={<StudentDetailsPage />} />
                <Route path="/guardians" element={<GuardiansPage />} />
              </Route>

              <Route element={<PermissionRoute permission="manage_students" />}>
                <Route path="/students/create" element={<CreateStudentPage />} />
                <Route
                  path="/students/:id/face-registration"
                  element={<StudentFaceRegistrationPage />}
                />
                <Route path="/guardians/create" element={<CreateGuardianPage />} />
              </Route>

              <Route element={<PermissionRoute permission="view_attendance" />}>
                <Route path="/attendance" element={<AttendancePage />} />
              </Route>

              <Route element={<PermissionRoute permission="manage_attendance" />}>
                <Route
                  path="/attendance/create"
                  element={<CreateAttendanceSessionPage />}
                />
                <Route path="/attendance/camera" element={<CameraAttendancePage />} />
                <Route path="/attendance/:id/review" element={<ReviewAttendancePage />} />
              </Route>

              <Route element={<PermissionRoute permission="view_grades" />}>
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/grades" element={<GradesPage />} />
              </Route>

              <Route element={<PermissionRoute permission="manage_grades" />}>
                <Route path="/subjects/create" element={<CreateSubjectPage />} />
                <Route path="/grades/create" element={<CreateGradePage />} />
              </Route>

              <Route element={<PermissionRoute permission="view_reports" />}>
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              <Route element={<PermissionRoute permission="view_risk_scores" />}>
                <Route path="/risk-scores" element={<RiskScoresPage />} />
                <Route path="/interventions" element={<InterventionsPage />} />
              </Route>

              <Route element={<PermissionRoute permission="calculate_risk_scores" />}>
                <Route
                  path="/risk-scores/calculate"
                  element={<CalculateRiskScorePage />}
                />
                <Route
                  path="/interventions/create"
                  element={<CreateInterventionPage />}
                />
                <Route
                  path="/interventions/:id/edit"
                  element={<EditInterventionPage />}
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
