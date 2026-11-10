import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="bg-white shadow-sm py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-sm bg-blood" aria-hidden="true"></span>
          <h1 className="text-xl sm:text-2xl font-bold text-blood-dark">Blood Donor Match</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link 
            to="/login" 
            className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-800 font-semibold hover:text-blood-dark transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-red-200 rounded-lg"
          >
            Log In
          </Link>
          <Link 
            to="/register" 
            className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blood-dark text-white rounded-lg hover:bg-blood transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-red-200"
          >
            Register as Donor
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto text-center px-4 py-12 sm:py-20 flex-grow flex flex-col justify-center items-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4 sm:mb-6">
          Connecting Voluntary Blood Donors with Verified Hospitals
        </h2>
        <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl">
          Save lives by donating blood at certified healthcare facilities near you, or request compatible donors during emergencies.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link 
            to="/register" 
            className="w-full sm:w-auto px-6 py-3.5 bg-blood-dark text-white font-medium text-base sm:text-lg rounded-lg shadow-md hover:bg-blood hover:scale-105 transition-all duration-200 text-center"
          >
            Become a Donor
          </Link>
          <Link 
            to="/register" 
            className="w-full sm:w-auto px-6 py-3.5 bg-gray-800 text-white font-medium text-base sm:text-lg rounded-lg shadow-md hover:bg-gray-900 hover:scale-105 transition-all duration-200 text-center"
          >
            Register Hospital
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 sm:py-6 text-center text-xs sm:text-sm text-gray-500 border-t">
        <p>&copy; {new Date().getFullYear()} Blood Donor Match System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;