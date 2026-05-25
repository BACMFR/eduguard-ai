import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  createAttendanceSession,
  getClassrooms,
  getSchools,
} from "../api/attendance";

const initialForm = {
  school_id: "",
  classroom_id: "",
  session_date: "2026-05-24",
  start_time: "08:00",
  end_time: "08:15",
  source: "manual",
  status: "draft",
  notes: "",
};

export default function CreateAttendanceSessionPage() {
  const navigate = useNavigate();

  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const [schoolsResponse, classroomsResponse] = await Promise.all([
        getSchools({ per_page: 100 }),
        getClassrooms({ per_page: 100 }),
      ]);

      setSchools(schoolsResponse.data || []);
      setClassrooms(classroomsResponse.data || []);
    }

    loadData();
  }, []);

  const availableClassrooms = useMemo(() => {
    if (!form.school_id) {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      return String(classroom.school?.id) === String(form.school_id);
    });
  }, [classrooms, form.school_id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSchoolChange(event) {
    const schoolId = event.target.value;

    setForm((current) => ({
      ...current,
      school_id: schoolId,
      classroom_id: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        classroom_id: Number(form.classroom_id),
        session_date: form.session_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        source: form.source,
        status: form.status,
        notes: form.notes || null,
      };

      const response = await createAttendanceSession(payload);
      navigate(`/attendance/${response.data.id}/review`);
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage("Failed to create attendance session.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Attendance Management</p>
          <h2>Create Attendance Session</h2>
          <p className="page-description">
            Create a session for a classroom, then review student attendance.
          </p>
        </div>

        <Link className="secondary-button" to="/attendance">
          <ArrowLeft size={16} />
          Back to Attendance
        </Link>
      </header>

      <section className="panel form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Classroom Assignment</h3>

            <div className="form-grid two">
              <label>
                School
                <select
                  name="school_id"
                  value={form.school_id}
                  onChange={handleSchoolChange}
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
                Classroom
                <select
                  name="classroom_id"
                  value={form.classroom_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select classroom</option>
                  {availableClassrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Session Information</h3>

            <div className="form-grid two">
              <label>
                Session Date
                <input
                  type="date"
                  name="session_date"
                  value={form.session_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Source
                <select name="source" value={form.source} onChange={handleChange}>
                  <option value="manual">Manual</option>
                  <option value="camera">Camera</option>
                  <option value="import">Import</option>
                </select>
              </label>
            </div>

            <div className="form-grid two">
              <label>
                Start Time
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                />
              </label>

              <label>
                End Time
                <input
                  type="time"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label>
              Notes
              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Morning attendance"
              />
            </label>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <div className="form-actions">
            <Link className="secondary-button" to="/attendance">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create Session"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}