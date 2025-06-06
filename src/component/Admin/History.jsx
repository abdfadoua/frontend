import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./History.css";
import logo from "../assets/logo.png";
import profilePic from "../assets/profil.png";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import logoutIcon from "../assets/logout.png";
import learnersIcon from "../assets/leaners.png";
import trainersIcon from "../assets/coach.png";
import statsIcon from "../assets/Chart.png";
import historyIcon from "../assets/history.png";
import AdminSidebar from "./AdminSidebar";

const History = () => {
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("ALL"); // ALL, LEARNER, TRAINER, ADMIN
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Mock lytic for analytics tracking
  const lytic = {
    track: (event) => console.log(`Tracking event: ${event}`),
  };

  // Vérification initiale du token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vous devez être connecté.");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data);
        lytic.track("view_user_profile");
      } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
        if (error.response?.status === 401) {
          toast.error("Session expirée. Veuillez vous reconnecter.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          toast.error("Erreur lors du chargement du profil.");
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  // Fetch history
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté.");
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data)) {
        setHistory(response.data);
        lytic.track("view_history_page");
      } else {
        console.error("Format de réponse inattendu (non-tableau):", response.data);
        setHistory([]);
      }
    } catch (error) {
      console.error("Erreur dans fetchHistory:", error);
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("Erreur lors de la récupération de l'historique.");
      }
    }
  };

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, [navigate]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté.");
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data)) {
        setNotifications(response.data);
        lytic.track("fetch_notifications");
      } else {
        console.error("Format de réponse inattendu (non-tableau):", response.data);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Erreur dans fetchNotifications:", error);
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("Erreur lors de la récupération des notifications.");
      }
    }
  };

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Fermer la liste déroulante si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
        setSelectedNotification(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/login");
    lytic.track("logout");
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    lytic.track("toggle_sidebar");
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté.");
        navigate("/login");
        return;
      }

      await axios.post(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      toast.success("Notification marquée comme lue.");
      lytic.track("mark_notification_read");
    } catch (error) {
      console.error("Erreur dans handleMarkAsRead:", error);
      toast.error("Erreur lors du marquage de la notification comme lue.");
    }
  };

  // Toggle notification details
  const toggleNotificationDetails = (notificationId) => {
    setSelectedNotification(selectedNotification === notificationId ? null : notificationId);
    lytic.track("toggle_notification_details");
  };

  // Filter history based on actor type
  const filteredHistory = history.filter((item) =>
    filter === "ALL" ? true : item.actorType === filter
  );

  // Map action types to readable text
  const getActionText = (action, details) => {
    switch (action) {
      case "APPROVE_REQUEST":
        return `Demande approuvée pour "${details.formationTitle}"`;
      case "REJECT_REQUEST":
        return `Demande refusée pour "${details.formationTitle}" (Motif: ${details.rejectionReason || "Non spécifié"})`;
      case "UPDATE_LEARNER":
        return `Apprenant "${details.userName}" modifié`;
      case "DELETE_LEARNER":
        return `Apprenant "${details.userName}" supprimé`;
      case "UPDATE_TRAINER":
        return `Formateur "${details.userName}" modifié`;
      case "DELETE_TRAINER":
        return `Formateur "${details.userName}" supprimé`;
      default:
        return "Action inconnue";
    }
  };

  return (
    <div className="history-admin-container">
      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
      />

      <div className={`history-admin-main-content ${isSidebarOpen ? "shifted" : "full-width"}`}>
        <div className="history-admin-header">
          <h1>Historique des Actions</h1>
          <div className="history-admin-user-profile">
            <div className="history-admin-notification-wrapper">
              <FontAwesomeIcon
                icon={faBell}
                className="history-admin-notification-icon"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setSelectedNotification(null);
                  lytic.track("toggle_notifications");
                }}
              />
              {notifications.filter((notif) => !notif.read).length > 0 && (
                <span className="history-admin-notification-badge">
                  {notifications.filter((notif) => !notif.read).length}
                </span>
              )}
            </div>
            <img
              src={
                userData?.profileImage
                  ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, "")}`
                  : profilePic
              }
              alt="User Profile"
            />
            <span>{userData?.name || "Admin"}</span>
          </div>
        </div>

        <div className="history-admin-banner">Historique</div>

        <div className="history-admin-content">
          <div className="history-admin-section">
            <div className="history-admin-filter">
              <label htmlFor="actor-filter">Filtrer par acteur :</label>
              <select
                id="actor-filter"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  lytic.track("filter_history");
                }}
              >
                <option value="ALL">Tous</option>
                <option value="LEARNER">Apprenant</option>
                <option value="TRAINER">Formateur</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="history-admin-table">
              {filteredHistory.length > 0 ? (
                <table className="history-admin-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Acteur</th>
                      <th>Date</th>
                      <th>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{getActionText(item.action, item.details)}</td>
                        <td>{item.actorType}</td>
                        <td>{new Date(item.createdAt).toLocaleString()}</td>
                        <td>
                          {item.action.includes("REQUEST") && (
                            <span>Demande #{item.details.requestId}</span>
                          )}
                          {item.action.includes("LEARNER") && (
                            <span>Apprenant #{item.details.userId}</span>
                          )}
                          {item.action.includes("TRAINER") && (
                            <span>Formateur #{item.details.userId}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Aucune action trouvée.</p>
              )}
            </div>
          </div>
        </div>

        {showNotifications && (
          <div className="history-admin-notifications-dropdown" ref={dropdownRef}>
            <div className="history-admin-notifications-content">
              <div className="history-admin-popup-header">
                <h3>Notifications</h3>
                <button
                  className="history-admin-close-dropdown"
                  onClick={() => {
                    setShowNotifications(false);
                    setSelectedNotification(null);
                    lytic.track("close_notifications");
                  }}
                >
                  ×
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="history-admin-no-notifications">Aucune notification.</p>
              ) : (
                <ul className="history-admin-notification-list">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`history-admin-notification-item ${
                        notification.read ? "read" : "unread"
                      } ${selectedNotification === notification.id ? "selected" : ""}`}
                      onClick={() => toggleNotificationDetails(notification.id)}
                    >
                      <div className="history-admin-notification-title">
                        {notification.message?.substring(0, 50) || "Message indisponible"}
                        {!notification.read && (
                          <span className="history-admin-unread-dot"></span>
                        )}
                      </div>
                      {selectedNotification === notification.id && (
                        <div className="history-admin-notification-details">
                          <p>
                            <strong>Message:</strong>{" "}
                            {notification.message || "Message indisponible"}
                          </p>
                          {notification.request?.formation && (
                            <p>
                              <strong>Formation:</strong>{" "}
                              {notification.request.formation.title}
                            </p>
                          )}
                          {notification.request?.requestedBy && (
                            <p>
                              <strong>Demandé par:</strong>{" "}
                              {notification.request.requestedBy.name || "Inconnu"}
                            </p>
                          )}
                          {notification.request?.email && (
                            <p>
                              <strong>Email:</strong> {notification.request.email}
                            </p>
                          )}
                          <p>
                            <strong>Date:</strong>{" "}
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                          {notification.request?.status && (
                            <p>
                              <strong>Statut:</strong>{" "}
                              {notification.request.status === "APPROVED"
                                ? "Approuvé"
                                : notification.request.status === "REJECTED"
                                ? `Refusé (${notification.request.rejectionReason || "Aucun motif fourni"})`
                                : "En attente"}
                            </p>
                          )}
                          <div className="history-admin-notification-actions">
                            {!notification.read && (
                              <button
                                className="history-admin-action-btn history-admin-read-btn"
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
      </div>
    </div>
  );
};

export default History;






