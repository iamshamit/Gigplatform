import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
        if (error.response && error.response.status === 401||error.response && error.response.status === 400) {
          // Token is invalid or expired, redirect to login page
          navigate('/login');
        }
      }
    };

    fetchUser();
  }, [navigate]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {user.role === 'freelancer' ? (
        <FreelancerDashboard user={user} />
      ) : (
        <EmployerDashboard user={user} />
      )}
    </div>
  );
};

const FreelancerDashboard = ({ user }) => (
  <section className="dashboard-container">
  <h2>Freelancer Profile</h2>
  <div className="profile-container">
    <img src={`http://localhost:5000/uploads/${user.profilePicture}`} alt="Profile" />
    <p><strong>Name:</strong> {user.name}</p>
    <p><strong>Email:</strong> {user.email}</p>
    <p><strong>Skills:</strong> {user.skills.join(', ')}</p>
    <p><strong>Bio:</strong> {user.bio}</p>
  </div>
  <nav className="button-container">
    <Link to="/edit-profile"><button>Edit Profile</button></Link>
    <Link to="/change-password"><button>Change Password</button></Link>
  </nav>
</section>
);

const EmployerDashboard = ({ user }) => (
  <section className="dashboard-container">
    <h2>Employer Profile</h2>
    <div className="profile-container">
      <img src={`http://localhost:5000/uploads/${user.profilePicture}`} alt="Profile" />
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
    </div>
    <nav className="button-container">
      <Link to="/edit-profile"><button>Edit Profile</button></Link>
      <Link to="/change-password"><button>Change Password</button></Link>
    </nav>
  </section>
);

export default Profile;