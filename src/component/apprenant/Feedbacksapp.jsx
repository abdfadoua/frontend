import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./feedbacksapp.css";
import profilePic from "../assets/profil.png";
import axios from "axios";
import ApprenantSidebar from "./ApprenantSidebar";
import angry from "../assets/1 (2).png";
import sad from "../assets/2.png";
import neutral from "../assets/3 (2).png";
import happy from "../assets/4.png";
import veryHappy from "../assets/5.png";

const FeedbackPage = () => {
  const [userData, setUserData] = useState(null);
  const [emargements, setEmargements] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFormationId, setSelectedFormationId] = useState(null);
  const [selectedEmargement, setSelectedEmargement] = useState(null);
  const [ratings, setRatings] = useState({
    clarity: null,
    objectives: null,
    level: null,
    trainer: null,
    materials: null,
    materialOrganization: null,
    welcomeQuality: null,
    premisesComfort: null,
  });
  const [globalRating, setGlobalRating] = useState(0);
  const [comments, setComments] = useState("");
  const [deepenSameField, setDeepenSameField] = useState("");
  const [deepenOtherField, setDeepenOtherField] = useState("");
  const [isDeepenQuestionOpen, setIsDeepenQuestionOpen] = useState(false);
  const [isPedagogicalTableOpen, setIsPedagogicalTableOpen] = useState(false);
  const [isEnvironmentTableOpen, setIsEnvironmentTableOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
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
          alert("Erreur lors de la récupération des données utilisateur.");
        }
      }
    };

    const fetchEmargementsAndFeedbacks = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoading(true);

      try {
        const emargementResponse = await axios.get("http://localhost:5000/api/emargements/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmargements(emargementResponse.data || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des émargements :", error);
        setEmargements([]);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert("Erreur lors de la récupération des émargements.");
        }
      }

      try {
        const feedbackResponse = await axios.get("http://localhost:5000/api/feedback/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedbacks(feedbackResponse.data || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des feedbacks :", error);
        setFeedbacks([]);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    fetchEmargementsAndFeedbacks();
  }, [navigate]);

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
    const values = [2, 4, 6, 8, 10];
    return values[index - 1];
  };

  const handleRatingChange = (key, valueIndex) => {
    const ratingValue = getRatingValue(valueIndex);
    setRatings((prev) => ({ ...prev, [key]: ratingValue }));
    setFormError(null);
    setSubmitSuccess(false);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return `${diffHours}h`;
  };

  const validateForm = () => {
    const requiredRatings = ["clarity", "objectives", "level", "trainer", "materials"];
    const allRequiredProvided = requiredRatings.every((key) => 
      ratings[key] !== null && ratings[key] >= 2 && ratings[key] <= 10
    );

    if (!allRequiredProvided) {
      setFormError("Veuillez remplir toutes les évaluations pédagogiques (valeurs entre 2 et 10).");
      return false;
    }

    if (ratings.clarity < 6 || ratings.objectives < 6) {
      setFormError("Clarté et objectifs doivent avoir une note d'au moins 6 (Neutre).");
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

      if (!selectedEmargement) {
        setFormError("Aucune formation sélectionnée.");
        return;
      }

      const payload = {
        emargementId: selectedEmargement.id,
        ratings: {
          clarity: ratings.clarity,
          objectives: ratings.objectives,
          level: ratings.level,
          trainer: ratings.trainer,
          materials: ratings.materials,
          materialOrganization: ratings.materialOrganization || 5,
          welcomeQuality: ratings.welcomeQuality || 5,
          premisesComfort: ratings.premisesComfort || 5,
        },
        globalRating: globalRating || 0,
        comments,
        deepenSameField,
        deepenOtherField,
      };

      await axios.post("http://localhost:5000/api/feedback/submit", payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      setSubmitSuccess(true);

      const feedbackResponse = await axios.get("http://localhost:5000/api/feedback/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(feedbackResponse.data || []);

      alert("Feedback soumis avec succès !");
    } catch (error) {
      console.error("Erreur lors de la soumission du feedback :", error);
      setFormError(error.response?.data?.error || "Erreur lors de la soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSliderChange = (value) => {
    setGlobalRating(Number(value));
    const percentage = (value / 10) * 100;
    const slider = document.querySelector('.fb-global-rating-slider');
    if (slider) {
      slider.style.background = `linear-gradient(to right, #ffc107 ${percentage}%, #e0e0e0 ${percentage}%)`;
    }
  };

  const uniqueFormations = Array.from(
    new Map(emargements.map((e) => [e.session.formation.id, e.session.formation])).values()
  );

  useEffect(() => {
    if (selectedFormationId) {
      const formationEmargements = emargements.filter(
        (e) => e.session.formation.id === parseInt(selectedFormationId)
      );

      if (formationEmargements.length > 0) {
        const emargement = formationEmargements[0];
        setSelectedEmargement(emargement);

        const existingFeedback = feedbacks.find((f) => f.emargementId === emargement.id);

        if (existingFeedback) {
          setRatings({
            clarity: existingFeedback.clarity || null,
            objectives: existingFeedback.objectives || null,
            level: existingFeedback.level || null,
            trainer: existingFeedback.trainer || null,
            materials: existingFeedback.materials || null,
            materialOrganization: existingFeedback.materialOrganization || null,
            welcomeQuality: existingFeedback.welcomeQuality || null,
            premisesComfort: existingFeedback.premisesComfort || null,
          });
          setGlobalRating(existingFeedback.globalRating || 0);
          // Update slider background for existing feedback
          const percentage = (existingFeedback.globalRating / 10) * 100;
          const slider = document.querySelector('.fb-global-rating-slider');
          if (slider) {
            slider.style.background = `linear-gradient(to right, #ffc107 ${percentage}%, #e0e0e0 ${percentage}%)`;
          }
        } else {
          setRatings({
            clarity: null,
            objectives: null,
            level: null,
            trainer: null,
            materials: null,
            materialOrganization: null,
            welcomeQuality: null,
            premisesComfort: null,
          });
          setGlobalRating(0);
          const slider = document.querySelector('.fb-global-rating-slider');
          if (slider) {
            slider.style.background = `linear-gradient(to right, #ffc107 0%, #e0e0e0 0%)`;
          }
          setComments("");
          setDeepenSameField("");
          setDeepenOtherField("");
        }
      } else {
        setSelectedEmargement(null);
        setRatings({
          clarity: null,
          objectives: null,
          level: null,
          trainer: null,
          materials: null,
          materialOrganization: null,
          welcomeQuality: null,
          premisesComfort: null,
        });
        setGlobalRating(0);
        const slider = document.querySelector('.fb-global-rating-slider');
        if (slider) {
          slider.style.background = `linear-gradient(to right, #ffc107 0%, #e0e0e0 0%)`;
        }
        setComments("");
        setDeepenSameField("");
        setDeepenOtherField("");
      }
    } else {
      setSelectedEmargement(null);
      setRatings({
        clarity: null,
        objectives: null,
        level: null,
        trainer: null,
        materials: null,
        materialOrganization: null,
        welcomeQuality: null,
        premisesComfort: null,
      });
      setGlobalRating(0);
      const slider = document.querySelector('.fb-global-rating-slider');
      if (slider) {
        slider.style.background = `linear-gradient(to right, #ffc107 0%, #e0e0e0 0%)`;
      }
      setComments("");
      setDeepenSameField("");
      setDeepenOtherField("");
    }
  }, [emargements, feedbacks, selectedFormationId]);

  return (
    <div className="fb-dashboard-container">
      <ApprenantSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`fb-main-content ${isSidebarOpen ? "shifted" : "full-width"}`}>
        <div className="fb-dashboard-header">
          <div className="fb-formation-selection">
            <select
              id="formation-select"
              value={selectedFormationId || ""}
              onChange={(e) => {
                setSelectedFormationId(e.target.value);
                setFormError(null);
                setSubmitSuccess(false);
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
          <div className="fb-header-right">
            <div className="fb-user-profile">
              <img
                src={userData?.profileImage ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, "")}` : profilePic}
                alt="User Profile"
              />
              <span>{userData?.name || "Chargement..."}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p>Chargement des données...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="fb-tables-container">
              {formError && <div className="alert alert-danger">{formError}</div>}
              {submitSuccess && <div className="alert alert-success">Feedback soumis avec succès !</div>}

              {selectedFormationId && selectedEmargement ? (
                <div className="fb-tables-wrapper">
                  <div className="fb-training-info">
                    <table className="fb-registration-table">
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
                  <div className="fb-evaluation-section">
                    <h3
                      onClick={() => setIsPedagogicalTableOpen(!isPedagogicalTableOpen)}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      Évaluation Pédagogique
                      <span style={{ marginLeft: "10px" }}>{isPedagogicalTableOpen ? "▼" : "▶"}</span>
                    </h3>
                    {isPedagogicalTableOpen && (
                      <table className="fb-registration-table">
                        <thead>
                          <tr>
                            <th>Critères</th>
                            <th><img src={angry} alt="2 points" className="fb-smiley-img" /></th>
                            <th><img src={sad} alt="4 points" className="fb-smiley-img" /></th>
                            <th><img src={neutral} alt="6 points" className="fb-smiley-img" /></th>
                            <th><img src={happy} alt="8 points" className="fb-smiley-img" /></th>
                            <th><img src={veryHappy} alt="10 points" className="fb-smiley-img" /></th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { question: "Le contenu de la formation était-il clair et bien structuré ?", key: "clarity" },
                            { question: "Les objectifs de la formation ont-ils été atteints ?", key: "objectives" },
                            { question: "Le niveau de la formation était-il adapté à vos connaissances ?", key: "level" },
                            { question: "Le formateur maîtrisait-il bien son sujet ?", key: "trainer" },
                            { question: "Les supports utilisés (présentations, documents, exercices) étaient-ils utiles ?", key: "materials" },
                          ].map((point, index) => (
                            <tr key={index}>
                              <td>{point.question}</td>
                              {[1, 2, 3, 4, 5].map((value) => (
                                <td key={value}>
                                  <button
                                    type="button"
                                    className={`fb-smiley-button ${ratings[point.key] === getRatingValue(value) ? "selected" : ""}`}
                                    onClick={() => handleRatingChange(point.key, value)}
                                  ></button>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="fb-evaluation-section">
                    <h3
                      onClick={() => setIsEnvironmentTableOpen(!isEnvironmentTableOpen)}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      Évaluation de l'Environnement
                      <span style={{ marginLeft: "10px" }}>{isEnvironmentTableOpen ? "▼" : "▶"}</span>
                    </h3>
                    {isEnvironmentTableOpen && (
                      <table className="fb-registration-table">
                        <thead>
                          <tr>
                            <th>Critères</th>
                            <th><img src={angry} alt="2 points" className="fb-smiley-img" /></th>
                            <th><img src={sad} alt="4 points" className="fb-smiley-img" /></th>
                            <th><img src={neutral} alt="6 points" className="fb-smiley-img" /></th>
                            <th><img src={happy} alt="8 points" className="fb-smiley-img" /></th>
                            <th><img src={veryHappy} alt="10 points" className="fb-smiley-img" /></th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { question: "L'organisation matérielle était-elle satisfaisante ?", key: "materialOrganization" },
                            { question: "La qualité de l'accueil était-elle bonne ?", key: "welcomeQuality" },
                            { question: "Le confort des locaux était-il adéquat ?", key: "premisesComfort" },
                          ].map((point, index) => (
                            <tr key={index}>
                              <td>{point.question}</td>
                              {[1, 2, 3, 4, 5].map((value) => (
                                <td key={value}>
                                  <button
                                    type="button"
                                    className={`fb-smiley-button ${ratings[point.key] === getRatingValue(value) ? "selected" : ""}`}
                                    onClick={() => handleRatingChange(point.key, value)}
                                  ></button>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="fb-evaluation-section">
                    <h3
                      onClick={() => setIsDeepenQuestionOpen(!isDeepenQuestionOpen)}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      Quel(s) sujet(s) souhaiteriez-vous approfondir dans le cadre d'une prochaine formation ?
                      <span style={{ marginLeft: "10px" }}>{isDeepenQuestionOpen ? "▼" : "▶"}</span>
                    </h3>
                    {isDeepenQuestionOpen && (
                      <div className="fb-skill-row">
                        <label>Dans le même domaine</label>
                        <textarea
                          value={deepenSameField}
                          onChange={(e) => setDeepenSameField(e.target.value)}
                          placeholder="Sujets à approfondir dans le même domaine..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 comment-textarea"
                          rows="4"
                        />
                        <label>Dans un autre domaine</label>
                        <textarea
                          value={deepenOtherField}
                          onChange={(e) => setDeepenOtherField(e.target.value)}
                          placeholder="Sujets à approfondir dans un autre domaine..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 comment-textarea"
                          rows="4"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedFormationId && !selectedEmargement ? (
                <p>Aucune session disponible pour cette formation.</p>
              ) : (
                <p>Veuillez sélectionner une formation.</p>
              )}
            </div>

            {selectedFormationId && selectedEmargement && (
              <div className="fb-additional-section">
                <div className="fb-skill-row">
                  <label>Évaluation Globale (0 à 10)</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={globalRating}
                      onChange={(e) => handleSliderChange(e.target.value)}
                      className="fb-global-rating-slider"
                    />
                    <span>{globalRating}</span>
                  </div>
                </div>
                <div className="fb-skill-row">
                  <label>Commentaires ou recommandations</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Ajoutez vos commentaires ici..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 comment-textarea"
                    rows="6"
                  />
                </div>
                <button
                  className="fb-submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? "Envoi en cours..." 
                    : feedbacks.some((f) => f.emargementId === selectedEmargement.id)
                      ? "Modifier le Feedback"
                      : "Soumettre"}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;


