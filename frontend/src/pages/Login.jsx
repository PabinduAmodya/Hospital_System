import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

function Login() {
  const [tab, setTab]           = useState("login"); // "login" | "forgot"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [forgotDone, setForgotDone] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { username, password });
      localStorage.setItem("token",    res.data.token);
      localStorage.setItem("role",     res.data.role);
      localStorage.setItem("name",     res.data.name);
      localStorage.setItem("username", res.data.username || username);
      navigate("/dashboard");
    } catch (err) {
      alert(err?.response?.data?.message || err?.response?.data || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
    } catch (_) {
      // Always show success — don't reveal if email exists
    } finally {
      setLoading(false);
      setForgotDone(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-6 text-white">
          <h1 className="text-2xl font-bold">Hospital Management System</h1>
          <p className="text-sm text-slate-300 mt-1">
            {tab === "login" ? "Login to continue" : "Reset your password"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 space-y-4">

            {/* ── Login ── */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Username</label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Password</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <p className="text-center text-xs text-gray-400">
                  <button type="button" onClick={() => { setTab("forgot"); setForgotDone(false); setEmail(""); }}
                    className="text-blue-600 hover:underline">
                    Forgot your password?
                  </button>
                </p>
              </form>
            )}

            {/* ── Forgot Password ── */}
            {tab === "forgot" && !forgotDone && (
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter your registered email address. We'll send a reset link to that inbox.
                </p>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email address</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@maildrop.cc" required autoFocus />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <p className="text-center text-xs">
                  <button type="button" onClick={() => setTab("login")} className="text-blue-600 hover:underline">
                    ← Back to login
                  </button>
                </p>
              </form>
            )}

            {/* ── Forgot — sent confirmation ── */}
            {tab === "forgot" && forgotDone && (
              <div className="text-center space-y-4 py-2">
                <div className="text-4xl">📬</div>
                <p className="font-semibold text-gray-800">Check your inbox</p>
                <p className="text-sm text-gray-500">
                  If <strong>{email}</strong> is registered, a password reset link has been sent.<br />
                  For Maildrop: go to{" "}
                  <a href={`https://maildrop.cc/inbox/${email.split("@")[0]}`} target="_blank" rel="noreferrer"
                    className="text-blue-600 underline">
                    maildrop.cc/inbox/{email.split("@")[0]}
                  </a>
                </p>
                <button onClick={() => setTab("login")} className="text-sm text-blue-600 hover:underline">
                  ← Back to login
                </button>
              </div>
            )}

          </div>
        </div>

        {/* <p className="text-xs text-slate-400 text-center mt-4">
          Maildrop tip: send to <code className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded">name@maildrop.cc</code> → read at maildrop.cc/inbox/name
        </p> */}
      </div>
    </div>
  );
}

export default Login;