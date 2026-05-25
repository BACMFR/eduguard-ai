import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCcw, Search, UserCog } from "lucide-react";
import { getRoles, getSchools, getUsers } from "../api/users";
import Can from "../components/Can";

function RoleBadge({ role }) {
  return <span className="role-badge">{role}</span>;
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [schools, setSchools] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLookups() {
    const [rolesResponse, schoolsResponse] = await Promise.all([
      getRoles(),
      getSchools({ per_page: 100 }),
    ]);

    setRoles(rolesResponse || []);
    setSchools(schoolsResponse.data || []);
  }

  async function loadUsers() {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {
        per_page: 100,
      };

      if (selectedRole) {
        params.role = selectedRole;
      }

      if (selectedSchoolId) {
        params.school_id = selectedSchoolId;
      }

      const response = await getUsers(params);

      setUsers(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        await loadLookups();
        await loadUsers();
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load users page.");
      }
    }

    init();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [selectedRole, selectedSchoolId]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) {
      return users;
    }

    const keyword = search.toLowerCase();

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.roles?.join(" ")?.toLowerCase().includes(keyword) ||
        user.school?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Access Control</p>
          <h2>Users & Roles</h2>
          <p className="page-description">
            Manage system users, roles, and school-level access scopes.
          </p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={loadUsers}>
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Can permission="manage_users">
            <Link className="primary-button" to="/users/create">
              <Plus size={16} />
              Add User
            </Link>
          </Can>
        </div>
      </header>

      <section className="panel list-panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.name} value={role.name}>
                {role.label}
              </option>
            ))}
          </select>

          <select
            value={selectedSchoolId}
            onChange={(event) => setSelectedSchoolId(event.target.value)}
          >
            <option value="">All schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {loading ? (
          <p className="loading-text">Loading users...</p>
        ) : (
          <div className="table-wrapper page-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>School Scope</th>
                  <th>Governorate</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">
                          <UserCog size={16} />
                        </div>

                        <div>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {user.roles?.length ? (
                        user.roles.map((role) => (
                          <RoleBadge key={role} role={role} />
                        ))
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>{user.school?.name || "All schools"}</td>
                    <td>{user.governorate?.name || "—"}</td>
                    <td>{user.district?.name || "—"}</td>
                    <td>{user.is_active ? "Active" : "Inactive"}</td>
                    <td>{user.created_at || "—"}</td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}