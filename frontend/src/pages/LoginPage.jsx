import { useState } from "react";
import { GraduationCap, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("ministry.admin@eduguard.test");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      await login(email, password);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];
        setErrorMessage(firstError || "Invalid login credentials.");
      } else {
        setErrorMessage("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <GraduationCap size={34} />
          </div>

          <div>
            <h1>EduGuard AI</h1>
            <p>Dropout Early Warning Platform</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <h2>Sign in</h2>
            <p>Use your authorized school or ministry account.</p>
          </div>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="primary-button login-button" type="submit" disabled={loading}>
            <LogIn size={16} />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="demo-accounts">
          <p>Demo accounts:</p>
          <span>ministry.admin@eduguard.test / password</span>
          <span>school.admin@eduguard.test / password</span>
          <span>teacher@eduguard.test / password</span>
        </div>
      </section>
    </main>
  );
}