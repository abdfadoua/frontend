import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Validation_acquis.css";
import profilePic from "../assets/profil.png";
import axios from "axios";
import ApprenantSidebar from "./ApprenantSidebar";

const ValidationAcquis = () => {
  const [userData, setUserData] = useState(null);
  const [emargements, setEmargements] = useState([]);
  const [skillValidations, setSkillValidations] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFormationId, setSelectedFormationId] = useState(null);
  const [uniqueFormations, setUniqueFormations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationProgress, setValidationProgress] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [skills, setSkills] = useState({});
  const [selectedEmargement, setSelectedEmargement] = useState(null);
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [showProgressSection, setShowProgressSection] = useState(false);
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserData(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur :", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          alert("Erreur lors de la récupération des données utilisateur. Veuillez réessayer.");
        }
      }
    };

    const fetchEmargementsAndValidations = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token manquant");
        navigate('/login');
        return;
      }

      setIsLoading(true);
      console.log("Début de la récupération des émargements et validations");

      try {
        console.log("Envoi de la requête GET à /api/emargements/user");
        const emargementResponse = await axios.get('http://localhost:5000/api/emargements/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Réponse émargements reçue:", emargementResponse);
        
        if (emargementResponse.data && Array.isArray(emargementResponse.data)) {
          setEmargements(emargementResponse.data);
          console.log('Émargements récupérés :', emargementResponse.data);
          
          // Extraire les formations uniques des émargements
          const formationsMap = new Map(
            emargementResponse.data.map((emargement) => [
              emargement.session.formation.id,
              emargement.session.formation,
            ])
          );
          const uniqueFormations = Array.from(formationsMap.values());
          console.log("Formations uniques extraites:", uniqueFormations);
          setUniqueFormations(uniqueFormations);
        } else {
          console.error('Format de réponse inattendu pour les émargements :', emargementResponse.data);
          setEmargements([]);
          alert('Aucun émargement trouvé pour cet utilisateur.');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des émargements :', error);
        console.error('Détails de l\'erreur:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        setEmargements([]);
        if (error.response?.status === 404) {
          alert("La route des émargements n'est pas disponible. Contactez l'administrateur.");
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Erreur inconnue';
          alert(`Une erreur est survenue lors de la récupération des émargements : ${errorMessage}`);
        }
      }

      try {
        const validationResponse = await axios.get('http://localhost:5000/api/validation/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (validationResponse.data && Array.isArray(validationResponse.data)) {
          setSkillValidations(validationResponse.data);
          console.log('Validations récupérées :', validationResponse.data);
        } else {
          console.log('Aucune validation trouvée pour cet utilisateur.');
          setSkillValidations([]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des validations :', error);
        setSkillValidations([]);
        if (error.response?.status === 404) {
          alert("La route des validations n'est pas disponible. Contactez l'administrateur.");
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Erreur inconnue';
          alert(`Une erreur est survenue lors de la récupération des validations : ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const fetchValidationProgress = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/validation/progress', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data && Array.isArray(response.data)) {
          setValidationProgress(response.data);
          
          // Calculer la progression globale
          if (response.data.length > 0) {
            const totalProgress = response.data.reduce((sum, item) => sum + item.progress, 0);
            setOverallProgress(Math.round(totalProgress / response.data.length));
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la progression des validations:', error);
      }
    };

    fetchUserData();
    fetchEmargementsAndValidations();
    fetchValidationProgress();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
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

  const handleSkillChange = (sectionId, type, value) => {
    setSkills((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [type]: parseInt(value),
      },
    }));
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return `${diffHours}h`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      if (!selectedEmargement) {
        alert("Aucune formation sélectionnée pour la validation.");
        return;
      }

      // Validate skills for each section
      const sections = selectedEmargement.session.formation.sections || [];
      for (const section of sections) {
        const sectionSkills = skills[section.id] || { before: 0, after: 0 };
        if (
          typeof sectionSkills.before !== 'number' ||
          typeof sectionSkills.after !== 'number' ||
          sectionSkills.before < 0 || sectionSkills.before > 10 ||
          sectionSkills.after < 0 || sectionSkills.after > 10
        ) {
          alert(`Erreur : Les valeurs pour la section "${section.title}" doivent être des nombres entre 0 et 10.`);
          return;
        }
      }

      const payload = {
        emargementId: selectedEmargement.id,
        skillsBeforeTraining: Object.fromEntries(
          Object.entries(skills).map(([sectionId, { before }]) => [sectionId, before])
        ),
        skillsAfterTraining: Object.fromEntries(
          Object.entries(skills).map(([sectionId, { after }]) => [sectionId, after])
        ),
      };
      console.log('Données envoyées dans POST /api/validation/submit :', payload);
      const response = await axios.post('http://localhost:5000/api/validation/submit', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Validation soumise avec succès !");
      const validationResponse = await axios.get('http://localhost:5000/api/validation/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (validationResponse.data && Array.isArray(validationResponse.data)) {
        setSkillValidations(validationResponse.data);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission de la validation :", error);
      if (error.response) {
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Erreur inconnue';
        alert(`Erreur lors de la soumission : ${error.response.status} - ${errorMessage}`);
      } else if (error.request) {
        alert("Erreur lors de la soumission : Aucune réponse du serveur. Vérifiez votre connexion ou le serveur.");
      } else {
        alert(`Erreur lors de la soumission : ${error.message}`);
      }
    }
  };

  useEffect(() => {
    if (emargements.length > 0) {
      const formationsMap = new Map(
        emargements.map((emargement) => [
          emargement.session.formation.id,
          emargement.session.formation,
        ])
      );
      setUniqueFormations(Array.from(formationsMap.values()));
    }
  }, [emargements]);

  useEffect(() => {
    if (selectedFormationId) {
      const formationEmargements = emargements.filter(
        (emargement) => emargement.session.formation.id === parseInt(selectedFormationId)
      );
      if (formationEmargements.length > 0) {
        const emargement = formationEmargements[0]; // Sélectionner le premier émargement
        setSelectedEmargement(emargement);
        const validation = skillValidations.find(
          (validation) => validation.emargementId === emargement.id
        );
        setSelectedValidation(validation);
        if (validation) {
          // Populate skills from existing validation
          const newSkills = {};
          for (const section of emargement.session.formation.sections || []) {
            newSkills[section.id] = {
              before: validation.skillsBeforeTraining[section.id] || 0,
              after: validation.skillsAfterTraining[section.id] || 0,
            };
          }
          setSkills(newSkills);
        } else {
          // Initialize skills for each section
          const newSkills = {};
          for (const section of emargement.session.formation.sections || []) {
            newSkills[section.id] = { before: 0, after: 0 };
          }
          setSkills(newSkills);
        }
      } else {
        setSelectedEmargement(null);
        setSelectedValidation(null);
        setSkills({});
      }
    } else {
      setSelectedEmargement(null);
      setSelectedValidation(null);
      setSkills({});
    }
  }, [selectedFormationId, emargements, skillValidations]);

  return (
    <div className="dashboard-container">
      <ApprenantSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${isSidebarOpen ? 'shifted' : 'full-width'}`}>
        <div className="dashboard-header">
          <h1>Validation des acquis</h1>
          <div className="user-profile">
            <img
              src={
                userData?.profileImage
                  ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, '')}`
                  : profilePic
              }
              alt="User Profile"
            />
            <span>{userData?.name || "Chargement..."}</span>
          </div>
        </div>

        {isLoading ? (
          <p>Chargement des données...</p>
        ) : (
          <>
            <div className="tables-container">
              <div className="formation-selection">
                <label htmlFor="formation-select">Sélectionner une formation : </label>
                <select
                  id="formation-select"
                  value={selectedFormationId || ""}
                  onChange={(e) => {
                    console.log('Formation selected:', e.target.value);
                    setSelectedFormationId(e.target.value);
                  }}
                  disabled={uniqueFormations.length === 0}
                >
                  <option value="">Choisir une formation</option>
                  {uniqueFormations.map((formation) => (
                    <option key={formation.id} value={formation.id}>
                      {formation.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFormationId && selectedEmargement ? (
                <div className="training-info">
                  <table className="registration-table">
                    <thead>
                      <tr>
                        <th>TRAINING</th>
                        <th>Participant</th>
                        <th>Training Period</th>
                        <th>The training duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{selectedEmargement.session.formation.title}</td>
                        <td>{userData?.name}</td>
                        <td>{`${formatDate(selectedEmargement.session.startTime)} au ${formatDate(selectedEmargement.session.endTime)}`}</td>
                        <td>{calculateDuration(selectedEmargement.session.startTime, selectedEmargement.session.endTime)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : selectedFormationId && !selectedEmargement ? (
                <p>Aucune session disponible pour cette formation.</p>
              ) : (
                <p>Veuillez sélectionner une formation pour afficher les informations correspondantes.</p>
              )}
            </div>

            {selectedFormationId && selectedEmargement && (
              <div className="evaluation-section">
                {(selectedEmargement.session.formation.sections || []).map((section) => (
                  <div key={section.id} className="skills-section">
                    <h2>{section.title}</h2>
                    <div className="skill-row">
                      <label>Niveau estimé avant la formation</label>
                      <div className="slider-container">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          name={`before-${section.id}`}
                          value={skills[section.id]?.before || 0}
                          onChange={(e) => handleSkillChange(section.id, 'before', e.target.value)}
                          disabled={!!selectedValidation}
                          style={{
                            background: `linear-gradient(to right, #FFBF9F 0%, #FFBF9F ${((skills[section.id]?.before || 0) / 10) * 100}%, #e0e0e0 ${((skills[section.id]?.before || 0) / 10) * 100}%, #e0e0e0 100%)`,
                          }}
                        />
                        <span>{skills[section.id]?.before || 0}/10</span>
                      </div>
                    </div>
                    <div className="skill-row">
                      <label>Niveau estimé après la formation</label>
                      <div className="slider-container">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          name={`after-${section.id}`}
                          value={skills[section.id]?.after || 0}
                          onChange={(e) => handleSkillChange(section.id, 'after', e.target.value)}
                          disabled={!!selectedValidation}
                          style={{
                            background: `linear-gradient(to right, #FFBF9F 0%, #FFBF9F ${((skills[section.id]?.after || 0) / 10) * 100}%, #e0e0e0 ${((skills[section.id]?.after || 0) / 10) * 100}%, #e0e0e0 100%)`,
                          }}
                        />
                        <span>{skills[section.id]?.after || 0}/10</span>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedEmargement.session.formation.sections?.length > 0 ? (
                  <button
                    className="submit-button"
                    onClick={handleSubmit}
                    disabled={!!selectedValidation}
                  >
                    {selectedValidation ? "Validation déjà soumise" : "Submit"}
                  </button>
                ) : (
                  <p>Aucune section disponible pour cette formation.</p>
                )}
              </div>
            )}
          </>
        )}
        {/* Affichage de la progression des validations */}
        {showProgressSection && (
          <div className="validation-summary">
            <h2>Progression des validations</h2>
            <div className="progress-container">
              <div className="skill-progress">
                <h3>Progression globale</h3>
                <div className="progress-labels">
                  <span>0%</span>
                  <span className="percentage">{overallProgress}%</span>
                  <span>100%</span>
                </div>
                <div className="progress-bars">
                  <div 
                    className="progress-before" 
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {validationProgress.map((item) => (
                <div key={item.formationId} className="skill-progress">
                  <h3>{item.formationTitle}</h3>
                  <div className="progress-labels">
                    <span>0%</span>
                    <span className="percentage">{item.progress}%</span>
                    <span>100%</span>
                  </div>
                  <div className="progress-bars">
                    <div 
                      className="progress-before" 
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton pour afficher/masquer la section de progression */}
        <button 
          className="toggle-progress-button" 
          onClick={() => setShowProgressSection(!showProgressSection)}
        >
          {showProgressSection ? "Masquer la progression" : "Afficher la progression"}
        </button>
      </div>
    </div>
  );
};

export default ValidationAcquis;









