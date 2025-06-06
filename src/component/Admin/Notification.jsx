import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import './Notification.css';
import logo from "../assets/logo.png";
import profilePic from "../assets/profil.png";
import learnersIcon from "../assets/leaners.png";
import trainersIcon from "../assets/coach.png";
import notificationsIcon from "../assets/notification.png";
import statsIcon from "../assets/Chart.png";
import logoutIcon from "../assets/logout.png";
import AdminSidebar from "./AdminSidebar";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNotifications(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          alert(`Erreur: ${error.response?.data?.message || error.message}`);
        }
      }
    };

    fetchNotifications();
  }, [navigate]);

  const handleRespond = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        navigate('/login');
        return;
      }

      await axios.post(
        `http://localhost:5000/api/participant-requests/${requestId}/respond`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Demande ${status === 'APPROVED' ? 'approuvée' : 'refusée'} avec succès.`);
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Erreur lors du traitement de la demande:', error);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        navigate('/login');
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
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="notifications-container">
      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
      />

      <div className={`notifications-main-content ${isSidebarOpen ? "shifted" : "full-width"}`}>
        <div className="notifications-dashboard-header">
          <h1>Notifications</h1>
          <div className="notifications-user-profile">
            <img
              src={
                userData?.profileImage
                  ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, '')}`
                  : profilePic
              }
              alt="User Profile"
            />
            <span>{userData?.name || "Admin"}</span>
          </div>
        </div>

        <div className="notifications-content">
          {notifications.length === 0 ? (
            <p>Aucune notification.</p>
          ) : (
            <ul className="notifications-list">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-content">
                    <div className="notification-details">
                      <p className="notification-message">{notification.message}</p>
                      <p>
                        <strong>Formation:</strong> {notification.request.formation.title}
                      </p>
                      <p>
                        <strong>Demandé par:</strong> {notification.request.requestedBy.name} |{' '}
                        <strong>Email:</strong> {notification.request.email}
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {notification.request.status !== 'PENDING' && (
                        <p>
                          <strong>Statut:</strong>{' '}
                          {notification.request.status === 'APPROVED' ? 'Approuvé' : 'Refusé'}
                        </p>
                      )}
                    </div>
                    <div className="notification-actions">
                      {!notification.read && (
                        <button
                          className="mark-read-btn"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Marquer comme lu
                        </button>
                      )}
                      {notification.request.status === 'PENDING' && (
                        <>
                          <button
                            className="approve-btn"
                            onClick={() => handleRespond(notification.request.id, 'APPROVED')}
                          >
                            Approuver
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleRespond(notification.request.id, 'REJECTED')}
                          >
                            Refuser
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;


