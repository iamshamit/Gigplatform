import React, { useState, useEffect } from "react";
import axios from "axios";

const FetchEmployer = ({ employerId }) => {
  const [employer, setEmployer] = useState(null);

  useEffect(() => {
    const fetchEmployer = async () => {
      try {
        // Check if the employer data is in localStorage
        const cachedEmployer = localStorage.getItem(`employer_${employerId}`);
        if (cachedEmployer) {
          setEmployer(JSON.parse(cachedEmployer));
          return;
        }

        const token = localStorage.getItem("token");
        // Ensure employerId is a string
        const id = typeof employerId === "object" ? employerId._id : employerId;

        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/auth/getUser/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Save the fetched data to localStorage
        localStorage.setItem(`employer_${employerId}`, JSON.stringify(response.data));
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