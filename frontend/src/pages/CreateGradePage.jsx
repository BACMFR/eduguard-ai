import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  createGrade,
  getClassrooms,
  getSchools,
  getStudents,
  getSubjects,
} from "../api/grades";

const initialForm = {
  school_id: "",
  classroom_id: "",
  student_id: "",
  subject_id: "",
  exam_name: "",
  grade_type: "quiz",
  score: "",
  max_score: 100,
  exam_date: "2026-05-24",
  notes: "",
};

export default function CreateGradePage() {
  const navigate = useNavigate();

  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const [
        schoolsResponse,
        classroomsResponse,
        studentsResponse,
        subjectsResponse,
      ] = await Promise.all([
        getSchools({ per_page: 100 }),
        getClassrooms({ per_page: 100 }),
        getStudents({ per_page: 100 }),
        getSubjects({ per_page: 100 }),
      ]);

      setSchools(schoolsResponse.data || []);
      setClassrooms(classroomsResponse.data || []);
      setStudents(studentsResponse.data || []);
      setSubjects(subjectsResponse.data || []);
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

      const payload = {
        student_id: Number(form.student_id),
        subject_id: Number(form.subject_id),
        exam_name: form.exam_name,
        grade_type: form.grade_type,
        score: Number(form.score),
        max_score: Number(form.max_score),
        exam_date: form.exam_date,
        notes: form.notes || null,
      };

      await createGrade(payload);

      navigate("/grades");
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage("Failed to create grade.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic Performance</p>
          <h2>Add Student Grade</h2>
          <p className="page-description">
            Register a grade that contributes to dropout risk analysis.
          </p>
        </div>

        <Link className="secondary-button" to="/grades">
          <ArrowLeft size={16} />
          Back to Grades
        </Link>
      </header>

      <section className="panel form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Student Selection</h3>

            <div className="form-grid two">
              <label>
                School
                <select
                  name="school_id"
                  value={form.school_id}
                  onChange={handleSchoolChange}
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
          </div>

          <div className="form-section">
            <h3>Grade Information</h3>

            <div className="form-grid two">
              <label>
                Subject
                <select
                  name="subject_id"
                  value={form.subject_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Grade Type
                <select
                  name="grade_type"
                  value={form.grade_type}
                  onChange={handleChange}
                >
                  <option value="quiz">Quiz</option>
                  <option value="homework">Homework</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="oral">Oral</option>
                  <option value="practical">Practical</option>
                </select>
              </label>
            </div>

            <label>
              Exam Name
              <input
                name="exam_name"
                value={form.exam_name}
                onChange={handleChange}
                placeholder="First Quiz"
                required
              />
            </label>

            <div className="form-grid two">
              <label>
                Score
                <input
                  type="number"
                  name="score"
                  value={form.score}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="42"
                  required
                />
              </label>

              <label>
                Max Score
                <input
                  type="number"
                  name="max_score"
                  value={form.max_score}
                  onChange={handleChange}
                  min="1"
                  step="0.01"
                  required
                />
              </label>
            </div>

            <div className="form-grid two">
              <label>
                Exam Date
                <input
                  type="date"
                  name="exam_date"
                  value={form.exam_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Notes
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Optional notes"
                />
              </label>
            </div>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <div className="form-actions">
            <Link className="secondary-button" to="/grades">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create Grade"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}