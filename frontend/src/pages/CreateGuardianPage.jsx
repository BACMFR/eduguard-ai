import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createGuardian } from "../api/guardians";

const initialForm = {
  full_name: "",
  national_id: "",
  relationship: "father",
  phone: "",
  email: "",
  address: "",
};

export default function CreateGuardianPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
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
        full_name: form.full_name.trim(),
        national_id: form.national_id.trim() || null,
        relationship: form.relationship,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
      };

      await createGuardian(payload);

      navigate("/guardians");
    } catch (error) {
      console.error("Guardian create error:", error.response?.data || error);

      const errors = error.response?.data?.errors;
      const message = error.response?.data?.message;

      const messages = getValidationMessages(errors);

      if (messages.length > 0) {
        setValidationErrors(messages);
        setErrorMessage(message || "Validation error.");
      } else {
        setErrorMessage(message || "Failed to create guardian.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Support</p>
          <h2>Add New Guardian</h2>
          <p className="page-description">
            Register a parent or guardian for student communication and follow-up.
          </p>
        </div>

        <Link className="secondary-button" to="/guardians">
          <ArrowLeft size={16} />
          Back to Guardians
        </Link>
      </header>

      <section className="panel form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Guardian Identity</h3>

            <label>
              Full Name
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Mohammad Hassan"
                required
              />
            </label>

            <div className="form-grid two">
              <label>
                National ID
                <input
                  name="national_id"
                  value={form.national_id}
                  onChange={handleChange}
                  placeholder="NAT-G-001"
                />
              </label>

              <label>
                Relationship
                <select
                  name="relationship"
                  value={form.relationship}
                  onChange={handleChange}
                  required
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                  <option value="relative">Relative</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>

            <div className="form-grid two">
              <label>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0990000000"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="guardian@example.com"
                />
              </label>
            </div>

            <label>
              Address
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Damascus - Al-Mazzeh"
              />
            </label>
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
            <Link className="secondary-button" to="/guardians">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create Guardian"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}