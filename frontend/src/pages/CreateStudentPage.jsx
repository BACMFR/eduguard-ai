import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  createStudent,
  getClassrooms,
  getGuardians,
  getSchools,
} from "../api/students";

const initialForm = {
  school_id: "",
  classroom_id: "",
  guardian_id: "",
  student_number: "",
  national_id: "",
  first_name: "",
  last_name: "",
  gender: "male",
  status: "active",
  birth_date: "2010-05-15",
  enrollment_date: "2026-05-24",
  face_registered: false,
};

export default function CreateStudentPage() {
  const navigate = useNavigate();

  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [guardians, setGuardians] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const [schoolsResponse, classroomsResponse, guardiansResponse] =
        await Promise.all([
          getSchools({ per_page: 100 }),
          getClassrooms({ per_page: 100 }),
          getGuardians({ per_page: 100 }),
        ]);

      setSchools(schoolsResponse.data || []);
      setClassrooms(classroomsResponse.data || []);
      setGuardians(guardiansResponse.data || []);
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
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
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
        school_id: Number(form.school_id),
        classroom_id: form.classroom_id ? Number(form.classroom_id) : null,
        guardian_id: form.guardian_id ? Number(form.guardian_id) : null,
        student_number: form.student_number,
        national_id: form.national_id || null,
        first_name: form.first_name,
        last_name: form.last_name,
        gender: form.gender,
        status: form.status,
        birth_date: form.birth_date,
        enrollment_date: form.enrollment_date,
        face_registered: form.face_registered,
      };

      await createStudent(payload);

      navigate("/students");
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage("Failed to create student.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Management</p>
          <h2>Add New Student</h2>
          <p className="page-description">
            Register a student and link them to a school, classroom, and guardian.
          </p>
        </div>

        <Link className="secondary-button" to="/students">
          <ArrowLeft size={16} />
          Back to Students
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
            <h3>Guardian Assignment</h3>

            <label>
              Guardian
              <select
                name="guardian_id"
                value={form.guardian_id}
                onChange={handleChange}
              >
                <option value="">No guardian selected</option>
                {guardians.map((guardian) => (
                  <option key={guardian.id} value={guardian.id}>
                    {guardian.full_name ||
                      `${guardian.first_name || ""} ${guardian.last_name || ""}`}{" "}
                    {guardian.phone ? `- ${guardian.phone}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-section">
            <h3>Student Identity</h3>

            <div className="form-grid two">
              <label>
                Student Number
                <input
                  name="student_number"
                  value={form.student_number}
                  onChange={handleChange}
                  placeholder="STU-002"
                  required
                />
              </label>

              <label>
                National ID
                <input
                  name="national_id"
                  value={form.national_id}
                  onChange={handleChange}
                  placeholder="NAT-002"
                />
              </label>
            </div>

            <div className="form-grid two">
              <label>
                First Name
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Ahmad"
                  required
                />
              </label>

              <label>
                Last Name
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Hassan"
                  required
                />
              </label>
            </div>

            <div className="form-grid two">
              <label>
                Gender
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>

              <label>
                Status
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="transferred">Transferred</option>
                  <option value="graduated">Graduated</option>
                  <option value="dropped_out">Dropped Out</option>
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Enrollment Information</h3>

            <div className="form-grid two">
              <label>
                Birth Date
                <input
                  type="date"
                  name="birth_date"
                  value={form.birth_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Enrollment Date
                <input
                  type="date"
                  name="enrollment_date"
                  value={form.enrollment_date}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label className="checkbox-row form-checkbox-align">
              <input
                type="checkbox"
                name="face_registered"
                checked={form.face_registered}
                onChange={handleChange}
              />
              Face profile is already registered
            </label>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <div className="form-actions">
            <Link className="secondary-button" to="/students">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create Student"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}