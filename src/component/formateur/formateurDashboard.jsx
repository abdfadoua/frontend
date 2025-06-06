import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./formateurDashboard.css";
import profilePic from "../assets/profil.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faMapMarkerAlt, faPhone, faEdit, faBell } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FormateurSidebar from "./FormateurSidebar";

const FormateurDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [formations, setFormations] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    try {
      const response = await axios.post('http://localhost:5000/api/auth/refresh-token', { refreshToken });
      const newAccessToken = response.data.accessToken;
      localStorage.setItem('token', newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Erreur lors du renouvellement du token :', error);
      throw error;
    }
  };

  const makeAuthenticatedRequest = async (url, config = {}) => {
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

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    console.log("Début fetchUserData, token:", token ? "Présent" : "Absent");
    if (!token) {
      console.error("Token manquant dans fetchUserData");
      navigate('/login');
      return;
    }
    try {
      console.log("Envoi de la requête GET à /api/auth/me");
      const response = await makeAuthenticatedRequest('http://localhost:5000/api/auth/me', {});
      console.log("Données utilisateur reçues:", response.data);
      setUserData(response.data);
      setName(response.data.name);
      setEmail(response.data.email);
      setPhone(response.data.phone);
    } catch (error) {
      console.error("Erreur lors de la récupération des données utilisateur :", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        console.error("Erreur 401: Token invalide ou expiré, suppression du token");
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Début fetchNotifications, token:", token ? "Présent" : "Absent");
      if (!token) {
        console.error("Token manquant dans fetchNotifications");
        navigate('/login');
        return;
      }
      console.log("Envoi de la requête GET à /api/notifications");
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Notifications reçues:", response.data);
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        console.error("Format de réponse inattendu (non-tableau):", response.data);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchFormations = async () => {
    const token = localStorage.getItem('token');
    console.log("Début fetchFormations, token:", token ? "Présent" : "Absent");
    if (!token) {
      console.error("Token manquant dans fetchFormations");
      navigate('/login');
      return;
    }
    try {
      console.log("Envoi de la requête GET à /api/formateur");
      const response = await makeAuthenticatedRequest('http://localhost:5000/api/formateur', {});
      const rawFormations = response.data;
      console.log("Formations reçues (brutes):", JSON.stringify(rawFormations, null, 2));

      const processedFormations = rawFormations.map((formation) => {
        console.log(`Traitement de la formation ${formation.id}:`, {
          title: formation.title,
          nbEvaluation: formation.nbEvaluation,
          evaluationScore: formation.evaluationScore,
        });

        const firstSession = formation.sessions && formation.sessions.length > 0 
          ? formation.sessions[0] 
          : null;
        const duration = firstSession
          ? `${Math.ceil((new Date(firstSession.endTime) - new Date(firstSession.startTime)) / (1000 * 60 * 60 * 24))} jours`
          : "Non défini";

        return {
          stage: formation.title || "Non défini",
          ref: formation.id.toString(),
          date: firstSession
            ? new Date(firstSession.startTime).toLocaleDateString('fr-FR')
            : new Date(formation.date).toLocaleDateString('fr-FR'),
          duree: duration,
          lieu: "Intra",
          type: formation.sessions && formation.sessions.length === 0 
            ? "E-learning" 
            : "Cours pratique intra",
          nbEvaluation: formation.nbEvaluation || 0,
          societe: "CRONOS EUROPA LUXEMBOURG",
          evaluationScore: formation.evaluationScore || "0.00",
          scoreDetails: {
            pedagogie: formation.scorePedagogie || "0.00",
            environnement: formation.scoreEnvironnement || "0.00",
            competences: formation.scoreCompetences || "0.00",
            satisfaction: formation.scoreSatisfaction || "0.00"
          }
        };
      });

      console.log("Formations traitées:", JSON.stringify(processedFormations, null, 2));
      setFormations(processedFormations);
    } catch (error) {
      console.error("Erreur lors de la récupération des formations :", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        console.error("Erreur 401: Token invalide ou expiré, suppression du token");
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    console.log("Déconnexion: Suppression du token et redirection vers /login");
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
    console.log("Toggle sidebar:", isSidebarOpen ? "Fermeture" : "Ouverture");
    setIsSidebarOpen(!isSidebarOpen);
  };

  const togglePopup = () => {
    console.log("Toggle popup:", isPopupOpen ? "Fermeture" : "Ouverture");
    setIsPopupOpen(!isPopupOpen);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    console.log("Changement d'image de profil:", file?.name || "Aucun fichier sélectionné");
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Soumission du formulaire de mise à jour du profil:", { name, email, phone, profileImageFile });
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('city', userData.city);
      formData.append('country', userData.country);
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token manquant dans handleSubmit");
        navigate('/login');
        return;
      }
      console.log("Envoi de la requête PUT à /api/auth/update");
      const response = await axios.put('http://localhost:5000/api/auth/update', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Profil mis à jour avec succès:", response.data);
      setUserData(response.data);
      localStorage.setItem('name', response.data.name);
      localStorage.setItem('email', response.data.email);
      localStorage.setItem('phone', response.data.phone);
      togglePopup();
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données utilisateur :", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      alert("Une erreur est survenue lors de la mise à jour. Veuillez réessayer.");
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    console.log("Marquer la notification comme lue, ID:", notificationId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token manquant dans handleMarkAsRead");
        navigate('/login');
        return;
      }
      console.log("Envoi de la requête POST à /api/notifications/", notificationId, "/read");
      await axios.post(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Notification marquée comme lue avec succès");
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  const toggleNotificationDetails = (notificationId) => {
    console.log("Toggle détails notification, ID:", notificationId, "Actuel:", selectedNotification);
    setSelectedNotification(selectedNotification === notificationId ? null : notificationId);
  };

  useEffect(() => {
    console.log("Montage useEffect principal");
    fetchUserData();
    fetchFormations();
    fetchNotifications();
    const interval = setInterval(() => {
      console.log("Polling: Appel de fetchNotifications");
      fetchNotifications();
    }, 30000);
    return () => {
      console.log("Démontage useEffect, nettoyage de l'intervalle");
      clearInterval(interval);
    };
  }, [navigate]);

  console.log("Rendu du composant, état actuel:", {
    userData,
    formations: formations.length,
    notifications: notifications.length,
    showNotifications,
  });

  return (
    <div className="formateur-dashboard-container">
      <FormateurSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`formateur-main-content ${isSidebarOpen ? 'shifted' : 'full-width'}`}>
        <div className="formateur-dashboard-header">
          <h1>Profil</h1>
          <div className="formateur-user-profile">
            <FontAwesomeIcon
              icon={faBell}
              className="notification-icon"
              onClick={() => {
                console.log("Clic sur l'icône de notification, showNotifications:", !showNotifications);
                setShowNotifications(!showNotifications);
                setSelectedNotification(null);
              }}
            />
            <img
              src={
                userData?.profileImage
                  ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, '')}`
                  : profilePic
              }
              alt="Profil Utilisateur"
            />
            <span>{userData?.name || "Chargement..."}</span>
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
                    console.log("Fermeture du popup de notifications");
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
        <div className="profile-banner">Bonjour {userData?.name || "Formateur"}! Ravi de vous revoir!</div>
        <div className="profile-card">
          <img
            src={userData?.profileImage ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, '')}` : profilePic}
            alt="Profil"
            className="profile-pic"
          />
          <div className="profile-info">
            <p><FontAwesomeIcon icon={faPhone} /> {userData?.phone || "Non renseigné"}</p>
            <p><FontAwesomeIcon icon={faEnvelope} /> {userData?.email || "Non renseigné"}</p>
            <p><FontAwesomeIcon icon={faMapMarkerAlt} className="custom-icon" /> {userData?.city || "Ville non renseignée"}, {userData?.country || "Pays non renseigné"}</p>
          </div>
          <FontAwesomeIcon icon={faEdit} className="edit-icon" onClick={togglePopup} />
        </div>
        {isPopupOpen && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>Modifier le profil</h2>
              {profileImagePreview && <img src={profileImagePreview} alt="Aperçu" style={{ maxWidth: "100px", marginBottom: "10px" }} />}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nom complet</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Photo de profil</label>
                  <input
                    type="file"
                    onChange={handleImageChange}
                  />
                </div>
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={togglePopup}>Annuler</button>
              </form>
            </div>
          </div>
        )}
        <div className="dashboard-widgets">
          <div className="session-details-wrapper">
            {formations.length > 0 ? (
              <>
                {console.log("Affichage des formations:", formations)}
                <div className="session-info-container">
                  <div className="sessions-header">
                    <h2>Synthèse de la session intra</h2>
                  </div>
                  <div className="session-info">
                    <p><span className="session-label">Stage :</span> {formations[0].stage}</p>
                    <p><span className="session-label">Réf :</span> {formations[0].ref}</p>
                    <p><span className="session-label">Date :</span> {formations[0].date}</p>
                    <p><span className="session-label">Durée :</span> {formations[0].duree}</p>
                    <p><span className="session-label">Lieu :</span> {formations[0].lieu}</p>
                    <p><span className="session-label">Type de session :</span> {formations[0].type}</p>
                    <p style={{ color: "red" }}>
                      <span className="session-label">NB évaluation :</span> {formations[0].nbEvaluation ?? "N/A"}
                      {console.log("NB Evaluation affiché:", formations[0].nbEvaluation)}
                    </p>
                    <p><span className="session-label">Société :</span> {formations[0].societe}</p>
                  </div>
                </div>
                <div className="session-score-container">
                  <div className="session-score">
                    <span>{formations[0]?.evaluationScore || "0.00"}</span>
                    <span className="score-scale">/10</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {console.log("Aucune formation disponible")}
                <div className="session-info-container">
                  <div className="session-info">
                    <p>Aucune formation disponible</p>
                    <p style={{ color: "red" }}>
                      <span className="session-label">NB évaluation :</span> 0
                      {console.log("NB Evaluation affiché: 0")}
                    </p>
                  </div>
                </div>
                <div className="session-score-container">
                  <div className="session-score">
                    <span>0.00</span>
                    <span className="score-scale">/10</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormateurDashboard;





