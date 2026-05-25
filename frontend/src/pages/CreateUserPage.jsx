import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUser,
  getDistricts,
  getGovernorates,
  getRoles,
  getSchools,
} from "../api/users";

const initialForm = {
  name: "",
  email: "",
  password: "password",
  role: "",
  governorate_id: "",
  district_id: "",
  school_id: "",
  is_active: true,
};

export default function CreateUserPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);

  const [roles, setRoles] = useState([]);
  const [schools, setSchools] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [
        rolesResponse,
        schoolsResponse,
        governoratesResponse,
        districtsResponse,
      ] = await Promise.all([
        getRoles(),
        getSchools({ per_page: 100 }),
        getGovernorates({ per_page: 100 }),
        getDistricts({ per_page: 100 }),
      ]);

      setRoles(rolesResponse || []);
      setSchools(schoolsResponse.data || []);
      setGovernorates(governoratesResponse.data || []);
      setDistricts(districtsResponse.data || []);
    }

    loadData();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function getValidationMessages(errors) {
    if (!errors) {
      return [];
    }

    return Object.values(errors).flat();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setValidationErrors([]);

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        governorate_id: form.governorate_id
          ? Number(form.governorate_id)
          : null,
        district_id: form.district_id ? Number(form.district_id) : null,
        school_id: form.school_id ? Number(form.school_id) : null,
        is_active: form.is_active,
      };

      await createUser(payload);

      navigate("/users");
    } catch (error) {
      console.error("User create error:", error.response?.data || error);

      const errors = error.response?.data?.errors;
      const message = error.response?.data?.message;
      const messages = getValidationMessages(errors);

      if (messages.length > 0) {
        setValidationErrors(messages);
        setErrorMessage(message || "Validation error.");
      } else {
        setErrorMessage(message || "Failed to create user.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="main-content form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Access Control</p>
          <h2>Add New User</h2>
          <p className="page-description">
            Create a user account and assign role and access scope.
          </p>
        </div>

        <Link className="secondary-button" to="/users">
          <ArrowLeft size={16} />
          Back to Users
        </Link>
      </header>

      <section className="panel form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Account Information</h3>

            <div className="form-grid two">
              <label>
                Full Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="School Admin"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="user@eduguard.test"
                  required
                />
              </label>
            </div>

            <div className="form-grid two">
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  minLength="8"
                  required
                />
              </label>

              <label>
                Role
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="checkbox-row form-checkbox-align">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              User account is active
            </label>
          </div>

          <div className="form-section">
            <h3>Access Scope</h3>

            <div className="form-grid two">
              <label>
                Governorate Scope
                <select
                  name="governorate_id"
                  value={form.governorate_id}
                  onChange={handleChange}
                >
                  <option value="">All governorates</option>
                  {governorates.map((governorate) => (
                    <option key={governorate.id} value={governorate.id}>
                      {governorate.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                District Scope
                <select
                  name="district_id"
                  value={form.district_id}
                  onChange={handleChange}
                >
                  <option value="">All districts</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              School Scope
              <select
                name="school_id"
                value={form.school_id}
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

            <p className="scope-note">
              Ministry users can usually access all schools. School admins,
              teachers, counselors, and data entry users should usually be scoped
              to one school.
            </p>
          </div>

          {errorMessage && (
            <div className="form-error">
              <strong>{errorMessage}</strong>

              {validationErrors.length > 0 && (
                <ul className="validation-list">
                  {validationErrors.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="form-actions">
            <Link className="secondary-button" to="/users">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create User"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}