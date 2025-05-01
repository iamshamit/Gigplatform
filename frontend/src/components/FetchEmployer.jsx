import React, { useState, useEffect } from "react";
import axios from "axios";

const FetchEmployer = ({ employerId }) => {
  const [employer, setEmployer] = useState(null);

  useEffect(() => {
    const fetchEmployer = async () => {
      try {
        

        const token = localStorage.getItem("token");
        // Ensure employerId is a string
        const id = typeof employerId === "object" ? employerId._id : employerId;

        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/auth/getUser/${id}`,
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