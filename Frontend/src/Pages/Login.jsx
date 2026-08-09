import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../images/logo.png'
import api from '../api'
import { homeForRole, setStoredUser } from '../auth'

const Login = () => {
  const [role, setRole] = useState('manager')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post("/api/auth/login", { email, password, role });
      setStoredUser({
        fullname: res.data.fullname,
        email: res.data.email,
        role: res.data.role,
      });
      navigate(homeForRole(res.data.role));
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError('Invalid email or password.');
      } else if (status === 403) {
        setError(err.response?.data?.message || 'Role does not match this account.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f0f4f8] flex flex-col items-center justify-center px-4 py-5">
      <div className="flex flex-col items-center mb-8">
        <img src={logo} alt="logo" className="w-16 h-16 object-contain mb-3" />
        <h1 className="text-2xl font-bold text-[#1e3a5f]">LogisticsPro</h1>
        <p className="text-xs font-semibold tracking-widest text-gray-400 mt-1">SMART LAST-MILE SYSTEM</p>
      </div>

      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">Log in to manage your deliveries.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="text"
              placeholder="manager@uit.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Login as</label>
            <div className="grid grid-cols-3 gap-2">
              {['manager', 'driver', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 text-sm rounded-lg border font-medium transition
                    ${role === r
                      ? 'border-[#1e3a5f] text-[#1e3a5f] bg-white ring-1 ring-[#1e3a5f]'
                      : 'border-gray-300 text-gray-600 bg-white hover:border-[#1e3a5f]/50'
                    }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#1e3a5f] rounded-lg text-sm font-bold text-white hover:bg-[#162d4a] transition mt-1 flex items-center justify-center gap-2"
          >
            Log In <span>→</span>
          </button>

        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400 tracking-widest">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <span
            onClick={() => navigate('/signup')}
            className="text-[#1a9e75] font-semibold cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  )
}

export default Login