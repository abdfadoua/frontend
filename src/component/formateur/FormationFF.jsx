import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import profilePic from "../assets/profil.png";
import trainingImage from "../assets/trainingf.jpg";
import filtreImage from "../assets/filtre.png";
import "./foramteurff.css";
import FormateurSidebar from "./FormateurSidebar";

const FormateurTrainingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userData, setUserData] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // Référence pour éviter les appels multiples
  const isFetchingNotifications = useRef(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    try {
      const response = await axios.post("http://localhost:5000/api/auth/refresh-token", {
        refreshToken,
      });
      const newAccessToken = response.data.accessToken;
      localStorage.setItem("token", newAccessToken);
      return newAccessToken;
    } catch (error) {
      throw error;
    }
  };

  const makeAuthenticatedRequest = async (url, config, retryCount = 0, maxRetries = 2) => {
    let token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }
    try {
      const response = await axios.get(url, {
        ...config,
        headers: { ...config.headers, Authorization: `Bearer ${token}` },
      });
      return response;
    } catch (error) {
      if (error.response?.status === 401 && retryCount < maxRetries) {
        try {
          token = await refreshAccessToken();
          return await makeAuthenticatedRequest(url, config, retryCount + 1, maxRetries);
        } catch (refreshError) {
          handleLogout();
          throw refreshError;
        }
      }
      throw error;
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (isFetchingNotifications.current) {
      console.log("Skipping fetchNotifications: already in progress");
      return;
    }
    isFetchingNotifications.current = true;
    console.log("Fetching notifications...");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      isFetchingNotifications.current = false;
      console.log("Finished fetching notifications");
    }
  }, [navigate]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      await axios.post(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif))
      );
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const toggleNotificationDetails = (notificationId) => {
    setSelectedNotification(selectedNotification === notificationId ? null : notificationId);
  };

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found. Please log in again.");
      setIsLoading(false);
      navigate("/login");
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log("Fetching data...");
    try {
      const userResponse = await makeAuthenticatedRequest("http://localhost:5000/api/auth/me", {});
      setUserData(userResponse.data);

      const formationsResponse = await makeAuthenticatedRequest("http://localhost:5000/api/formateur", {});
      const processedTrainings = formationsResponse.data.map((formation) => {
        const firstSession = formation.sessions && formation.sessions.length > 0 ? formation.sessions[0] : null;
        const duration = firstSession
          ? `${Math.ceil((new Date(firstSession.endTime) - new Date(firstSession.startTime)) / (1000 * 60 * 60 * 24))} jours`
          : "Non défini";
        return {
          id: formation.id,
          stage: formation.title || "Non défini",
          ref: formation.id.toString(),
          date: firstSession
            ? new Date(firstSession.startTime).toLocaleDateString("fr-FR")
            : new Date(formation.date).toLocaleDateString("fr-FR"),
          duree: duration,
          lieu: "Intra",
          type: formation.sessions && formation.sessions.length === 0 ? "E-learning" : "Cours pratique intra",
          nbEvaluation: 0,
          societe: "CRONOS EUROPA LUXEMBOURG",
          rawDate: new Date(formation.date),
          category: formation.description?.includes("Web Development")
            ? "Web Development"
            : formation.description?.includes("Data Science")
            ? "Data Science"
            : formation.description?.includes("Design")
            ? "Design"
            : "Other",
        };
      });
      setTrainings(processedTrainings);
      const uniqueCategories = [...new Set(processedTrainings.map((training) => training.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.response?.data?.message || "Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
      console.log("Finished fetching data");
    }
  }, []);

  // Effect for initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect for notification polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Filtrer les formations uniquement par date
  const filteredTrainings = trainings.filter((training) => {
    let matchesDate = true;
    const today = new Date();
    if (dateFilter === "upcoming") {
      matchesDate = training.rawDate >= today;
    } else if (dateFilter === "past") {
      matchesDate = training.rawDate < today;
    }
    return matchesDate;
  });

  return (
    <div className="formateur-trainings-container">
      <FormateurSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`formateur-main-content ${isSidebarOpen ? "shifted" : "full-width"}`}>
        <div className="formateur-dashboard-header">
          <h1>Formations</h1>
          <div className="formateur-user-profile">
            <FontAwesomeIcon
              icon={faBell}
              className="notification-icon"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setSelectedNotification(null);
              }}
            />
            <img
              src={
                userData?.profileImage
                  ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, "")}`
                  : profilePic
              }
              alt="User Profile"
              className="rounded-circle"
              width="40"
              height="40"
              onError={(e) => {
                e.target.src = profilePic;
              }}
            />
            <span>{userData?.name || "Loading..."}</span>
          </div>
        </div>

        {showNotifications && (
          <div className="formateur-notifications-popup">
            <div className="formateur-notifications-content">
              <div className="formateur-popup-header">
                <h3>Notifications</h3>
                <button
                  className="formateur-close-popup"
                  onClick={() => {
                    setShowNotifications(false);
                    setSelectedNotification(null);
                  }}
                >
                  ×
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="formateur-no-notifications">Aucune notification.</p>
              ) : (
                <ul className="formateur-notification-list">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`formateur-notification-item ${
                        notification.read ? "read" : "unread"
                      } ${selectedNotification === notification.id ? "selected" : ""}`}
                      onClick={() => toggleNotificationDetails(notification.id)}
                    >
                      <div className="formateur-notification-title">
                        {notification.message?.substring(0, 50) || "Message indisponible"}
                        {!notification.read && <span className="formateur-unread-dot"></span>}
                      </div>
                      {selectedNotification === notification.id && (
                        <div className="formateur-notification-details">
                          <p><strong>Message:</strong> {notification.message || "Message indisponible"}</p>
                          {notification.request?.formation && (
                            <p><strong>Formation:</strong> {notification.request.formation.title}</p>
                          )}
                          {notification.request?.requestedBy && (
                            <p><strong>Demandé par:</strong> {notification.request.requestedBy.name || "Inconnu"}</p>
                          )}
                          {notification.request?.email && (
                            <p><strong>Email:</strong> {notification.request.email}</p>
                          )}
                          <p><strong>Date:</strong> {new Date(notification.createdAt).toLocaleString()}</p>
                          {notification.request?.status && (
                            <p>
                              <strong>Statut:</strong>{" "}
                              {notification.request.status === "APPROVED"
                                ? "Approuvé"
                                : `Refusé (${notification.request.rejectionReason || "Aucun motif fourni"})`}
                            </p>
                          )}
                          <div className="formateur-notification-actions">
                            {!notification.read && (
                              <button
                                className="formateur-action-btn formateur-read-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center my-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading your formations...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button
              className="btn btn-primary ms-3"
              onClick={() => fetchData()}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && filteredTrainings.length === 0 && (
          <div className="alert alert-info" role="alert">
            No formations found matching your filters. Try adjusting your filter criteria.
          </div>
        )}

        {!isLoading && !error && filteredTrainings.length > 0 && (
          <>
            {/* Garder uniquement le filtre par date */}
            <div className="d-flex align-items-center mb-4">
              <div className="filter-container">
                <div className="filter-input" onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}>
                  <img src={filtreImage} alt="Filter Icon" className="filter-icon" />
                  {dateFilter === "all" ? "All Dates" : dateFilter === "upcoming" ? "Upcoming" : "Past"}
                  <span className="filter-arrow">▾</span>
                </div>
                {isDateFilterOpen && (
                  <div className="filter-options">
                    <div
                      className="filter-option"
                      onClick={() => {
                        setDateFilter("all");
                        setIsDateFilterOpen(false);
                      }}
                    >
                       Dates
                    </div>
                    <div
                      className="filter-option"
                      onClick={() => {
                        setDateFilter("upcoming");
                        setIsDateFilterOpen(false);
                      }}
                    >
                      Upcoming
                    </div>
                    <div
                      className="filter-option"
                      onClick={() => {
                        setDateFilter("past");
                        setIsDateFilterOpen(false);
                      }}
                    >
                      Past
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="training-grid">
              {filteredTrainings.map((training, index) => (
                <div key={index} className="training-card">
                  <img src={trainingImage} alt={training.stage} className="training-img" />
                  <div className="card-body">
                    <span className="badge bg-warning text-dark mb-2">{training.category}</span>
                    <h5 className="card-title">{training.stage}</h5>
                    <p className="card-text">{training.date} 12:00 AM - 12:00 PM</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span
                        className={`badge ${
                          training.type.toLowerCase() === "e-learning" ? "bg-primary" : "bg-success"
                        } text-white`}
                      >
                        {training.type}
                      </span>
                      <Link to={`/formateur/training/${training.id}`} className="btn btn-warning">
                        Go to formation
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FormateurTrainingPage;








