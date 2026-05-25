import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createClassroom, getSchools } from "../api/classrooms";

const initialForm = {
  school_id: "",
  name: "",
  grade_level: 9,
  section: "",
  capacity: "",
  is_active: true,
};

export default function CreateClassroomPage() {
  const navigate = useNavigate();

  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSchools() {
      const response = await getSchools({ per_page: 100 });
      setSchools(response.data || []);
    }

    loadSchools();
  }, []);

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
        school_id: Number(form.school_id),
        grade_level: Number(form.grade_level),
        section: form.section || null,
        capacity: form.capacity ? Number(form.capacity) : null,
      };

      await createClassroom(payload);

      navigate("/classrooms");
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage("Failed to create classroom.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Classroom Management</p>
          <h2>Add New Classroom</h2>
          <p className="page-description">
            Create a classroom and link it to a school.
          </p>
        </div>

        <Link className="secondary-button" to="/classrooms">
          <ArrowLeft size={16} />
          Back to Classrooms
        </Link>
      </header>

      <section className="panel form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>School Assignment</h3>

            <div className="form-grid two">
              <label>
                School
                <select
                  name="school_id"
                  value={form.school_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Grade Level
                <select
                  name="grade_level"
                  value={form.grade_level}
                  onChange={handleChange}
                  required
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Classroom Information</h3>

            <div className="form-grid two">
              <label>
                Classroom Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Grade 9 - B"
                  required
                />
              </label>

              <label>
                Section
                <input
                  name="section"
                  value={form.section}
                  onChange={handleChange}
                  placeholder="B"
                />
              </label>
            </div>

            <div className="form-grid two">
              <label>
                Capacity
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="35"
                  min="1"
                  max="200"
                />
              </label>

              <label className="checkbox-row form-checkbox-align">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Classroom is active
              </label>
            </div>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <div className="form-actions">
            <Link className="secondary-button" to="/classrooms">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create Classroom"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}