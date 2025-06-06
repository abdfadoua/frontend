import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminDashboard.css";
import AdminSidebar from "./AdminSidebar";
import profilePic from "../assets/profil.png";
import axios from "axios";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const navigate = useNavigate();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté.");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data);
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

  // Handle logout
  const handleLogout = () => {
    console.log("Déconnexion: Suppression du token et redirection vers /login");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    console.log("Toggle sidebar:", isSidebarOpen ? "Fermeture" : "Ouverture");
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
      />

      <div className={`admin-main-content ${isSidebarOpen ? "shifted" : "full-width"}`}>
        <div className="admin-dashboard-header">
          <h1>Tableau de bord Admin</h1>
          <div className="admin-user-profile">
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

        <div className="profile-banner">
          Bienvenue {userData?.name || "Admin"}!
        </div>

        <div className="dashboard-content">
          <div className="admin-section">
            <h2>Gestion de la plateforme</h2>
            <p>
              Sélectionnez une option dans la barre latérale pour gérer les
              apprenants, formateurs ou statistiques.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;





