import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PermissionRoute({ permission }) {
  const { loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="centered">
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
