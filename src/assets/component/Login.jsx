import React, { useState } from 'react';
import axios from 'axios';
import logo from '../images/LOGO1.jpeg';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const loginData = { username, password };
      const response = await axios.post('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/login', loginData);

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

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gradient-to-r from-sky-300 to-violet-400 p-4">
        {/* Glassy Header */}
        <div className="flex items-center justify-center h-auto bg-transparent mt-2">
          <header className="w-full sm:w-3/5 py-4 text-white text-center font-bold text-4xl rounded-xl animate-fade-in">
            <h1 className="tracking-wider text-shadow-lg text-white drop-shadow-lg font-sans">
              Sakshi Enterprises
            </h1>
          </header>
        </div>

        {/* Main Content */}
        <div className="flex justify-center items-center w-full h-full mt-2">
          {/* Outer Wrapper for Centering */}
          <div className="w-full max-w-2xl lg:max-w-4xl p-6 bg-opacity-30 bg-white rounded-3xl shadow-2xl backdrop-filter backdrop-blur-lg">
            <div className="flex flex-col lg:flex-row justify-center items-center w-full space-y-6 lg:space-y-0 lg:space-x-10">

              {/* Carousel Section */}
              <div className="w-full lg:w-1/2 p-4 sm:p-8 flex justify-center">
                <div className="w-full max-w-md">
                  <Slider {...carouselSettings}>
                    <div>
                      <img
                        src="https://png.pngtree.com/png-vector/20240309/ourmid/pngtree-hvac-cooler-devices-design-illustration-png-image_11906717.png"
                        alt="Slide 1"
                        className="rounded-lg shadow-lg object-contain w-full max-h-64 sm:max-h-80 lg:max-h-full"
                      />
                    </div>
                    <div>
                      <img
                        src="https://png.pngtree.com/png-vector/20240529/ourmid/pngtree-hvac-service-with-character-design-png-image_12531963.png"
                        alt="Slide 2"
                        className="rounded-lg shadow-lg object-contain w-full max-h-64 sm:max-h-80 lg:max-h-full"
                      />
                    </div>
                  </Slider>
                </div>
              </div>

              {/* Login Form Section */}
              <div className="w-full lg:w-1/2 p-8 sm:p-10 bg-white bg-opacity-40 backdrop-blur-md rounded-3xl shadow-lg animate-fade-in">
                <div className="flex justify-center mb-6 opacity-90 animate-slide-down">
                  <img src={logo} alt="Sakshi Enterprises Logo" className="h-20 w-auto rounded-xl shadow-lg sm:h-24" />
                </div>

                {error && <p className="text-red-500 text-xs sm:text-sm mb-4 text-center">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-5">
                  <div>
                    <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2">Username:</label>
                    <input
                      className="shadow appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all duration-200"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2">Password:</label>
                    <input
                      className="shadow appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all duration-200"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg w-full transform transition-transform duration-200 hover:scale-105 focus:outline-none focus:shadow-outline "
                  >

                    Log In
                    <span className='hover:animate-ping'>  .......✈</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>


    </>
  );
}

export default Login;
