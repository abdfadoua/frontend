import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './ParticipantsEmargement.css';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from '@fortawesome/free-solid-svg-icons';
import profileIcon from "../assets/Profile.png";
import sessionsIcon from "../assets/participant.svg";
import evaluationIcon from "../assets/EvaluationParts.png";
import trainingsIcon from "../assets/trainings.png";
import logoutIcon from "../assets/logout.png";
import logo from "../assets/logo.png";
import FormateurSidebar from './FormateurSidebar';
import profilePic from "../assets/profil.png";

const ParticipantsEmargement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formations, setFormations] = useState([]);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [formateurData, setFormateurData] = useState(null);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '' 
  });
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const signatureRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  // Ajoutons un état dédié pour les données utilisateur
  const [userData, setUserData] = useState(null);
  // 1. Ajoutez un state pour l'image de profil
  const [profileImageSrc, setProfileImageSrc] = useState(profileIcon);
  // Ajouter un nouvel état pour la recherche
  const [searchTerm, setSearchTerm] = useState("");

  // Ajouter une fonction pour filtrer les participants
  const filteredParticipants = participants.filter(
    (participant) =>
      participant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Fonction pour construire l'URL de l'image
  const getProfileImageUrl = (profileImage) => {
    if (!profileImage) {
      return profileIcon;
    }
    
    // Construire l'URL complète
    const imageUrl = `http://localhost:5000/${profileImage.replace(/^\/+/, '')}`;
    return imageUrl;
  };

  // 3. Fonction pour valider si l'image existe
  const validateAndSetProfileImage = async (profileImage) => {
    if (!profileImage) {
      setProfileImageSrc(profileIcon);
      return;
    }

    const imageUrl = getProfileImageUrl(profileImage);
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        setProfileImageSrc(imageUrl);
      } else {
        console.log('Image non trouvée, utilisation de l\'icône par défaut');
        setProfileImageSrc(profileIcon);
      }
    } catch (error) {
      console.error('Erreur lors de la validation de l\'image:', error);
      setProfileImageSrc(profileIcon);
    }
  };

  useEffect(() => {
    const fetchFormations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token absent');
          navigate('/login');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/formations/formateur', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Réponse API formations:', response.data);
        setFormations(response.data);
        if (response.data.length > 0) {
          setSelectedFormation(response.data[0]);
          fetchParticipants(response.data[0].id);
        }
      } catch (error) {
        console.error('Erreur fetchFormations:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        if (error.response?.status === 401) navigate('/login');
        else alert(`Erreur: ${error.message}`);
      }
    };

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token absent');
          navigate('/login');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Réponse API notifications:', response.data);
        if (Array.isArray(response.data)) {
          setNotifications(response.data);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Erreur fetchNotifications:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        if (error.response?.status === 401) navigate('/login');
      }
    };

    // 4. Mise à jour du useEffect pour récupérer les données utilisateur
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token absent');
          navigate('/login');
          return;
        }
        
        console.log("Récupération des données utilisateur...");
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log("Données utilisateur récupérées:", response.data);
        console.log("Image de profil dans les données:", response.data.profileImage);
        
        setUserData(response.data);
        setFormateurData(response.data);
        
        // Valider et définir l'image de profil
        await validateAndSetProfileImage(response.data.profileImage);
        
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        if (error.response?.status === 401) navigate('/login');
      }
    };

    fetchFormations();
    fetchNotifications();
    fetchUserData();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [navigate]);

  const fetchParticipants = async (formationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token absent');
        navigate('/login');
        return;
      }
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Payload token:', payload);
      
      // Récupérer les participants
      const response = await axios.get(`http://localhost:5000/api/formations/${formationId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Réponse API participants:', response.data);
      
      // Filtrer les participants (sans chercher le formateur)
      const participantsList = response.data
        .filter((p) => p.id !== payload.userId)
        .map(p => ({ ...p, isExpanded: false }));
      
      setParticipants(participantsList);
      
      // Récupérer les données du formateur séparément
      if (!userData) {
        try {
          const formateurResponse = await axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Données formateur récupérées séparément:', formateurResponse.data);
          setUserData(formateurResponse.data);
          setFormateurData(formateurResponse.data);
        } catch (formateurError) {
          console.error('Erreur récupération formateur:', formateurError);
        }
      }
    } catch (error) {
      console.error('Erreur fetchParticipants:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 403) alert("Vous n'êtes pas autorisé.");
      else if (error.response?.status === 401) navigate('/login');
      else alert(`Erreur: ${error.message}`);
    }
  };

  const validateImageUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Erreur validation image URL:', error);
      return false;
    }
  };

  // Fonction utilitaire pour tester manuellement les URLs
  const testImageUrl = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      console.log('Test URL:', imageUrl, 'Status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Erreur test URL:', error);
      return false;
    }
  };

  const getProfileImageSrc = async (profileImage) => {
    if (!profileImage) {
      console.log('No profile image provided, using default icon');
      return profileIcon;
    }
    
    // Utiliser le même format d'URL que dans formateurDashboard
    const imageUrl = `http://localhost:5000/${profileImage.replace(/^\/+/, '')}`;
    const isValid = await validateImageUrl(imageUrl);
    console.log(`Image URL ${imageUrl} is ${isValid ? 'valid' : 'invalid'}`);
    return isValid ? imageUrl : profileIcon;
  };

  const handleAddParticipant = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token absent');
        navigate('/login');
        return;
      }
      
      // Validation des champs
      if (!newParticipant.firstName.trim()) {
        alert('Le prénom est obligatoire');
        return;
      }
      
      if (!newParticipant.lastName.trim()) {
        alert('Le nom est obligatoire');
        return;
      }
      
      if (!newParticipant.email.match(/^\S+@\S+\.\S+$/)) {
        alert('Veuillez entrer un email valide');
        return;
      }
      
      const response = await axios.post(
        `http://localhost:5000/api/formations/${selectedFormation.id}/request-participant`,
        newParticipant,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 201) {
        alert('Demande envoyée avec succès !');
        setIsAddParticipantOpen(false);
        setNewParticipant({ firstName: '', lastName: '', email: '', phone: '' });
        fetchParticipants(selectedFormation.id);
      }
    } catch (error) {
      console.error('Erreur handleAddParticipant:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      alert(error.response?.data?.message || 'Erreur lors de la demande. Vérifiez vos informations.');
    }
  };

  const validatePresence = async (participantId, sessionId, isPresent) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token absent');
        navigate('/login');
        return;
      }
      if (!window.confirm(`Confirmer ${isPresent ? 'présent' : 'absent'} ?`)) return;
      await axios.post(
        `http://localhost:5000/api/sessions/${sessionId}/validate`,
        { participantId, isPresent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchParticipants(selectedFormation.id);
      alert(isPresent ? 'Présence validée!' : 'Absence enregistrée!');
    } catch (error) {
      console.error('Erreur validatePresence:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureRef.current.isEmpty()) {
      const signature = signatureRef.current.toDataURL();
      setSignatureData(signature);
      setIsSignatureOpen(false);
      if (selectedFormation && selectedFormation.sessions.length > 0) {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token absent');
          navigate('/login');
          return;
        }
        const sessionId = selectedFormation.sessions[0].id;
        try {
          await axios.post(
            `http://localhost:5000/api/sessions/${sessionId}/emargement`,
            { signature },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alert('Émargement enregistré!');
          fetchParticipants(selectedFormation.id);
        } catch (error) {
          console.error('Erreur handleSaveSignature:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
          alert(error.response?.data?.message || 'Erreur lors de l\'émargement.');
        }
      }
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token absent');
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
      console.error('Erreur handleMarkAsRead:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  const toggleNotificationDetails = (notificationId) => {
    setSelectedNotification(selectedNotification === notificationId ? null : notificationId);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;
    const styles = {
      headerColor: [207, 226, 243],
      textDark: [59, 59, 59],
      textGray: [102, 102, 102],
      lineHeight: 10
    };
    doc.addImage(logo, 'PNG', margin, margin, 40, 15);
    currentY += 30;
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text("FEUILLE D'ÉMARGEMENT", pageWidth/2, currentY, { align: 'center' });
    currentY += styles.lineHeight * 2;
    const formationEndDate = new Date(selectedFormation.sessions[selectedFormation.sessions.length - 1]?.endTime || selectedFormation.date);
    autoTable(doc, {
      startY: currentY,
      head: [['Formation', 'Société', 'Période', 'Durée']],
      body: [[
        selectedFormation.title,
        'ENEDIS',
        `Du ${formatDateTime(selectedFormation.date)} au ${formatDateTime(formationEndDate)}`,
        `${selectedFormation.duration || '7h'}`
      ]],
      styles: {
        textColor: styles.textDark,
        fontSize: 10,
        cellPadding: 4
      },
      headStyles: {
        fillColor: styles.headerColor,
        textColor: styles.textDark,
        fontStyle: 'bold'
      }
    });
    currentY = doc.lastAutoTable.finalY + 15;
    participants.forEach((participant) => {
      if (currentY > doc.internal.pageSize.getHeight() - 100) {
        doc.addPage();
        currentY = margin;
      }
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Participant: ${participant.name}`, margin, currentY);
      currentY += styles.lineHeight * 1.5;
      const tableRows = selectedFormation.sessions.map(session => {
        const emargement = participant.emargements?.find(e => e.sessionId === session.id);
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        return [
          start.toLocaleDateString('fr-FR'),
          start.getHours() < 12 ? 'Matin' : 'Après-midi',
          `${start.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})} - ${end.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`,
          emargement?.signature ? 'Signé' : 'Non signé'
        ];
      });
      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Session', 'Horaire', 'Signature']],
        body: tableRows,
        styles: {
          textColor: styles.textGray,
          fontSize: 10,
          cellPadding: 4
        },
        headStyles: {
          fillColor: styles.headerColor,
          textColor: styles.textDark,
          fontStyle: 'bold'
        },
        didDrawCell: (data) => {
          if (data.column.index === 3 && data.cell.section === 'body') {
            const rowIndex = data.row.index;
            const session = selectedFormation.sessions[rowIndex];
            const emargement = participant.emargements?.find(e => e.sessionId === session.id);
            if (emargement?.signature) {
              try {
                const x = data.cell.x + 2;
                const y = data.cell.y + 2;
                const width = data.cell.width - 4;
                const height = data.cell.height - 4;
                doc.addImage(emargement.signature, 'PNG', x, y, width, height);
              } catch (error) {
                console.error('Erreur lors de l\'ajout de la signature:', error);
              }
            }
          }
        }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    });
    if (currentY > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      currentY = margin;
    }
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Signature du formateur:", margin, currentY);
    currentY += styles.lineHeight * 1.5;
    if (signatureData) {
      try {
        doc.addImage(signatureData, 'PNG', margin, currentY, 80, 40);
        currentY += 45;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`${formateurData?.name || 'Formateur'}`, margin, currentY);
        currentY += styles.lineHeight;
        doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, margin, currentY);
      } catch (error) {
        console.error('Erreur signature:', error);
      }
    } else {
      doc.setFont(undefined, 'italic');
      doc.text("Signature non disponible", margin, currentY);
    }
    currentY += styles.lineHeight * 3;
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text("Vos données sont collectées dans le cadre d'une obligation légale (Article R6332 du code du travail).", margin, footerY - 10);
    doc.text("Elles sont conservées par UNOW et ne font l'objet d'aucune diffusion à un tiers.", margin, footerY - 5);
    const fileName = `Emargement_${selectedFormation.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatEmargementDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `Fait le ${date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',


      minute: '2-digit',
      second: '2-digit'
    })}`;
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return `${diffHours}h`;
  };

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

  // Séparons clairement la récupération des données utilisateur dans un useEffect dédié
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token absent');
          navigate('/login');
          return;
        }
        
        console.log("Récupération des données utilisateur...");
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log("Données utilisateur récupérées:", response.data);
        console.log("Image de profil:", response.data.profileImage);
        
        setUserData(response.data);
        setFormateurData(response.data); // Pour maintenir la compatibilité avec le code existant
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        if (error.response?.status === 401) navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="formateur-emargement-container">
      <FormateurSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`formateur-emargement-main-content ${isSidebarOpen ? 'shifted' : 'full-width'}`}>
        <div className="formateur-emargement-dashboard-header">
          <h1>Emargement des participants</h1>
          <div className="formateur-emargement-user-profile">
            <FontAwesomeIcon
              icon={faBell}
              className="notification-icon"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setSelectedNotification(null);
              }}
            />
            <span>{userData?.name || 'Formateur'}</span>
            <img
              src={profilePic}
              alt="User Profile"
              className="rounded-circle"
              width="40"
              height="40"
            />
          </div>
        </div>

        {showNotifications && (
          <div className="formateur-emargement-notifications-popup">
            <div className="formateur-emargement-notifications-content">
              <div className="formateur-emargement-popup-header">
                <h3>Notifications</h3>
                <button
                  className="formateur-emargement-close-popup"
                  onClick={() => {
                    setShowNotifications(false);
                    setSelectedNotification(null);
                  }}
                >
                  ×
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="formateur-emargement-no-notifications">Aucune notification.</p>
              ) : (
                <ul className="formateur-emargement-notification-list">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`formateur-emargement-notification-item ${
                        notification.read ? "read" : "unread"
                      } ${selectedNotification === notification.id ? "selected" : ""}`}
                      onClick={() => toggleNotificationDetails(notification.id)}
                    >
                      <div className="formateur-emargement-notification-title">
                        {notification.message?.substring(0, 50) || "Message indisponible"}
                        {!notification.read && <span className="formateur-emargement-unread-dot"></span>}
                      </div>
                      {selectedNotification === notification.id && (
                        <div className="formateur-emargement-notification-details">
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
                          <div className="formateur-emargement-notification-actions">
                            {!notification.read && (
                              <button
                                className="formateur-emargement-action-btn formateur-emargement-read-btn"
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

        <div className="formateur-emargement-content">
          <div className="formation-selection">
            <div className="formation-select-container">
              <label htmlFor="formation-select">Formations</label>
              <select
                id="formation-select"
                onChange={(e) => {
                  const formation = formations.find((f) => f.id === parseInt(e.target.value));
                  setSelectedFormation(formation);
                  if (formation) fetchParticipants(formation.id);
                }}
                value={selectedFormation?.id || ''}
              >
                <option value="">Sélectionnez une formation</option>
                {formations.map((formation) => (
                  <option key={formation.id} value={formation.id}>
                    {formation.title} - {formatDateTime(formation.date)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedFormation && (
            <div className="tables-container">
              <div className="training-info">
                <table className="registration-table">
                  <thead>
                    <tr>
                      <th>Formation</th>
                      <th>Formateur</th>
                      <th>date du formation </th>
                      <th>Duré de la formation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedFormation.title}</td>
                      <td>{formateurData?.name || 'Non spécifié'}</td>
                      <td>
                        Du {formatDateTime(selectedFormation.date)} au{' '}
                        {selectedFormation.sessions?.length > 0
                          ? formatDateTime(selectedFormation.sessions[selectedFormation.sessions.length - 1].endTime)
                          : 'N/A'}
                      </td>
                      <td>
                        {selectedFormation.sessions?.length > 0
                          ? calculateDuration(
                              selectedFormation.sessions[0].startTime,
                              selectedFormation.sessions[selectedFormation.sessions.length - 1].endTime
                            )
                          : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="participants-section">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Rechercher un participant par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="participants-accordion">
                  {filteredParticipants.map((participant) => (
                    <div className="participant-item" key={participant.id}>
                      <div 
                        className="participant-header" 
                        onClick={() => {
                          // Toggle l'expansion du participant
                          setParticipants(participants.map(p => 
                            p.id === participant.id 
                              ? {...p, isExpanded: !p.isExpanded} 
                              : p
                          ));
                        }}
                      >
                        <div className="participant-name">
                          <span>{participant.name}</span>
                          <span className="participant-company">ENEDIS</span>
                        </div>
                        <div className="participant-toggle">
                          {participant.isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                      
                      {participant.isExpanded && (
                        <div className="participant-details">
                          <div className="participant-info">
                            <p>Email: {participant.email}</p>
                            {participant.phone && <p>Téléphone: {participant.phone}</p>}
                          </div>
                          
                          <div className="participant-sessions">
                            <table className="sessions-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Horaire</th>
                                  <th>Statut</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedFormation.sessions.map((session) => {
                                  const emargement = participant.emargements?.find((e) => e.sessionId === session.id);
                                  const sessionDate = new Date(session.startTime);
                                  const startTime = new Date(session.startTime).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
                                  const endTime = new Date(session.endTime).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
                                  
                                  return (
                                    <tr key={session.id}>
                                      <td>{sessionDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</td>
                                      <td>{startTime} - {endTime}</td>
                                      <td className="status-cell">
                                        {emargement && emargement.isPresent != null ? (
                                          <div className="status-container">
                                            <span className={emargement.isPresent ? "present" : "absent"}>
                                              {emargement.isPresent ? '✓ Présent' : '✗ Absent'}
                                            </span>
                                            {emargement.emargementDate && (
                                              <div className="emargement-date">
                                                {formatEmargementDateTime(emargement.emargementDate)}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="status-pending">En attente</span>
                                        )}
                                      </td>
                                      <td>
                                        {(!emargement || emargement.isPresent == null) && (
                                          <div className="validation-buttons">
                                            <button
                                              className="validate-btn present-btn"
                                              onClick={() => validatePresence(participant.id, session.id, true)}
                                            >
                                              ✓ Présent
                                            </button>
                                            <button
                                              className="validate-btn absent-btn"
                                              onClick={() => validatePresence(participant.id, session.id, false)}
                                            >
                                              ✗ Absent
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {signatureData && (
                <div className="signature-display">
                  <h4>Signature du formateur</h4>
                  <img src={signatureData} alt="Signature formateur" />
                </div>
              )}

              <div className="action-buttons">
                <div className="button-group">
                  <button className="emargement-btn" onClick={() => setIsSignatureOpen(true)}>
                    Mon émargement
                  </button>
                  <button className="add-participant-btn" onClick={() => setIsAddParticipantOpen(true)}>
                    Ajouter participant
                  </button>
                </div>
                <div className="download-link">
                  <button className="download-report-link" onClick={downloadPDF}>
                    Télécharger le rapport
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSignatureOpen && (
        <div className="popup-overlay">
          <div className="popup-content signature-popup">
            <h2>Signature pour émargement</h2>
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{ className: 'signature-canvas' }}
            />
            <div className="signature-buttons">
              <button onClick={() => signatureRef.current.clear()}>Effacer</button>
              <button onClick={handleSaveSignature}>Enregistrer</button>
              <button onClick={() => setIsSignatureOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {isAddParticipantOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Ajouter un participant</h2>
            
            <div className="form-group">
              <label>Prénom: <span className="required">*</span></label>
              <input
                type="text"
                value={newParticipant.firstName}
                onChange={(e) => setNewParticipant({ ...newParticipant, firstName: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Nom: <span className="required">*</span></label>
              <input
                type="text"
                value={newParticipant.lastName}
                onChange={(e) => setNewParticipant({ ...newParticipant, lastName: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email: <span className="required">*</span></label>
              <input
                type="email"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Téléphone: <span className="optional">(optionnel)</span></label>
              <input
                type="tel"
                value={newParticipant.phone}
                onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
              />
            </div>
            
            <div className="popup-buttons">
              <button onClick={handleAddParticipant}>Envoyer</button>
              <button onClick={() => {
                setIsAddParticipantOpen(false);
                setNewParticipant({ firstName: '', lastName: '', email: '', phone: '' });
              }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsEmargement;































