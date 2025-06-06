import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./validationformateur.css";
import profilePic from "../assets/profil.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFaceFrown, 
  faFaceMeh, 
  faFaceSmile, 
  faFaceGrinBeam,
  faFaceAngry
} from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FormateurSidebar from "./FormateurSidebar";

// Utility to debounce toast notifications
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const ValidationFormateur = () => {
  const [userData, setUserData] = useState(null);
  const [formations, setFormations] = useState([]);
  const [selectedFormationId, setSelectedFormationId] = useState(null);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [ratings, setRatings] = useState({
    homogeneity: null,
    informationLevel: null,
    groupLevel: null,
    participantCount: null,
    participation: null,
    assimilation: null,
    environment: null,
    welcome: null,
    technicalPlatforms: null,
  });
  const [adapted, setAdapted] = useState(null);
  const [adaptationDetails, setAdaptationDetails] = useState("");
  const [organizationRemarks, setOrganizationRemarks] = useState("");
  const [trainingImprovement, setTrainingImprovement] = useState("");
  const [environmentImprovement, setEnvironmentImprovement] = useState("");
  const [technicalImprovement, setTechnicalImprovement] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isParticipantsTableOpen, setIsParticipantsTableOpen] = useState(false);
  const [isEnvironmentTableOpen, setIsEnvironmentTableOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Définir les icônes pour les évaluations
  const ratingIcons = [
    { icon: faFaceAngry, value: 2 },
    { icon: faFaceFrown, value: 4 },
    { icon: faFaceMeh, value: 6 },
    { icon: faFaceSmile, value: 8 },
    { icon: faFaceGrinBeam, value: 10 }
  ];

  // Debounced toast functions
  const debouncedToastError = useCallback(
    debounce((message) => toast.error(message), 300),
    []
  );
  const debouncedToastSuccess = useCallback(
    debounce((message) => toast.success(message), 300),
    []
  );

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données utilisateur :", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        debouncedToastError("Erreur lors de la récupération des données utilisateur.");
      }
    }
  };

  const fetchFormationsAndEvaluations = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/formateur", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formationsData = (response.data || []).map((formation) => ({
        id: formation.id,
        title: formation.title,
        session: formation.sessions?.[0] || null,
        evaluation: formation.evaluation || null,
      }));
      setFormations(formationsData);
    } catch (error) {
      console.error("Erreur lors de la récupération des formations :", error);
      setFormations([]);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        debouncedToastError("Erreur lors de la récupération des formations.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
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

  const getRatingValue = (index) => {
    return ratingIcons[index - 1].value;
  };

  const handleRatingChange = (key, valueIndex) => {
    const ratingValue = getRatingValue(valueIndex);
    setRatings((prev) => ({ ...prev, [key]: ratingValue }));
    setFormError(null);
    setSubmitSuccess(false);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return "N/A";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  };

  const validateForm = () => {
    const requiredRatings = [
      "homogeneity",
      "informationLevel",
      "groupLevel",
      "participantCount",
      "participation",
      "assimilation",
      "environment",
      "welcome",
      "technicalPlatforms",
    ];
    const allRequiredProvided = requiredRatings.every(
      (key) => ratings[key] !== null && ratings[key] >= 2 && ratings[key] <= 10
    );
    if (!allRequiredProvided) {
      setFormError("Veuillez remplir toutes les évaluations (valeurs entre 2 et 10).");
      return false;
    }
    if (adapted === null) {
      setFormError("Veuillez indiquer si la session a été adaptée.");
      return false;
    }
    if (adapted && !adaptationDetails.trim()) {
      setFormError("Veuillez préciser comment la session a été adaptée.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(false);
    if (!validateForm()) {
      return;
    }
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      if (!selectedFormationId) {
        setFormError("Aucune formation sélectionnée.");
        return;
      }
      const payload = {
        formationId: parseInt(selectedFormationId),
        ratings,
        adapted,
        adaptationDetails: adapted ? adaptationDetails : "",
        organizationRemarks,
        trainingImprovement,
        environmentImprovement,
        technicalImprovement,
      };
      const response = await axios.post(
        "http://localhost:5000/api/formateur/evaluations/submit",
        payload,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      // Update the formations state with the new or updated evaluation
      setFormations((prevFormations) =>
        prevFormations.map((formation) =>
          formation.id === parseInt(selectedFormationId)
            ? { ...formation, evaluation: response.data }
            : formation
        )
      );
      // Update the form state to reflect the submitted/modified data
      setRatings({
        homogeneity: response.data.homogeneity || null,
        informationLevel: response.data.informationLevel || null,
        groupLevel: response.data.groupLevel || null,
        participantCount: response.data.participantCount || null,
        participation: response.data.participation || null,
        assimilation: response.data.assimilation || null,
        environment: response.data.environment || null,
        welcome: response.data.welcome || null,
        technicalPlatforms: response.data.technicalPlatforms || null,
      });
      setAdapted(response.data.adapted || null);
      setAdaptationDetails(response.data.adaptationDetails || "");
      setOrganizationRemarks(response.data.organizationRemarks || "");
      setTrainingImprovement(response.data.trainingImprovement || "");
      setEnvironmentImprovement(response.data.environmentImprovement || "");
      setTechnicalImprovement(response.data.technicalImprovement || "");
      setSubmitSuccess(true);
      debouncedToastSuccess(
        response.status === 200
          ? "Évaluation modifiée avec succès !"
          : "Évaluation soumise avec succès !"
      );
    } catch (error) {
      console.error("Erreur lors de la soumission de l'évaluation :", error);
      setFormError(error.response?.data?.error || "Erreur lors de la soumission.");
      debouncedToastError(error.response?.data?.error || "Erreur lors de la soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchFormationsAndEvaluations();
  }, [navigate]);

  useEffect(() => {
    if (selectedFormationId) {
      const formation = formations.find((f) => f.id === parseInt(selectedFormationId));
      setSelectedFormation(formation);
      if (formation?.evaluation) {
        setRatings({
          homogeneity: formation.evaluation.homogeneity || null,
          informationLevel: formation.evaluation.informationLevel || null,
          groupLevel: formation.evaluation.groupLevel || null,
          participantCount: formation.evaluation.participantCount || null,
          participation: formation.evaluation.participation || null,
          assimilation: formation.evaluation.assimilation || null,
          environment: formation.evaluation.environment || null,
          welcome: formation.evaluation.welcome || null,
          technicalPlatforms: formation.evaluation.technicalPlatforms || null,
        });
        setAdapted(formation.evaluation.adapted || null);
        setAdaptationDetails(formation.evaluation.adaptationDetails || "");
        setOrganizationRemarks(formation.evaluation.organizationRemarks || "");
        setTrainingImprovement(formation.evaluation.trainingImprovement || "");
        setEnvironmentImprovement(formation.evaluation.environmentImprovement || "");
        setTechnicalImprovement(formation.evaluation.technicalImprovement || "");
      } else {
        setRatings({
          homogeneity: null,
          informationLevel: null,
          groupLevel: null,
          participantCount: null,
          participation: null,
          assimilation: null,
          environment: null,
          welcome: null,
          technicalPlatforms: null,
        });
        setAdapted(null);
        setAdaptationDetails("");
        setOrganizationRemarks("");
        setTrainingImprovement("");
        setEnvironmentImprovement("");
        setTechnicalImprovement("");
      }
    } else {
      setSelectedFormation(null);
      setRatings({
        homogeneity: null,
        informationLevel: null,
        groupLevel: null,
        participantCount: null,
        participation: null,
        assimilation: null,
        environment: null,
        welcome: null,
        technicalPlatforms: null,
      });
      setAdapted(null);
      setAdaptationDetails("");
      setOrganizationRemarks("");
      setTrainingImprovement("");
      setEnvironmentImprovement("");
      setTechnicalImprovement("");
    }
  }, [selectedFormationId, formations]);

  return (
    <div className="vf-dashboard-container">
      <FormateurSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`vf-main-content ${isSidebarOpen ? "shifted" : "full-width"}`}>
        <div className="vf-dashboard-header">
          <div className="vf-formation-selection">
            <select
              id="formation-select"
              value={selectedFormationId || ""}
              onChange={(e) => {
                setSelectedFormationId(e.target.value);
                setFormError(null);
                setSubmitSuccess(false);
              }}
              disabled={formations.length === 0}
            >
              <option value="">Choisir une formation</option>
              {formations.map((formation) => (
                <option key={formation.id} value={formation.id}>
                  {formation.title}
                </option>
              ))}
            </select>
          </div>
          <div className="vf-header-right">
            <div className="vf-user-profile">
              <img
                src={
                  userData?.profileImage
                    ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, "")}`
                    : profilePic
                }
                alt="User Profile"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = profilePic;
                }}
              />
              <span>{userData?.name || "Chargement..."}</span>
            </div>
          </div>
        </div>
        {isLoading ? (
          <p>Chargement des données...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="vf-tables-container">
              {formError && <div className="alert alert-danger">{formError}</div>}
              {submitSuccess && (
                <div className="alert alert-success">
                  {selectedFormation?.evaluation
                    ? "Évaluation modifiée avec succès !"
                    : "Évaluation soumise avec succès !"}
                </div>
              )}
              {selectedFormationId && selectedFormation ? (
                <div className="vf-tables-wrapper">
                  <div className="vf-training-info">
                    <table className="vf-registration-table">
                      <thead>
                        <tr>
                          <th>FORMATION</th>
                          <th>Formateur</th>
                          <th>Période de formation</th>
                          <th>Durée de la formation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{selectedFormation.title}</td>
                          <td>{userData?.name || "Chargement..."}</td>
                          <td>
                            {selectedFormation.session?.startTime && selectedFormation.session?.endTime
                              ? `${formatDate(selectedFormation.session.startTime)} au ${formatDate(
                                  selectedFormation.session.endTime
                                )}`
                              : "Dates non disponibles"}
                          </td>
                          <td>
                            {selectedFormation.session?.startTime && selectedFormation.session?.endTime
                              ? calculateDuration(
                                  selectedFormation.session.startTime,
                                  selectedFormation.session.endTime
                                )
                              : "Durée non disponible"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="vf-evaluation-section">
                    <h3
                      onClick={() => setIsParticipantsTableOpen(!isParticipantsTableOpen)}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      Évaluation du groupe de participants
                      <span style={{ marginLeft: "10px" }}>{isParticipantsTableOpen ? "▼" : "▶"}</span>
                    </h3>
                    {isParticipantsTableOpen && (
                      <>
                        <table className="vf-registration-table">
                          <thead>
                            <tr>
                              <th>Critères</th>
                              {ratingIcons.map((icon, index) => (
                                <th key={index}>
                                  <FontAwesomeIcon icon={icon.icon} className="vf-smiley-img" />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              {
                                question: "L'homogénéité du groupe",
                                key: "homogeneity",
                              },
                              {
                                question: "Le niveau d'information des participants sur le stage",
                                key: "informationLevel",
                              },
                              {
                                question: "Le niveau de groupe par rapport au contenu du stage",
                                key: "groupLevel",
                              },
                              {
                                question: "Le nombre de participants",
                                key: "participantCount",
                              },
                              {
                                question: "La participation du groupe aux échanges",
                                key: "participation",
                              },
                              {
                                question: "L'assimilation de l'apprentissage par les participants",
                                key: "assimilation",
                              },
                            ].map((point, index) => (
                              <tr key={index}>
                                <td>{point.question}</td>
                                {ratingIcons.map((icon, iconIndex) => (
                                  <td key={iconIndex}>
                                    <button
                                      type="button"
                                      className={`vf-smiley-button ${
                                        ratings[point.key] === icon.value ? "selected" : ""
                                      } rating-${iconIndex + 1}`}
                                      onClick={() => handleRatingChange(point.key, iconIndex + 1)}
                                    >
                                      <span className="vf-rating-circle"></span>
                                    </button>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="vf-skill-row">
                          <label>
                            Avez-vous adapté en temps ou en contenu la session par rapport au profil des
                            participants ?
                          </label>
                          <div>
                            <label>
                              <input
                                type="radio"
                                name="adapted"
                                checked={adapted === true}
                                onChange={() => setAdapted(true)}
                              />{" "}
                              Oui
                            </label>
                            <label style={{ marginLeft: "20px" }}>
                              <input
                                type="radio"
                                name="adapted"
                                checked={adapted === false}
                                onChange={() => setAdapted(false)}
                              />{" "}
                              Non
                            </label>
                          </div>
                          {adapted && (
                            <textarea
                              value={adaptationDetails}
                              onChange={(e) => setAdaptationDetails(e.target.value)}
                              placeholder="Si oui, comment ?"
                              className="vf-comment-textarea"
                              rows="4"
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="vf-evaluation-section">
                    <h3
                      onClick={() => setIsEnvironmentTableOpen(!isEnvironmentTableOpen)}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      Évaluation de l'Environnement
                      <span style={{ marginLeft: "10px" }}>{isEnvironmentTableOpen ? "▼" : "▶"}</span>
                    </h3>
                    {isEnvironmentTableOpen && (
                      <table className="vf-registration-table">
                        <thead>
                          <tr>
                            <th>Critères</th>
                            {ratingIcons.map((icon, index) => (
                              <th key={index}>
                                <FontAwesomeIcon icon={icon.icon} className="vf-smiley-img" />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              question: "L'environnement (centre, salle de formation)",
                              key: "environment",
                            },
                            {
                              question: "L'accueil et l'accompagnement",
                              key: "welcome",
                            },
                            {
                              question: "Les plateformes techniques",
                              key: "technicalPlatforms",
                            },
                          ].map((point, index) => (
                            <tr key={index}>
                              <td>{point.question}</td>
                              {ratingIcons.map((icon, iconIndex) => (
                                <td key={iconIndex}>
                                  <button
                                    type="button"
                                    className={`vf-smiley-button ${
                                      ratings[point.key] === icon.value ? "selected" : ""
                                    } rating-${iconIndex + 1}`}
                                    onClick={() => handleRatingChange(point.key, iconIndex + 1)}
                                  >
                                    <span className="vf-rating-circle"></span>
                                  </button>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="vf-additional-section">
                    <div className="vf-skill-row">
                      <label>Vos remarques sur l'organisation</label>
                      <textarea
                        value={organizationRemarks}
                        onChange={(e) => setOrganizationRemarks(e.target.value)}
                        placeholder="Ajoutez vos remarques sur l'organisation..."
                        className="vf-comment-textarea"
                        rows="6"
                      />
                    </div>
                    <div className="vf-skill-row">
                      <label>
                        Vos propositions d'amélioration : De la formation (plan de cours, pédagogie)
                      </label>
                      <textarea
                        value={trainingImprovement}
                        onChange={(e) => setTrainingImprovement(e.target.value)}
                        placeholder="Ajoutez vos propositions pour la formation..."
                        className="vf-comment-textarea"
                        rows="4"
                      />
                    </div>
                    <div className="vf-skill-row">
                      <label>Vos propositions d'amélioration : De l'environnement</label>
                      <textarea
                        value={environmentImprovement}
                        onChange={(e) => setEnvironmentImprovement(e.target.value)}
                        placeholder="Ajoutez vos propositions pour l'environnement..."
                        className="vf-comment-textarea"
                        rows="4"
                      />
                    </div>
                    <div className="vf-skill-row">
                      <label>Vos propositions d'amélioration : Des plateformes techniques</label>
                      <textarea
                        value={technicalImprovement}
                        onChange={(e) => setTechnicalImprovement(e.target.value)}
                        placeholder="Ajoutez vos propositions pour les plateformes techniques..."
                        className="vf-comment-textarea"
                        rows="4"
                      />
                    </div>
                    <button className="vf-submit-button" type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Envoi en cours..."
                        : selectedFormation?.evaluation
                        ? "Modifier l'évaluation"
                        : "Soumettre"}
                    </button>
                  </div>
                </div>
              ) : selectedFormationId && !selectedFormation ? (
                <p>Aucune formation disponible pour cet ID.</p>
              ) : (
                <p>Veuillez sélectionner une formation.</p>
              )}
            </div>
          </form>
        )}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          limit={1} // Prevent multiple toasts from stacking
        />
      </div>
    </div>
  );
};

export default ValidationFormateur;






