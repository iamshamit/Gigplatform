import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="top-bar">
        <div className="logo">
          <Link to="/">GigWorkers</Link>
        </div>
        <div className="nav-buttons">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            type="button"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
          \
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-5"
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </nav>

      <header className="header text-center">
        <h1 className="text-6xl font-bold tracking-wide">
          Unlock Your Global Potential
        </h1>
        <p className="text-2xl mt-4 max-w-md mx-auto">
          Connect with top talent worldwide or turn your skills into income.
          <br />
          Where opportunities meet expertise - your future starts here.
        </p>
        <button
          className="mt-12 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          type="button"
          onClick={() => navigate("/signup")}
        >
          Get Started
        </button>
      </header>

      <footer className="footer">
        <p>
          © 2023 Freelance Nexus. Bridging talent with opportunity since 2023.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

