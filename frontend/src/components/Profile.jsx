import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link, useParams } from "react-router-dom";
import "../profile.css";
import { FaStar } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        // Get current user ID
        const currentUserRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUserId(currentUserRes.data._id);

        // Get profile data
        if (userId) {
          const profileRes = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/auth/getUser/${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUser(profileRes.data);
        } else {
          setUser(currentUserRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if ([401, 403].includes(error.response?.status)) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, navigate]);

  const isCurrentUserProfile = userId ? currentUserId === userId : true;

  if (loading) {
    return (
      <div className="fullscreen-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fullscreen-container">
        <div className="error-message">User not found</div>
      </div>
    );
  }

  return (
    <div className="fullscreen-container">
      <div className="profile-card">
        <img
          src={`${user.profileImage || "default.png"}`}
          alt="Profile"
          className="profile-image"
        />
        <h2>{user.name}</h2>
        <p>{user.role}</p>
        {isCurrentUserProfile && (
          <div className="profile-actions">
            <Link to="/change-password" className="profile-button blue-button">
              Change Password
            </Link> 
            <Link
              to="/edit-profile"
              className="profile-button outline-button"
            >
              Edit Profile
            </Link>
          </div>
        )}
      </div>

      <div className="profile-details">
        {[
          { label: "Full Name", value: user.name },
          { label: "Email", value: user.email },
          { label: "Role", value: user.role },
        ].map((item, index) => (
          <div key={index} className="detail-row">
            <strong>{item.label}</strong>
            <span>{item.value || "N/A"}</span>
          </div>
        ))}

        {user.role !== "employer" && (
          <>
            <div className="detail-row">
              <strong>Skills</strong>
              <span>{user.skills?.join(", ") || "No skills listed"}</span>
            </div>
            <div className="detail-row">
              <strong>Bio</strong>
              <span>{user.bio || "No bio available"}</span>
            </div>
            <div className="detail-row">
              <strong>Rating</strong>
              <div className="rating-display" style={{ display: 'flex', alignItems: 'center' }}>
                <div className="stars"style={{ display: 'flex', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`star ${star <= Math.round(user.averageRating) ? 'filled' : 'empty'}`}
                    />
                  ))}
                </div>
                <span className="rating-text">
                  {user.averageRating.toFixed(1)} ({user.ratingCount} {user.ratingCount === 1 ? 'rating' : 'ratings'})
                </span>
              </div>
            </div>
            {isCurrentUserProfile && (
              <div className="detail-row">
                <strong>Earnings</strong>
                <span>₹{user.earnings}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;