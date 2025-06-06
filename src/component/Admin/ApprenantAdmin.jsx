
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ApprenantAdmin.css";
import logo from "../assets/logo.png";
import profilePic from "../assets/profil.png";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faBell } from "@fortawesome/free-solid-svg-icons";
import logoutIcon from "../assets/logout.png";
import learnersIcon from "../assets/leaners.png";
import trainersIcon from "../assets/coach.png";
import statsIcon from "../assets/Chart.png";
import historyIcon from "../assets/history.png";
import AdminSidebar from "./AdminSidebar";

const LearnerManagement = () => {
  const [userData, setUserData] = useState(null);
  const [learners, setLearners] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingLearner, setEditingLearner] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentNotificationId, setCurrentNotificationId] = useState(null);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

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

  // Fetch learners
  useEffect(() => {
    const fetchLearners = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get("http://localhost:5000/api/users/learners", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLearners(response.data);
        lytic.track("view_learners_page");
      } catch (error) {
        console.error("Erreur lors de la récupération des apprenants:", error);
        if (error.response?.status === 401) {
          toast.error("Session expirée. Veuillez vous reconnecter.");
          localStorage.removeItem("token");
          navigate("/login");
        } else if (error.response?.status === 404) {
          toast.error("Endpoint apprenants non trouvé. Vérifiez le serveur.");
        } else if (error.response?.status === 500) {
          toast.error("Erreur serveur. Contactez l'administrateur.");
        } else {
          toast.error(`Erreur: ${error.message}`);
        }
      }
    };

    fetchLearners();
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
        setShowRejectionModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle delete
  const handleDelete = async (userId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet apprenant ?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vous devez être connecté.");
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLearners(learners.filter((learner) => learner.id !== userId));
      toast.success("Apprenant supprimé avec succès.");
      lytic.track("delete_learner");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      if (error.response?.status === 404) {
        toast.error("L'apprenant n'existe pas.");
      } else if (error.response?.status === 401) {
        toast.error("Non autorisé. Veuillez vous reconnecter.");
        navigate("/login");
      } else {
        toast.error("Erreur lors de la suppression de l'apprenant.");
      }
    }
  };

  // Handle edit
  const handleEdit = (learner) => {
    setEditingLearner(learner.id);
    setFormData({
      name: learner.name || "",
      email: learner.email || "",
      phone: learner.phone || "",
      city: learner.city || "",
      country: learner.country || "",
    });
    lytic.track("edit_learner");
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vous devez être connecté.");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/users/${editingLearner}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLearners(
        learners.map((learner) =>
          learner.id === editingLearner ? { ...learner, ...formData } : learner
        )
      );
      setEditingLearner(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        city: "",
        country: "",
      });
      toast.success("Apprenant mis à jour avec succès.");
      lytic.track("update_learner");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      if (error.response?.status === 404) {
        toast.error("L'apprenant n'existe pas.");
      } else if (error.response?.status === 401) {
        toast.error("Non autorisé. Veuillez vous reconnecter.");
        navigate("/login");
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur lors de la mise à jour de l'apprenant.");
      }
    }
  };

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

  // Approve request
  const handleApprove = async (notificationId, requestId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté.");
        navigate("/login");
        return;
      }

      await axios.post(
        `http://localhost:5000/api/requests/${requestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, request: { ...notif.request, status: "APPROVED" } }
            : notif
        )
      );
      toast.success("Requête approuvée avec succès.");
      lytic.track("approve_request");
    } catch (error) {
      console.error("Erreur dans handleApprove:", error);
      toast.error("Erreur lors de l'approbation de la requête.");
    }
  };

  // Open rejection modal
  const handleOpenRejectionModal = (notificationId, requestId) => {
    setShowRejectionModal(true);
    setCurrentNotificationId(notificationId);
    setRejectionReason("");
    lytic.track("open_rejection_modal");
  };

  // Handle reject request
  const handleReject = async (notificationId, requestId) => {
    if (!rejectionReason.trim()) {
      toast.error("Veuillez fournir un motif de refus.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté.");
        navigate("/login");
        return;
      }

      await axios.post(
        `http://localhost:5000/api/requests/${requestId}/reject`,
        { rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? {
                ...notif,
                request: {
                  ...notif.request,
                  status: "REJECTED",
                  rejectionReason,
                },
              }
            : notif
        )
      );
      setShowRejectionModal(false);
      setRejectionReason("");
      setCurrentNotificationId(null);
      toast.success("Requête refusée avec succès.");
      lytic.track("reject_request");
    } catch (error) {
      console.error("Erreur dans handleReject:", error);
      toast.error("Erreur lors du refus de la requête.");
    }
  };

  // Toggle notification details
  const toggleNotificationDetails = (notificationId) => {
    setSelectedNotification(selectedNotification === notificationId ? null : notificationId);
    lytic.track("toggle_notification_details");
  };

  // Ajouter une fonction pour filtrer les apprenants
  const filteredLearners = learners.filter(
    (learner) =>
      learner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="apprenant-admin-container">
      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
      />

      <div className={`apprenant-admin-main-content ${isSidebarOpen ? "shifted" : "full-width"}`}>
        <div className="apprenant-admin-dashboard-header">
          <h1>Gestion des Apprenants</h1>
          <div className="apprenant-admin-user-profile">
            <div className="apprenant-admin-notification-wrapper">
              <FontAwesomeIcon
                icon={faBell}
                className="apprenant-admin-notification-icon"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setSelectedNotification(null);
                  setShowRejectionModal(false);
                  lytic.track("toggle_notifications");
                }}
              />
              {notifications.filter((notif) => !notif.read).length > 0 && (
                <span className="apprenant-admin-notification-badge">
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
              alt="Profil Utilisateur"
            />
            <span>{userData?.name || "Admin"}</span>
          </div>
        </div>

        <div className="profile-banner">Gestion des apprenants</div>

        <div className="dashboard-content">
          <div className="learner-section">
            <h2>Liste des apprenants</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="learner-list">
              {filteredLearners.length > 0 ? (
                filteredLearners.map((learner) => (
                  <div key={learner.id} className="learner-card">
                    <img
                      src={
                        learner.profileImage
                          ? `http://localhost:5000/${learner.profileImage.replace(/^\/+/, "")}`
                          : profilePic
                      }
                      alt={learner.name}
                      className="learner-image"
                    />
                    <div className="learner-info">
                      <h3>{learner.name || "Sans nom"}</h3>
                      <p>{learner.email}</p>
                    </div>
                    <div className="learner-actions">
                      <button className="edit-button" onClick={() => handleEdit(learner)}>
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className="delete-button" onClick={() => handleDelete(learner.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>Aucun apprenant trouvé.</p>
              )}
            </div>
          </div>
        </div>

        {editingLearner && (
          <div className="edit-modal">
            <div className="edit-modal-content">
              <h3>Modifier l'apprenant</h3>
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Ville</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Pays</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-button">Enregistrer</button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setEditingLearner(null)}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showNotifications && (
          <div className="apprenant-admin-notifications-popup" ref={dropdownRef}>
            <div className="apprenant-admin-notifications-content">
              <div className="apprenant-admin-popup-header">
                <h3>Notifications</h3>
                <button
                  className="apprenant-admin-close-popup"
                  onClick={() => {
                    setShowNotifications(false);
                    setSelectedNotification(null);
                    setShowRejectionModal(false);
                  }}
                >
                  ×
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="apprenant-admin-no-notifications">Aucune notification.</p>
              ) : (
                <ul className="apprenant-admin-notification-list">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`apprenant-admin-notification-item ${
                        notification.read ? "read" : "unread"
                      } ${selectedNotification === notification.id ? "selected" : ""}`}
                      onClick={() => toggleNotificationDetails(notification.id)}
                    >
                      <div className="apprenant-admin-notification-title">
                        {notification.message?.substring(0, 50) || "Message indisponible"}
                        {!notification.read && (
                          <span className="apprenant-admin-unread-dot"></span>
                        )}
                      </div>
                      {selectedNotification === notification.id && (
                        <div className="apprenant-admin-notification-details">
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
                          <div className="apprenant-admin-notification-actions">
                            {!notification.read && (
                              <button
                                className="apprenant-admin-action-btn apprenant-admin-read-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                Marquer comme lu
                              </button>
                            )}
                            {notification.request?.status === "PENDING" && (
                              <>
                                <button
                                  className="apprenant-admin-action-btn apprenant-admin-approve-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(notification.id, notification.request.id);
                                  }}
                                >
                                  Approuver
                                </button>
                                <button
                                  className="apprenant-admin-action-btn apprenant-admin-reject-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRejectionModal(notification.id, notification.request.id);
                                  }}
                                >
                                  Refuser
                                </button>
                              </>
                            )}
                          </div>
                          {showRejectionModal &&
                            currentNotificationId === notification.id && (
                              <div className="apprenant-admin-rejection-modal">
                                <h4>Motif du refus</h4>
                                <textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Entrez le motif du refus..."
                                />
                                <div className="apprenant-admin-rejection-modal-actions">
                                  <button
                                    className="apprenant-admin-action-btn apprenant-admin-confirm-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(notification.id, notification.request.id);
                                    }}
                                    disabled={!rejectionReason.trim()}
                                  >
                                    Confirmer
                                  </button>
                                  <button
                                    className="apprenant-admin-action-btn apprenant-admin-cancel-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowRejectionModal(false);
                                      setRejectionReason("");
                                      setCurrentNotificationId(null);
                                    }}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}
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

export default LearnerManagement;







