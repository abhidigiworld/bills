import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-blue-500 text-white py-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold"> <Link to={'/Main'}>Sakshi Enterprises</Link> </h1>
        <p>Providing Quality Services Since 2024</p>
      </div>
    </header>
  );
}

export default Header;
