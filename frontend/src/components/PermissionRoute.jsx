import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PermissionRoute({ permission }) {
  const { loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <main className="main-content centered">
        <p>Checking permissions...</p>
      </main>
    );
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
