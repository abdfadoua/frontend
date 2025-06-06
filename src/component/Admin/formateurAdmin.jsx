import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./formateurAdmin.css";
import AdminSidebar from "./AdminSidebar";
import profilePic from "../assets/profil.png";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faSearch } from "@fortawesome/free-solid-svg-icons";
import { getImageUrl, getInitials, handleImageError } from "../../utils/imageUtils";

const FormateurAdmin = () => {
  const [userData, setUserData] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
  });
  const navigate = useNavigate();

  // Filtrer les formateurs en fonction du terme de recherche
  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

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

  // Fetch trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(
          "http://localhost:5000/api/users/trainers",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTrainers(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des formateurs:", error);
        toast.error("Erreur lors du chargement des formateurs.");
      }
    };

    fetchTrainers();
  }, []);

  // Handle delete
  const handleDelete = async (userId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce formateur ?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vous devez être connecté.");
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrainers(trainers.filter((trainer) => trainer.id !== userId));
      toast.success("Formateur supprimé avec succès.");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression du formateur.");
    }
  };

  // Handle edit
  const handleEdit = (trainer) => {
    setEditingTrainer(trainer.id);
    setFormData({
      name: trainer.name || "",
      email: trainer.email || "",
      phone: trainer.phone || "",
      city: trainer.city || "",
      country: trainer.country || "",
    });
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
    if (!token) return;

    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${editingTrainer}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setTrainers(
        trainers.map((trainer) =>
          trainer.id === editingTrainer ? { ...trainer, ...response.data } : trainer
        )
      );
      
      setEditingTrainer(null);
      toast.success("Formateur mis à jour avec succès.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour du formateur.");
    }
  };

  return (
    <div className="formateur-admin-container">
      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
      />

      <div className={`formateur-admin-main-content ${isSidebarOpen ? "shifted" : "full-width"}`}>
        <div className="formateur-admin-dashboard-header">
          <h1>Gestion des Formateurs</h1>
          <div className="formateur-admin-user-profile">
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

        <div className="formateur-admin-profile-banner">Gestion des formateurs</div>

        <div className="formateur-admin-dashboard-content">
          <div className="learner-section">
            <h2>Liste des formateurs</h2>
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
              {filteredTrainers.length > 0 ? (
                filteredTrainers.map((trainer) => (
                  <div key={trainer.id} className="learner-card">
                    {trainer.profileImage ? (
                      <img
                        src={getImageUrl(trainer.profileImage)}
                        alt={trainer.name}
                        className="learner-image"
                        onError={(e) => handleImageError(e)}
                      />
                    ) : (
                      <div className="learner-image-fallback">
                        {getInitials(trainer.name)}
                      </div>
                    )}
                    <div className="learner-info">
                      <h3>{trainer.name || "Sans nom"}</h3>
                      <p>{trainer.email}</p>
                    </div>
                    <div className="learner-actions">
                      <button 
                        className="edit-button" 
                        onClick={() => handleEdit(trainer)}
                        title="Modifier"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className="delete-button" 
                        onClick={() => handleDelete(trainer.id)}
                        title="Supprimer"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>Aucun formateur trouvé.</p>
              )}
            </div>
          </div>
        </div>

        {editingTrainer && (
          <div className="edit-modal">
            <div className="edit-modal-content">
              <h3>Modifier le formateur</h3>
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
                  <button type="submit" className="save-button">
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setEditingTrainer(null)}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormateurAdmin;
















