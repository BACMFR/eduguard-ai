import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calculator, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import {
  calculateBulkRiskScores,
  calculateStudentRiskScore,
  getClassrooms,
  getSchools,
  getStudents,
} from "../api/riskScores";

const initialForm = {
  mode: "student",
  school_id: "",
  classroom_id: "",
  student_id: "",
  date_from: "2026-05-18",
  date_to: "2026-05-24",
};

function RiskBadge({ level }) {
  const value = level?.value || level;

  return (
    <span className={`risk-badge risk-${value}`}>
      {level?.label || value}
    </span>
  );
}

export default function CalculateRiskScorePage() {
  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadData() {
      const [schoolsResponse, classroomsResponse, studentsResponse] =
        await Promise.all([
          getSchools({ per_page: 100 }),
          getClassrooms({ per_page: 100 }),
          getStudents({ per_page: 100 }),
        ]);

      setSchools(schoolsResponse.data || []);
      setClassrooms(classroomsResponse.data || []);
      setStudents(studentsResponse.data || []);
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

  const availableStudents = useMemo(() => {
    return students.filter((student) => {
      if (form.school_id && String(student.school?.id) !== String(form.school_id)) {
        return false;
      }

      if (
        form.classroom_id &&
        String(student.classroom?.id) !== String(form.classroom_id)
      ) {
        return false;
      }

      return true;
    });
  }, [students, form.school_id, form.classroom_id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleModeChange(event) {
    const mode = event.target.value;

    setForm((current) => ({
      ...current,
      mode,
      student_id: "",
    }));

    setResult(null);
    setErrorMessage("");
  }

  function handleSchoolChange(event) {
    const schoolId = event.target.value;

    setForm((current) => ({
      ...current,
      school_id: schoolId,
      classroom_id: "",
      student_id: "",
    }));
  }

  function handleClassroomChange(event) {
    const classroomId = event.target.value;

    setForm((current) => ({
      ...current,
      classroom_id: classroomId,
      student_id: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setResult(null);

      if (form.mode === "student") {
        const payload = {
          student_id: Number(form.student_id),
          date_from: form.date_from,
          date_to: form.date_to,
        };

        const response = await calculateStudentRiskScore(payload);
        setResult({
          type: "single",
          data: response.data,
          message: response.message,
        });
      } else {
        const payload = {
          date_from: form.date_from,
          date_to: form.date_to,
        };

        if (form.school_id) {
          payload.school_id = Number(form.school_id);
        }

        if (form.classroom_id) {
          payload.classroom_id = Number(form.classroom_id);
        }

        const response = await calculateBulkRiskScores(payload);

        setResult({
          type: "bulk",
          data: response.data || [],
          count: response.count || 0,
          message: response.message,
        });
      }
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage("Failed to calculate risk score.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="main-content form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Early Warning System</p>
          <h2>Calculate Risk Score</h2>
          <p className="page-description">
            Calculate dropout risk for one student or for a full school/classroom.
          </p>
        </div>

        <Link className="secondary-button" to="/risk-scores">
          <ArrowLeft size={16} />
          Back to Risk Scores
        </Link>
      </header>

      <section className="panel form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Calculation Mode</h3>

            <div className="risk-mode-grid">
              <label className={`risk-mode-card ${form.mode === "student" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="mode"
                  value="student"
                  checked={form.mode === "student"}
                  onChange={handleModeChange}
                />
                <div>
                  <strong>Single Student</strong>
                  <span>Calculate risk for one selected student.</span>
                </div>
              </label>

              <label className={`risk-mode-card ${form.mode === "bulk" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="mode"
                  value="bulk"
                  checked={form.mode === "bulk"}
                  onChange={handleModeChange}
                />
                <div>
                  <strong>Bulk Calculation</strong>
                  <span>Calculate risk for all students in a school or classroom.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Scope</h3>

            <div className="form-grid two">
              <label>
                School
                <select
                  name="school_id"
                  value={form.school_id}
                  onChange={handleSchoolChange}
                  required={form.mode === "bulk" && !form.classroom_id}
                >
                  <option value="">All schools</option>
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
                  onChange={handleClassroomChange}
                >
                  <option value="">All classrooms</option>
                  {availableClassrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {form.mode === "student" && (
              <label>
                Student
                <select
                  name="student_id"
                  value={form.student_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select student</option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} - {student.student_number}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="form-section">
            <h3>Calculation Period</h3>

            <div className="form-grid two">
              <label>
                Date From
                <input
                  type="date"
                  name="date_from"
                  value={form.date_from}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Date To
                <input
                  type="date"
                  name="date_to"
                  value={form.date_to}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <div className="form-actions">
            <Link className="secondary-button" to="/risk-scores">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Calculator size={16} />
              {saving ? "Calculating..." : "Calculate Risk"}
            </button>
          </div>
        </form>
      </section>

      {result && (
        <section className="panel risk-result-panel">
          <div className="panel-header">
            <div>
              <h3>Calculation Result</h3>
              <p>{result.message}</p>
            </div>
          </div>

          {result.type === "single" && (
            <div className="single-risk-result">
              <div className="risk-result-score">
                <ShieldAlert size={22} />
                <div>
                  <p>Risk Score</p>
                  <strong>{result.data.score}</strong>
                </div>
              </div>

              <div>
                <p className="muted-label">Level</p>
                <RiskBadge level={result.data.level} />
              </div>

              <div>
                <p className="muted-label">Student</p>
                <strong>{result.data.student?.full_name}</strong>
              </div>

              <div>
                <p className="muted-label">Summary</p>
                <span>{result.data.summary}</span>
              </div>
            </div>
          )}

          {result.type === "bulk" && (
            <>
              <div className="bulk-result-summary">
                <p>Calculated students</p>
                <strong>{result.count}</strong>
              </div>

              <div className="table-wrapper page-table risk-result-table">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Classroom</th>
                      <th>Score</th>
                      <th>Level</th>
                      <th>Summary</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.data.map((risk) => (
                      <tr key={risk.id}>
                        <td>
                          <strong>{risk.student?.full_name}</strong>
                          <span>{risk.student?.student_number}</span>
                        </td>
                        <td>{risk.classroom?.name || "—"}</td>
                        <td>{risk.score}</td>
                        <td>
                          <RiskBadge level={risk.level} />
                        </td>
                        <td>{risk.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}