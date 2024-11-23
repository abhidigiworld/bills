import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/signup', { name, email, password });
      if (response.data.success) {
        navigate('/');
      } else {
        setError(response.data.message || 'An error occurred during sign-up');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setError('An error occurred during sign-up');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-sky-300 to-violet-400 p-4">
      <div className="flex justify-center items-center w-full h-full mt-8">
        <div className="w-full max-w-md p-6 bg-opacity-30 bg-white rounded-3xl shadow-2xl backdrop-filter backdrop-blur-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>
          {error && <p className="text-red-500 text-xs sm:text-sm mb-4 text-center">{error}</p>}
          <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700"
            >
              Sign Up
            </button>
          </form>
          <p className="text-center mt-4 text-sm">
            Already have an account?{' '}
            <Link to="/" className="text-violet-700 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
