import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./training.css";
import profilePic from "../assets/profil.png";
import trainingImage from "../assets/trainingf.jpg";
import filterIcon from "../assets/filtre.png";
import axios from "axios";
import ApprenantSidebar from "./ApprenantSidebar";

const Training = () => {
  const [trainings, setTrainings] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('phone');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/refresh-token', {
        refreshToken,
      });
      const newAccessToken = response.data.accessToken;
      localStorage.setItem('token', newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Erreur lors du renouvellement du token :', error);
      throw error;
    }
  };

  const makeAuthenticatedRequest = async (url, config) => {
    let token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    try {
      const response = await axios.get(url, {
        ...config,
        headers: { ...config.headers, Authorization: `Bearer ${token}` },
      });
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          token = await refreshAccessToken();
          const retryResponse = await axios.get(url, {
            ...config,
            headers: { ...config.headers, Authorization: `Bearer ${token}` },
          });
          return retryResponse;
        } catch (refreshError) {
          handleLogout();
          throw refreshError;
        }
      }
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found, redirecting to login");
        navigate('/login');
        return;
      }

      setIsLoading(true);
      
      try {
        const userResponse = await makeAuthenticatedRequest('http://localhost:5000/api/auth/me', {});
        setUserData(userResponse.data);
        
        const formationsResponse = await makeAuthenticatedRequest('http://localhost:5000/api/my-formations', {});
        
        const processedTrainings = formationsResponse.data.map(item => {
          const formation = item.formation;
          const firstSession = formation.sessions && formation.sessions.length > 0 
            ? formation.sessions[0] 
            : null;
          const duration = firstSession
            ? `${Math.ceil((new Date(firstSession.endTime) - new Date(firstSession.startTime)) / (1000 * 60 * 60 * 24))} jours`
            : "Non défini";

          return {
            id: formation.id,
            stage: formation.title || "Non défini",
            ref: formation.id.toString(),
            date: firstSession
              ? new Date(firstSession.startTime).toLocaleDateString('fr-FR')
              : new Date(formation.date).toLocaleDateString('fr-FR'),
            duree: duration,
            lieu: "Intra",
            type: formation.sessions && formation.sessions.length === 0 
              ? "E-learning" 
              : "Training",
            nbEvaluation: 0,
            societe: "CRONOS EUROPA LUXEMBOURG",
            rawDate: new Date(formation.date),
            category: formation.description?.includes("Web Development") ? "Web Development" : 
                     formation.description?.includes("Data Science") ? "Data Science" :
                     formation.description?.includes("Design") ? "Design" : "Other",
          };
        });
        
        setTrainings(processedTrainings);
        const uniqueCategories = [...new Set(processedTrainings.map(training => training.category))];
        setCategories(uniqueCategories);
        
        // Apply filtering to the processed trainings
        const filtered = processedTrainings.filter(training => {
          let matchesDate = true;
          const today = new Date();
          
          if (dateFilter === "upcoming") {
            matchesDate = training.rawDate >= today;
          } else if (dateFilter === "past") {
            matchesDate = training.rawDate < today;
          }
          
          return matchesDate;
        });
        
        // Set the filtered trainings
        setFilteredTrainings(filtered);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.response?.data?.message || "An error occurred while fetching data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, dateFilter]); // Add dateFilter as dependency

  return (
    <div className="training-container">
      <ApprenantSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`training-main-content ${isSidebarOpen ? "shifted" : "full-width"}`}>
        <div className="training-header-container">
          <h1 className="training-title">Formations</h1>
          <div className="training-user-profile">
            <img
              src={userData?.profileImage ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, "")}` : profilePic}
              alt="User Profile"
              className="training-user-image"
            />
            <span className="training-user-name">{userData?.name || "Chargement..."}</span>
          </div>
        </div>

        {isLoading && (
          <div className="training-loading">
            <div className="training-spinner"></div>
            <p>Loading your trainings...</p>
          </div>
        )}
        
        {error && !isLoading && (
          <div className="training-error">
            {error}
          </div>
        )}
        
        {!isLoading && !error && filteredTrainings.length === 0 && (
          <div className="training-empty-message">
            No trainings found matching your filters. Try adjusting your filter criteria.
          </div>
        )}

        {!isLoading && !error && filteredTrainings.length > 0 && (
          <div className="training-grid">
            {filteredTrainings.map((training, index) => (
              <div key={index} className="training-card">
                <img
                  src={trainingImage}
                  alt={training.stage}
                  className="training-img"
                />
                <div className="card-body">
                  {training.category !== "Other" && (
                    <span className="training-badge training-badge-category">{training.category}</span>
                  )}
                  <h5 className="card-title">{training.stage}</h5>
                  <div className="training-card-footer">
                    <span className={`training-badge ${training.type.toLowerCase() === "e-learning" ? "training-badge-elearning" : "training-badge-training"}`}>
                      {training.type}
                    </span>
                    <Link to={`/training/${training.id}`} className="training-btn">
                      Go to training
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Training;




