import React, { useState } from 'react';
import axios from 'axios';
import logo from '../images/LOGO1.jpeg';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Clear any existing error message
    setError('');

    try {
      const loginData = {
        username,
        password,
      };

      // Send the POST request with the login data
      const response = await axios.post('http://localhost:3000/login', loginData);

      if (response.data.success) {
        navigate('/Main');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('An error occurred while logging in');
    }
  };

  return (
    <>
      <div className="container mx-auto mt-20 px-4 lg:px-8">
        <div className="flex justify-center mb-10">
          <img src={logo} alt="Sakshi Enterprises Logo" className="h-24 w-auto rounded-xl shadow-lg" />
        </div>
        <div className="bg-white rounded-lg shadow-md px-8 py-8 lg:w-1/3 mx-auto">
          <h2 className="text-center text-2xl font-semibold mb-6">Login</h2>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Login
            </button>
          </form>
        </div>
      </div>

    </>
  );
}

export default Login;
