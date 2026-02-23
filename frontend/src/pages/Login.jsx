import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { username, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);

      navigate("/dashboard");
    } catch (err) {
      alert(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 text-white">
          <h1 className="text-2xl font-bold">Hospital Management System</h1>
          <p className="text-sm text-slate-200 mt-1">Login to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-gray-600">Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required />
              </div>

              <div>
                <label className="text-xs text-gray-600">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Backend base URL: <span className="font-mono">http://localhost:8080/api</span>
              </p>
            </form>
          </div>
        </div>

        <p className="text-xs text-slate-200 text-center mt-4">
          Tip: If you get 403, check token + roles.
        </p>
      </div>
    </div>
  );
}

export default Login;
