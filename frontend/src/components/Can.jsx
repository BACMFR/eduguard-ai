import { useAuth } from "../context/AuthContext";

export default function Can({ permission, children }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return null;
  }

  return children;
}