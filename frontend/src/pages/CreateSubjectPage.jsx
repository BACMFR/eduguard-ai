import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createSubject } from "../api/subjects";

const initialForm = {
  name: "",
  code: "",
  description: "",
  is_active: true,
};

export default function CreateSubjectPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        ...form,
        code: form.code || null,
        description: form.description || null,
      };

      await createSubject(payload);

      navigate("/subjects");
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage("Failed to create subject.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic Management</p>
          <h2>Add New Subject</h2>
          <p className="page-description">
            Create a subject that can be used when registering student grades.
          </p>
        </div>

        <Link className="secondary-button" to="/subjects">
          <ArrowLeft size={16} />
          Back to Subjects
        </Link>
      </header>

      <section className="panel form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Subject Information</h3>

            <div className="form-grid two">
              <label>
                Subject Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Mathematics"
                  required
                />
              </label>

              <label>
                Subject Code
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="MATH"
                />
              </label>
            </div>

            <label>
              Description
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Basic mathematics subject"
              />
            </label>

            <label className="checkbox-row form-checkbox-align">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Subject is active
            </label>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <div className="form-actions">
            <Link className="secondary-button" to="/subjects">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create Subject"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}