import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createSchool, getDistricts, getGovernorates } from "../api/schools";

const initialForm = {
  governorate_id: "",
  district_id: "",
  name: "",
  code: "",
  type: "public",
  gender_type: "mixed",
  address: "",
  phone: "",
  is_active: true,
};

export default function CreateSchoolPage() {
  const navigate = useNavigate();

  const [governorates, setGovernorates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const [governoratesResponse, districtsResponse] = await Promise.all([
        getGovernorates({ per_page: 100 }),
        getDistricts({ per_page: 100 }),
      ]);

      setGovernorates(governoratesResponse.data || []);
      setDistricts(districtsResponse.data || []);
    }

    loadData();
  }, []);

  const availableDistricts = useMemo(() => {
    if (!form.governorate_id) {
      return districts;
    }

    return districts.filter((district) => {
      return String(district.governorate?.id || district.governorate_id) === String(form.governorate_id);
    });
  }, [districts, form.governorate_id]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleGovernorateChange(event) {
    const governorateId = event.target.value;

    setForm((current) => ({
      ...current,
      governorate_id: governorateId,
      district_id: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        ...form,
        governorate_id: Number(form.governorate_id),
        district_id: Number(form.district_id),
        code: form.code || null,
        address: form.address || null,
        phone: form.phone || null,
      };

      await createSchool(payload);

      navigate("/schools");
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Validation error.");
      } else {
        setErrorMessage("Failed to create school.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="main-content form-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">School Management</p>
          <h2>Add New School</h2>
          <p className="page-description">
            Create a school and link it to a governorate and district.
          </p>
        </div>

        <Link className="secondary-button" to="/schools">
          <ArrowLeft size={16} />
          Back to Schools
        </Link>
      </header>

      <section className="panel form-card">
        <form className="clean-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Location</h3>

            <div className="form-grid two">
              <label>
                Governorate
                <select
                  name="governorate_id"
                  value={form.governorate_id}
                  onChange={handleGovernorateChange}
                  required
                >
                  <option value="">Select governorate</option>
                  {governorates.map((governorate) => (
                    <option key={governorate.id} value={governorate.id}>
                      {governorate.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                District
                <select
                  name="district_id"
                  value={form.district_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select district</option>
                  {availableDistricts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>School Information</h3>

            <div className="form-grid two">
              <label>
                School Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Al-Nahda School"
                  required
                />
              </label>

              <label>
                School Code
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="SCH-004"
                />
              </label>
            </div>

            <div className="form-grid two">
              <label>
                School Type
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="vocational">Vocational</option>
                </select>
              </label>

              <label>
                Gender Type
                <select
                  name="gender_type"
                  value={form.gender_type}
                  onChange={handleChange}
                >
                  <option value="mixed">Mixed</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact</h3>

            <div className="form-grid two">
              <label>
                Address
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Damascus - Al-Mazzeh"
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0110000000"
                />
              </label>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              School is active
            </label>
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <div className="form-actions">
            <Link className="secondary-button" to="/schools">
              Cancel
            </Link>

            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create School"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}