import React from "react";
import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-000 text-gray-800">
      <img 
        src="https://cdn.svgator.com/images/2024/04/electrocuted-caveman-animation-404-error-page.gif" 
        alt="404 Error" 
        className="w-4/12 h-80 mb-6"
      />
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6 text-lg text-center">
        Oops! The page you are looking for does not exist.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700 transition"
      >
        Go to Homepage
      </button>
    </div>
  );
};

export default ErrorPage;
