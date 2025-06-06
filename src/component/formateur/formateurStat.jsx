import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrophy, 
  faChartLine, 
  faGraduationCap, 
  faUsers, 
  faUserCheck 
} from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Line, Pie, Radar } from 'react-chartjs-2';
import FormateurSidebar from './FormateurSidebar';
import profilePic from "../assets/profil.png";
import './formateurStat.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const FormateurStatistique = () => {
  const [statistics, setStatistics] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFormationId, setSelectedFormationId] = useState(null);
  const [bestFormation, setBestFormation] = useState(null);
  const [globalStats, setGlobalStats] = useState({
    totalParticipants: 0,
    avgSatisfaction: 0,
    avgAttendance: 0,
    avgSkillsProgress: 0,
  });
  const [viewMode, setViewMode] = useState('global'); // 'global' ou 'specific'
  const navigate = useNavigate();
  const chartRefs = {
    attendance: useRef(null),
    feedback: useRef(null),
    validation: useRef(null),
    evaluation: useRef(null),
    attendanceTrend: useRef(null),
    skills: useRef(null),
    participants: useRef(null),
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/refresh-token', {
        refreshToken: localStorage.getItem('refreshToken'),
      });
      localStorage.setItem('token', response.data.accessToken);
      return response.data.accessToken;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/login');
      return null;
    }
  };

  // Ajout de la fonction fetchUserData manquante
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      console.log("Récupération des données utilisateur...");
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Données utilisateur reçues:", response.data);
      setUserData(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données utilisateur:", error);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) fetchUserData();
      } else {
        setError('Erreur lors de la récupération des données utilisateur: ' + error.message);
      }
    }
  };

  const fetchStatistics = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setError(null); // Réinitialiser les erreurs précédentes
    
    try {
      console.log("Récupération des statistiques...");
      const response = await axios.get('http://localhost:5000/api/formateur/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Données reçues:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setStatistics(response.data);
        processStatisticsData(response.data);
      } else {
        console.error("Format de données inattendu:", response.data);
        setError('Format de données inattendu');
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      if (error.response) {
        console.error("Détails de l'erreur:", error.response.data);
        setError(`Erreur ${error.response.status}: ${error.response.data.message || error.message}`);
      } else {
        setError(`Erreur: ${error.message}`);
      }
    }
  };

  // Fonction pour traiter les données statistiques
  const processStatisticsData = (data) => {
    if (data.length > 0) {
      console.log("Traitement des données statistiques:", data);
      
      const totalParticipants = data.reduce((sum, stat) => {
        const count = stat.participantCount || 0;
        console.log(`Formation ${stat.formationTitle}: ${count} participants`);
        return sum + count;
      }, 0);
      
      console.log("Nombre total de participants calculé:", totalParticipants);
      
      const avgSatisfaction = data.reduce((sum, stat) => 
        sum + (stat.satisfaction || 0), 0) / data.length;
      
      const avgAttendance = data.reduce((sum, stat) => 
        sum + (stat.attendanceRate || 0), 0) / data.length;
      
      const avgSkillsProgress = data.reduce((sum, stat) => 
        sum + (stat.validationProgress || 0), 0) / data.length;
      
      setGlobalStats({
        totalParticipants,
        avgSatisfaction: parseFloat(avgSatisfaction.toFixed(2)),
        avgAttendance: parseFloat(avgAttendance.toFixed(2)),
        avgSkillsProgress: parseFloat(avgSkillsProgress.toFixed(2)),
      });
      
      // Déterminer la meilleure formation
      const formationsWithScore = data.map(formation => {
        const attendanceScore = formation.attendanceRate || 0;
        const feedbackScore = formation.satisfaction || 0;
        const validationScore = formation.validationProgress || 0;
        
        const globalScore = (attendanceScore * 0.4) + (feedbackScore * 0.3) + (validationScore * 0.3);
        
        return {
          ...formation,
          globalScore: parseFloat(globalScore.toFixed(2))
        };
      });
      
      const best = formationsWithScore.sort((a, b) => b.globalScore - a.globalScore)[0];
      setBestFormation(best);
      
      if (!selectedFormationId && best) {
        setSelectedFormationId(best.formationId);
      }
    } else {
      console.log("Aucune donnée statistique reçue");
      setError("Aucune donnée statistique disponible pour ce formateur.");
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchStatistics();
  }, [navigate, selectedFormationId]);

  // Cleanup charts on component unmount
  useEffect(() => {
    return () => {
      Object.values(chartRefs).forEach((ref) => {
        if (ref.current && ref.current.destroy) {
          ref.current.destroy();
          ref.current = null;
        }
      });
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleFormationChange = (e) => {
    const formationId = e.target.value;
    setSelectedFormationId(formationId);
    setViewMode(formationId ? 'specific' : 'global');
  };
  
  // Fonction pour formater les nombres
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return parseFloat(num).toFixed(2).replace(/\.00$/, '');
  };
  
  // Ajouter une fonction pour obtenir les données de la formation sélectionnée
  const getSelectedFormationData = () => {
    if (!selectedFormationId) return null;
    return statistics.find(stat => stat.formationId === parseInt(selectedFormationId));
  };

  // Obtenir les données de la formation sélectionnée
  const selectedFormationData = getSelectedFormationData();

  // Chart data configurations
  const attendanceChartData = {
    labels: statistics.map((stat) => stat.formationTitle),
    datasets: [{
      label: 'Taux de présence (%)',
      data: statistics.map((stat) => stat.attendanceRate),
      backgroundColor: 'rgba(173, 216, 230, 0.7)',
      borderColor: 'rgba(173, 216, 230, 1)',
      borderWidth: 1,
    }],
  };

  const feedbackChartData = {
    labels: ['Clarté', 'Objectifs', 'Formateur', 'Matériel', 'Organisation', 'Accueil', 'Confort'],
    datasets: selectedFormationData ? [{
      label: selectedFormationData.formationTitle,
      data: [
        selectedFormationData.feedbackAverages?.clarity || 0,
        selectedFormationData.feedbackAverages?.objectives || 0,
        selectedFormationData.feedbackAverages?.trainer || 0,
        selectedFormationData.feedbackAverages?.materials || 0,
        selectedFormationData.feedbackAverages?.materialOrganization || 0,
        selectedFormationData.feedbackAverages?.welcomeQuality || 0,
        selectedFormationData.feedbackAverages?.premisesComfort || 0,
      ],
      backgroundColor: 'rgba(173, 216, 230, 0.7)',
      borderColor: 'rgba(173, 216, 230, 1)',
      borderWidth: 1,
      fill: true,
    }] : [],
  };

  const validationChartData = {
    labels: statistics.map((stat) => stat.formationTitle),
    datasets: [{
      label: 'Progression des validations (%)',
      data: statistics.map((stat) => stat.validationProgress),
      fill: false,
      backgroundColor: 'rgba(152, 251, 152, 0.7)',
      borderColor: 'rgba(152, 251, 152, 1)',
      tension: 0.1,
    }],
  };

  const feedbackEvaluationChartData = {
    labels: statistics.map((stat) => stat.formationTitle),
    datasets: [{
      label: 'Sessions évaluées (%)',
      data: statistics.map((stat) => stat.feedbackEvaluationRate),
      backgroundColor: [
        'rgba(173, 216, 230, 0.7)',
        'rgba(152, 251, 152, 0.7)',
        'rgba(255, 182, 193, 0.7)',
        'rgba(255, 218, 185, 0.7)',
        'rgba(221, 160, 221, 0.7)',
      ],
      borderColor: [
        'rgba(173, 216, 230, 1)',
        'rgba(152, 251, 152, 1)',
        'rgba(255, 182, 193, 1)',
        'rgba(255, 218, 185, 1)',
        'rgba(221, 160, 221, 1)',
      ],
      borderWidth: 1,
    }],
  };

  const attendanceTrendChartData = {
    labels: selectedFormationData?.sessionDates 
      ? selectedFormationData.sessionDates.map(date => new Date(date).toLocaleDateString())
      : [],
    datasets: [{
      label: 'Taux de présence (%)',
      data: selectedFormationData?.sessionAttendanceRates || [],
      fill: false,
      backgroundColor: 'rgba(173, 216, 230, 0.7)',
      borderColor: 'rgba(173, 216, 230, 1)',
      tension: 0.1,
    }],
  };
  
  const participantsChartData = {
    labels: statistics.map((stat) => stat.formationTitle),
    datasets: [{
      label: 'Nombre de participants',
      data: statistics.map((stat) => {
        const count = stat.participantCount || 0;
        console.log(`Graphique - Formation ${stat.formationTitle}: ${count} participants`);
        return count;
      }),
      backgroundColor: 'rgba(255, 182, 193, 0.7)',
      borderColor: 'rgba(255, 182, 193, 1)',
      borderWidth: 1,
    }],
  };
  
  const skillsRadarChartData = {
    labels: ['Compétences techniques', 'Compétences pratiques', 'Compréhension', 'Application', 'Autonomie'],
    datasets: selectedFormationData ? [{
      label: selectedFormationData.formationTitle,
      data: [
        selectedFormationData.skillsProgress?.technical || 0,
        selectedFormationData.skillsProgress?.practical || 0,
        selectedFormationData.skillsProgress?.understanding || 0,
        selectedFormationData.skillsProgress?.application || 0,
        selectedFormationData.skillsProgress?.autonomy || 0,
      ],
      backgroundColor: 'rgba(173, 216, 230, 0.2)',
      borderColor: 'rgba(173, 216, 230, 1)',
      pointBackgroundColor: 'rgba(173, 216, 230, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(173, 216, 230, 1)',
    }] : [],
  };

  return (
    <div className="stats-dashboard-container">
      <FormateurSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className={`stats-content ${isSidebarOpen ? 'shifted' : 'full-width'}`}>
        <header className="stats-header">
          <h1>Statistiques des formations</h1>
          <div className="stats-user-info">
            <span>{userData?.name || "Formateur"}</span>
            <img 
              src={profilePic}
              alt="User Profile"
              className="rounded-circle"
              width="40"
              height="40"
            />
          </div>
        </header>

        {error && <div className="stats-error-message">{error}</div>}

        {statistics.length === 0 && !error ? (
          <div className="stats-loading">
            Chargement des statistiques...
            <p>Si cette page reste bloquée, il est possible qu'aucune donnée ne soit disponible pour ce formateur.</p>
          </div>
        ) : (
          <>
            {/* Sélecteur de formation */}
            <div className="stats-formation-selector">
              <label htmlFor="formation-select">Sélectionner une formation:</label>
              <select 
                id="formation-select" 
                value={selectedFormationId || ''} 
                onChange={handleFormationChange}
              >
                <option value="">Toutes les formations</option>
                {statistics.map((stat) => (
                  <option key={stat.formationId} value={stat.formationId}>
                    {stat.formationTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* Affichage conditionnel des statistiques globales ou spécifiques */}
            {viewMode === 'global' ? (
              <>
                {/* Statistiques globales */}
                <div className="stats-global-metrics">
                  <div className="stats-global-metric-card">
                    <div className="stats-global-metric-icon">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="stats-global-metric-content">
                      <h3>Total des participants</h3>
                      <div className="stats-global-metric-value">
                        {globalStats.totalParticipants !== undefined ? globalStats.totalParticipants : "Chargement..."}
                      </div>
                    </div>
                  </div>
                  
                  <div className="stats-global-metric-card">
                    <div className="stats-global-metric-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="stats-global-metric-content">
                      <h3>Satisfaction moyenne</h3>
                      <div className="stats-global-metric-value">{formatNumber(globalStats.avgSatisfaction)}%</div>
                    </div>
                  </div>
                  
                  <div className="stats-global-metric-card">
                    <div className="stats-global-metric-icon">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="stats-global-metric-content">
                      <h3>Présence moyenne</h3>
                      <div className="stats-global-metric-value">{formatNumber(globalStats.avgAttendance)}%</div>
                    </div>
                  </div>
                  
                  <div className="stats-global-metric-card">
                    <div className="stats-global-metric-icon">
                      <FontAwesomeIcon icon={faGraduationCap} />
                    </div>
                    <div className="stats-global-metric-content">
                      <h3>Progression compétences</h3>
                      <div className="stats-global-metric-value">{formatNumber(globalStats.avgSkillsProgress)}%</div>
                    </div>
                  </div>
                </div>
                
                {/* Meilleure formation */}
                {bestFormation && (
                  <div className="stats-best-formation">
                    <h2>
                      <FontAwesomeIcon icon={faTrophy} style={{ color: '#FFD700', marginRight: '10px' }} />
                      Formation la plus performante: {bestFormation.formationTitle}
                    </h2>
                    <div className="stats-best-formation-content">
                      <div className="stats-metric">
                        <h3>Taux de présence</h3>
                        <div className="value">{formatNumber(bestFormation.attendanceRate)}%</div>
                      </div>
                      <div className="stats-metric">
                        <h3>Satisfaction globale</h3>
                        <div className="value">{formatNumber(bestFormation.satisfaction)}%</div>
                      </div>
                      <div className="stats-metric">
                        <h3>Progression des validations</h3>
                        <div className="value">{formatNumber(bestFormation.validationProgress)}%</div>
                      </div>
                      <div className="stats-metric">
                        <h3>Score global</h3>
                        <div className="value">{formatNumber(bestFormation.globalScore)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Statistiques spécifiques à la formation sélectionnée */}
                {selectedFormationData && (
                  <div className="stats-specific-formation">
                    <h2>Statistiques pour: {selectedFormationData.formationTitle}</h2>
                    
                    <div className="stats-global-metrics">
                      <div className="stats-global-metric-card">
                        <div className="stats-global-metric-icon">
                          <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <div className="stats-global-metric-content">
                          <h3>Nombre de participants</h3>
                          <div className="stats-global-metric-value">
                            {selectedFormationData.participantCount || 0}
                          </div>
                        </div>
                      </div>
                      
                      <div className="stats-global-metric-card">
                        <div className="stats-global-metric-icon">
                          <FontAwesomeIcon icon={faChartLine} />
                        </div>
                        <div className="stats-global-metric-content">
                          <h3>Satisfaction globale</h3>
                          <div className="stats-global-metric-value">{formatNumber(selectedFormationData.satisfaction)}%</div>
                        </div>
                      </div>
                      
                      <div className="stats-global-metric-card">
                        <div className="stats-global-metric-icon">
                          <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <div className="stats-global-metric-content">
                          <h3>Taux de présence</h3>
                          <div className="stats-global-metric-value">{formatNumber(selectedFormationData.attendanceRate)}%</div>
                        </div>
                      </div>
                      
                      <div className="stats-global-metric-card">
                        <div className="stats-global-metric-icon">
                          <FontAwesomeIcon icon={faGraduationCap} />
                        </div>
                        <div className="stats-global-metric-content">
                          <h3>Progression validations</h3>
                          <div className="stats-global-metric-value">{formatNumber(selectedFormationData.validationProgress)}%</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Graphiques pour la formation sélectionnée */}
                    <div className="stats-charts-container">
                      <div className="stats-chart-card">
                        <h2>Satisfaction par critère</h2>
                        <div className="stats-chart">
                          <Radar
                            data={feedbackChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                r: {
                                  angleLines: { display: true },
                                  suggestedMin: 0,
                                  suggestedMax: 5,
                                  ticks: { stepSize: 1 }
                                }
                              },
                              plugins: {
                                legend: { position: 'top' },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return `${context.dataset.label}: ${context.raw}/5`;
                                    }
                                  }
                                }
                              },
                              animation: {
                                duration: 2000,
                                easing: 'easeOutQuart'
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="stats-chart-card">
                        <h2>Évolution du taux de présence</h2>
                        <div className="stats-chart">
                          <Line
                            data={attendanceTrendChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 100,
                                  ticks: {
                                    callback: function(value) {
                                      return value + '%';
                                    }
                                  }
                                },
                                x: {
                                  ticks: {
                                    maxRotation: 45,
                                    minRotation: 45
                                  }
                                }
                              },
                              plugins: {
                                legend: { position: 'top' },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return `Présence: ${formatNumber(context.raw)}%`;
                                    }
                                  }
                                }
                              },
                              animation: {
                                duration: 2000,
                                easing: 'easeOutQuart'
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Tableau récapitulatif des critères de satisfaction */}
                    <div className="stats-satisfaction-table">
                      <h3>Détail des critères de satisfaction</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Critère</th>
                            <th>Note moyenne (sur 5)</th>
                            <th>Pourcentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Clarté du contenu</td>
                            <td>{formatNumber(selectedFormationData.feedbackAverages?.clarity || 0)}</td>
                            <td>{formatNumber((selectedFormationData.feedbackAverages?.clarity || 0) * 20)}%</td>
                          </tr>
                          <tr>
                            <td>Atteinte des objectifs</td>
                            <td>{formatNumber(selectedFormationData.feedbackAverages?.objectives || 0)}</td>
                            <td>{formatNumber((selectedFormationData.feedbackAverages?.objectives || 0) * 20)}%</td>
                          </tr>
                          <tr>
                            <td>Qualité du formateur</td>
                            <td>{formatNumber(selectedFormationData.feedbackAverages?.trainer || 0)}</td>
                            <td>{formatNumber((selectedFormationData.feedbackAverages?.trainer || 0) * 20)}%</td>
                          </tr>
                          <tr>
                            <td>Qualité des supports</td>
                            <td>{formatNumber(selectedFormationData.feedbackAverages?.materials || 0)}</td>
                            <td>{formatNumber((selectedFormationData.feedbackAverages?.materials || 0) * 20)}%</td>
                          </tr>
                          <tr>
                            <td>Organisation</td>
                            <td>{formatNumber(selectedFormationData.feedbackAverages?.materialOrganization || 0)}</td>
                            <td>{formatNumber((selectedFormationData.feedbackAverages?.materialOrganization || 0) * 20)}%</td>
                          </tr>
                          <tr>
                            <td>Qualité d'accueil</td>
                            <td>{formatNumber(selectedFormationData.feedbackAverages?.welcomeQuality || 0)}</td>
                            <td>{formatNumber((selectedFormationData.feedbackAverages?.welcomeQuality || 0) * 20)}%</td>
                          </tr>
                          <tr>
                            <td>Confort des locaux</td>
                            <td>{formatNumber(selectedFormationData.feedbackAverages?.premisesComfort || 0)}</td>
                            <td>{formatNumber((selectedFormationData.feedbackAverages?.premisesComfort || 0) * 20)}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default FormateurStatistique;














































