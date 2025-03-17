import React, { useState, useEffect } from "react";
import axios from "axios";

const FetchEmployer = ({ employerId }) => {
  const [employer, setEmployer] = useState(null);

  useEffect(() => {
    const fetchEmployer = async () => {
      try {
        console.log("Fetching employer with ID:", employerId);
        const token = localStorage.getItem("token"); // Ensure user is authenticated
        const response = await axios.get(
          `http://localhost:5000/auth/getUser/${employerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEmployer(response.data);
      } catch (error) {
        console.error("Error fetching employer:", error);
      }
    };

    if (employerId) fetchEmployer();
  }, [employerId]);

  return employer ? <span>{employer.name}</span> : <span>Loading...</span>;
};

export default FetchEmployer;
