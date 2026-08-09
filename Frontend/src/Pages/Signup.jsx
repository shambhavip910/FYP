import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../images/logo.png'
import api from '../api'
import { homeForRole, setStoredUser } from '../auth'

const Signup = () => {
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('manager')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post("/api/auth/register", { fullname, email, password, role });
      const user = res.data.user;
      setStoredUser({
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      });
      navigate(homeForRole(user.role));
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setError('An account with this email already exists.');
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
        <h2 className="text-xl font-bold text-gray-900">Create account</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">New to the platform? Join us.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Full name</label>
            <input
              type="text"
              placeholder="Your Full Name"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email address</label>
            <input
              type="text"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition bg-white"
            >
              <option value="manager">Operations Manager</option>
              <option value="driver">Driver</option>
              <option value="admin">Admin</option>
            </select>
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
            Create account <span>→</span>
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400 tracking-widest">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-[#1a9e75] font-semibold cursor-pointer hover:underline"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  )
}

export default Signup