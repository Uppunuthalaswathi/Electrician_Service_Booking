import { useState } from "react";
import { loginUser } from "../../api/authApi";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handle login
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await loginUser(form);

    console.log("LOGIN RESPONSE:", res.data);

    // ✅ STORE TOKEN
    localStorage.setItem("token", res.data.token);

    // ✅ GET ROLE CORRECTLY
    const role = res.data.user.roles[0];

    // ✅ REDIRECT
    if (role === "user") navigate("/user");
    else if (role === "electrician") navigate("/electrician");
    else navigate("/admin");

  } catch (err) {
    console.log("LOGIN ERROR:", err.response?.data);

    alert(err.response?.data?.message || "Login Failed ❌");
  }
};
  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />

        <button type="submit">Login</button>
      </form>

      <p>
        <Link to="/forgot">Forgot Password?</Link>
      </p>

      <p>
        New user? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;