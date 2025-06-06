import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./statapprenant.css";
import profilePic from "../assets/profil.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBell, 
  faChartLine, 
  faGraduationCap, 
  faTrophy, 
  faCertificate,
  faStar,
  faArrowUp,
  faBook
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import Chart from "chart.js/auto";
import { Bar, Line, Doughnut, PolarArea, Pie } from 'react-chartjs-2';
import ApprenantSidebar from "./ApprenantSidebar";

const StatApprenant = () => {
  const [statistics, setStatistics] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bestFormation, setBestFormation] = useState(null);
  const [formations, setFormations] = useState([]);
  const [selectedFormationId, setSelectedFormationId] = useState(null);
  const [formationCount, setFormationCount] = useState(0);
  const [certificateCount, setCertificateCount] = useState(0);
  const navigate = useNavigate();
  const chartRefs = {
    attendance: useRef(null),
    feedback: useRef(null),
    satisfaction: useRef(null),
    doughnut: useRef(null),
  };
  const funnelChartRef = useRef(null);
  const funnelChartInstance = useRef(null);

  // Log selected formation for debugging
  useEffect(() => {
    console.log('Formation sélectionnée:', selectedFormationId);
    console.log('Meilleure formation:', bestFormation?.formationId);
  }, [selectedFormationId, bestFormation]);

  // Fonction pour formater les nombres avec 0 décimale (entier)
  const formatNumber = (value) => {
    return parseFloat(value).toFixed(0);
  };

  // Convert satisfaction scores (0-5) to percentage (0-100)
  const convertSatisfactionScore = (score) => {
    if (score === null || score === undefined) return 0;
    const numScore = parseFloat(score);
    return numScore > 5 ? numScore : (numScore / 5) * 100;
  };

  // Display score with 2 decimals and % symbol
  const displayScore = (score) => {
    return formatNumber(convertSatisfactionScore(score)) + '%';
  };

  // Convert scores to a 10-point scale
  const convertToScaleOfTen = (score) => {
    return (convertSatisfactionScore(score) / 100) * 10;
  };

  // Fetch user data
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
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Erreur lors de la récupération des données utilisateur');
      }
    }
  };

  // Fetch learner statistics
  const fetchStatistics = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      console.log('Récupération des statistiques apprenant...');
      setError(null);
      const response = await axios.get('http://localhost:5000/api/statistics/learner/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Statistiques reçues:', response.data);
      
      // Vérifier la structure de la réponse
      if (!response.data) {
        setStatistics([]);
        setBestFormation(null);
        console.log('Aucune statistique disponible');
        return;
      }
      
      // Si la réponse contient des compteurs, les utiliser
      if (response.data && response.data.counts) {
        setFormationCount(response.data.counts.formations || 0);
        setCertificateCount(response.data.counts.certificates || 0);
      }
      
      // Extraire les formations de la réponse
      let filteredStats = [];
      if (response.data.formations && Array.isArray(response.data.formations)) {
        filteredStats = response.data.formations;
      } else if (Array.isArray(response.data)) {
        filteredStats = response.data;
      } else {
        console.warn("filteredStats n'était pas un tableau, conversion effectuée");
        filteredStats = [];
      }
      
      // Calculer la meilleure formation si des données sont disponibles
      if (filteredStats.length > 0) {
        // Calculer les scores pour chaque formation
        const formationsWithScores = filteredStats.map(formation => {
          const attendanceScore = formation.attendanceRate || 0;
          const satisfactionScore = formation.satisfaction || 0;
          const progressScore = formation.skillsProgress || 0;
          
          // Score global pondéré
          const globalScore = (attendanceScore * 0.3) + (satisfactionScore * 0.4) + (progressScore * 0.3);
          
          return {
            ...formation,
            globalScore: parseFloat(globalScore.toFixed(2))
          };
        });
        
        // Trier par score global
        formationsWithScores.sort((a, b) => b.globalScore - a.globalScore);
        
        // Définir la meilleure formation
        setBestFormation(formationsWithScores[0]);
      } else {
        setBestFormation(null);
      }
      
      setStatistics(filteredStats);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        setError(`Erreur lors de la récupération des statistiques: ${errorMessage}`);
        setStatistics([]);
        setBestFormation(null);
      }
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  // Fetch formations - Correction pour récupérer correctement les formations
  const fetchFormations = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      console.log('Récupération des formations...');
      const response = await axios.get('http://localhost:5000/api/statistics/learner/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Réponse API formations:', response.data);
      
      // Vérifier la structure de la réponse et extraire les formations
      let formationsData = [];
      
      if (response.data && response.data.formations && Array.isArray(response.data.formations)) {
        formationsData = response.data.formations;
      } else if (Array.isArray(response.data)) {
        formationsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Si la réponse est un objet mais pas un tableau, essayer d'extraire les formations
        // des statistiques
        if (response.data.statistics && Array.isArray(response.data.statistics)) {
          formationsData = response.data.statistics;
        } else {
          // Dernier recours: convertir l'objet en tableau si possible
          const possibleFormations = Object.values(response.data).find(val => Array.isArray(val));
          if (possibleFormations) {
            formationsData = possibleFormations;
          }
        }
      }
      
      console.log('Formations extraites:', formationsData);
      
      // S'assurer que chaque formation a un ID et un titre
      const validFormations = formationsData.filter(f => f && (f.formationId || f.id) && (f.formationTitle || f.title));
      
      // Normaliser les données des formations
      const normalizedFormations = validFormations.map(f => ({
        formationId: f.formationId || f.id,
        formationTitle: f.formationTitle || f.title
      }));
      
      console.log('Formations normalisées:', normalizedFormations);
      setFormations(normalizedFormations);
      
      // Si aucune formation n'est sélectionnée et qu'il y a des formations disponibles,
      // sélectionner la première formation
      if (!selectedFormationId && normalizedFormations.length > 0) {
        setSelectedFormationId(normalizedFormations[0].formationId);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
      setFormations([]);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  // Fonctions de test utilisant les routes statiques
  const testFormationCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await axios.get('http://localhost:5000/api/statistics/learner/formations/test', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Réponse API test formations:', response.data);
      
      if (response.data && response.data.count !== undefined) {
        setFormationCount(response.data.count);
      }
    } catch (error) {
      console.error('Erreur lors du test formations:', error.response?.data || error.message);
    }
  };

  const testCertificateCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await axios.get('http://localhost:5000/api/statistics/learner/certificates/test', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Réponse API test certificats:', response.data);
      
      if (response.data && response.data.count !== undefined) {
        setCertificateCount(response.data.count);
      }
    } catch (error) {
      console.error('Erreur lors du test certificats:', error.response?.data || error.message);
    }
  };

  // Ajouter cette fonction pour récupérer les compteurs
  const fetchCounts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      console.log('Récupération des compteurs via la route principale...');
      
      // Utiliser la route principale qui fonctionne déjà
      const response = await axios.get('http://localhost:5000/api/statistics/learner/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Réponse API pour les compteurs:', response.data);
      
      // Calculer les compteurs à partir des données reçues
      if (response.data && Array.isArray(response.data)) {
        // Nombre de formations = nombre d'éléments dans le tableau
        setFormationCount(response.data.length);
        
        // Nombre de certificats = formations avec un taux de présence de 100%
        const certificateCount = response.data.filter(
          formation => formation.attendanceRate === 100
        ).length;
        
        setCertificateCount(certificateCount);
        
        console.log('Compteurs calculés:', {
          formations: response.data.length,
          certificates: certificateCount
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des compteurs:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Ne pas réinitialiser les compteurs en cas d'erreur
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  // Pour tester, remplacez les appels dans useEffect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
      fetchFormations();
      fetchCounts(); // Ajouter cette ligne
      fetchStatistics();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Refetch statistics when selected formation changes
  useEffect(() => {
    if (selectedFormationId !== null) {
      fetchStatistics();
    }
  }, [selectedFormationId]);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      Object.values(chartRefs).forEach((ref) => {
        if (ref.current && ref.current.destroy) {
          ref.current.destroy();
          ref.current = null;
        }
      });
      if (funnelChartInstance.current) {
        funnelChartInstance.current.destroy();
        funnelChartInstance.current = null;
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Generate attendance chart data
  const generateAttendanceChartData = (stats) => {
    const shortenTitle = (title) => {
      if (!title) return '';
      if (title.length > 15) return title.substring(0, 12) + '...';
      return title;
    };
    return {
      labels: stats.map(stat => shortenTitle(stat.formationTitle)),
      datasets: [
        {
          type: 'bar',
          label: 'Taux de présence',
          data: stats.map(stat => stat.attendanceRate),
          backgroundColor: 'rgba(173, 216, 230, 0.7)',
          borderColor: 'rgba(173, 216, 230, 1)',
          borderWidth: 1,
          order: 2,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        },
        {
          type: 'line',
          label: 'Tendance',
          data: stats.map(stat => stat.attendanceRate),
          borderColor: 'rgba(135, 206, 250, 1)',
          backgroundColor: 'rgba(135, 206, 250, 0.2)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointBackgroundColor: 'rgba(135, 206, 250, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(135, 206, 250, 1)',
          pointRadius: 3,
          order: 1
        }
      ]
    };
  };

  // Generate satisfaction chart data
  const generateSatisfactionChartData = (feedbackAverages) => {
    const criteria = [
      { key: 'clarity', label: 'Clarté du contenu' },
      { key: 'objectives', label: 'Atteinte des objectifs' },
      { key: 'trainer', label: 'Qualité du formateur' },
      { key: 'materials', label: 'Qualité des supports' },
      { key: 'materialOrganization', label: 'Organisation' },
      { key: 'welcomeQuality', label: 'Qualité d\'accueil' },
      { key: 'premisesComfort', label: 'Confort des locaux' }
    ];
    return {
      labels: criteria.map(c => c.label),
      datasets: [
        {
          label: 'Satisfaction',
          data: criteria.map(c => convertSatisfactionScore(feedbackAverages[c.key] || 0)),
          backgroundColor: 'rgba(173, 216, 230, 0.2)',
          borderColor: 'rgba(173, 216, 230, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(173, 216, 230, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(173, 216, 230, 1)'
        }
      ]
    };
  };

  // Generate doughnut chart data
  const generateDoughnutChartData = (skillsBefore, skillsAfter) => {
    return {
      labels: ['Compétences acquises', 'Compétences à acquérir'],
      datasets: [
        {
          data: [formatNumber(skillsAfter/10), formatNumber(10 - skillsAfter/10)],
          backgroundColor: ['rgba(173, 216, 230, 0.8)', 'rgba(240, 240, 240, 0.2)'],
          borderColor: ['rgba(173, 216, 230, 1)', 'rgba(240, 240, 240, 1)'],
          borderWidth: 1
        }
      ]
    };
  };

  // Generate funnel chart data
  const generateFunnelChartData = (feedbackAverages) => {
    return {
      labels: [
        'Clarté du contenu',
        'Atteinte des objectifs',
        'Qualité du formateur',
        'Qualité des supports',
        'Organisation',
        'Qualité d\'accueil',
        'Confort des locaux'
      ],
      datasets: [{
        data: [
          convertSatisfactionScore(feedbackAverages?.clarity || 0),
          convertSatisfactionScore(feedbackAverages?.objectives || 0),
          convertSatisfactionScore(feedbackAverages?.trainer || 0),
          convertSatisfactionScore(feedbackAverages?.materials || 0),
          convertSatisfactionScore(feedbackAverages?.materialOrganization || 0),
          convertSatisfactionScore(feedbackAverages?.welcomeQuality || 0),
          convertSatisfactionScore(feedbackAverages?.premisesComfort || 0)
        ],
        backgroundColor: [
          'rgba(255, 182, 193, 0.7)',
          'rgba(173, 216, 230, 0.7)',
          'rgba(255, 218, 185, 0.7)',
          'rgba(152, 251, 152, 0.7)',
          'rgba(221, 160, 221, 0.7)',
          'rgba(176, 224, 230, 0.7)',
          'rgba(255, 228, 196, 0.7)'
        ]
      }]
    };
  };

  // Create custom funnel chart
  const createFunnelChart = (ctx, data) => {
    const labels = data.labels;
    const values = data.datasets[0].data;
    const colors = data.datasets[0].backgroundColor;
    const sortedIndices = values.map((value, index) => ({ value, index }))
      .sort((a, b) => b.value - a.value)
      .map(item => item.index);
    const sortedLabels = sortedIndices.map(i => labels[i]);
    const sortedValues = sortedIndices.map(i => values[i]);
    const sortedColors = sortedIndices.map(i => colors[i]);
    return new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels: sortedLabels,
        datasets: [{
          data: sortedValues,
          backgroundColor: sortedColors,
          borderColor: sortedColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${formatNumber(context.raw)}%`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return formatNumber(value) + '%';
              },
              font: { size: 14 }
            }
          },
          y: {
            ticks: {
              font: { weight: 'bold', size: 14 }
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    });
  };

  // Manage funnel chart
  useEffect(() => {
    if (statistics.length > 0 && funnelChartRef.current) {
      const ctx = funnelChartRef.current.getContext('2d');
      if (funnelChartInstance.current) {
        funnelChartInstance.current.destroy();
      }
      funnelChartInstance.current = createFunnelChart(ctx, generateFunnelChartData(statistics[0].feedbackAverages));
    }
    return () => {
      if (funnelChartInstance.current) {
        funnelChartInstance.current.destroy();
      }
    };
  }, [statistics]);

  // Ajouter cette fonction pour générer les données du graphique de certificats et formations
  const generateCertificatesChartData = () => {
    console.log('Génération des données du graphique avec:', certificateCount, formationCount);
    return {
      labels: ['Certificats obtenus', 'Formations suivies'],
      datasets: [{
        label: 'Nombre',
        data: [certificateCount || 0, formationCount || 0], // Assurer des valeurs par défaut
        backgroundColor: [
          'rgba(255, 215, 0, 0.7)',  // Or pour les certificats
          'rgba(173, 216, 230, 0.7)'  // Bleu ciel pour les formations
        ],
        borderColor: [
          'rgba(255, 215, 0, 1)',
          'rgba(173, 216, 230, 1)'
        ],
        borderWidth: 1
      }]
    };
  };

  // Ajouter cette fonction pour générer les données du graphique en donut
  const generateCertificationRateChartData = () => {
    const certificationRate = formationCount > 0 
      ? (certificateCount / formationCount) * 100 
      : 0;
    
    return {
      labels: ['Formations certifiées', 'Formations non certifiées'],
      datasets: [{
        data: [certificationRate, 100 - certificationRate],
        backgroundColor: [
          'rgba(255, 215, 0, 0.7)',  // Or pour les certifiées
          'rgba(220, 220, 220, 0.7)'  // Gris pour les non certifiées
        ],
        borderColor: [
          'rgba(255, 215, 0, 1)',
          'rgba(220, 220, 220, 1)'
        ],
        borderWidth: 1
      }]
    };
  };

  // Ajouter cette fonction de débogage
  const debugAxiosError = (error) => {
    console.group('Débogage Axios Error');
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Stack:', error.stack);
    
    if (error.response) {
      console.group('Response Error');
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
      console.groupEnd();
    } else if (error.request) {
      console.group('Request Error (No Response)');
      console.log('Request:', error.request);
      console.groupEnd();
    }
    
    console.log('Config:', error.config);
    console.groupEnd();
  };

  // Fonction pour filtrer les formations - Correction
  const filterFormations = () => {
    console.log('Filtrage des formations avec ID:', selectedFormationId);
    console.log('Statistiques disponibles:', statistics);
    
    if (!statistics || statistics.length === 0) {
      console.log('Aucune statistique disponible pour le filtrage');
      return [];
    }
    
    // Si aucune formation n'est sélectionnée, retourner toutes les formations
    if (!selectedFormationId) {
      console.log('Aucune formation sélectionnée, retour de toutes les statistiques');
      return statistics;
    }
    
    // Convertir selectedFormationId en nombre pour la comparaison
    const formationIdNum = parseInt(selectedFormationId, 10);
    
    // Filtrer par ID de formation
    const filtered = statistics.filter(formation => {
      const formationId = formation.formationId || formation.id;
      const match = formationId === formationIdNum;
      console.log(`Comparaison: ${formationId} === ${formationIdNum} => ${match}`);
      return match;
    });
    
    console.log('Résultat du filtrage:', filtered);
    return filtered;
  };

  // Mettre à jour la fonction handleFormationChange
  const handleFormationChange = (e) => {
    const formationId = e.target.value;
    console.log('Formation sélectionnée:', formationId);
    setSelectedFormationId(formationId ? parseInt(formationId, 10) : null);
  };

  // Dans le useEffect, ajouter selectedFormationId comme dépendance
  useEffect(() => {
    fetchStatistics();
    fetchFormations();
    fetchCounts();
  }, [navigate, selectedFormationId]);

  return (
    <div className="learner-stats-container">
      <ApprenantSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className={`learner-stats-content ${isSidebarOpen ? 'shifted' : 'full-width'}`}>
        <header className="learner-stats-header">
          <h1>Vos Statistiques</h1>
          <div className="learner-stats-profile">
            <FontAwesomeIcon
              icon={faBell}
              className="learner-stats-notification-icon"
              onClick={() => setShowNotifications(!showNotifications)}
            />
            <img
              src={userData?.profileImage ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, '')}` : profilePic}
              alt="User Profile"
            />
            <span>{userData?.name || 'Apprenant'}</span>
          </div>
        </header>

        {error && <div className="learner-stats-error">{error}</div>}

        {formations.length > 0 && (
          <div className="learner-stats-formation-selector">
            <label htmlFor="formation-select">Formation :</label>
            <select
              id="formation-select"
              value={selectedFormationId || ""}
              onChange={handleFormationChange}
              className="learner-stats-select"
            >
              <option value="">Toutes les formations</option>
              {formations.map((formation) => (
                <option key={formation.formationId} value={formation.formationId}>
                  {formation.formationTitle}
                </option>
              ))}
            </select>
          </div>
        )}

        {statistics.length === 0 && !error ? (
          <div className="learner-stats-loading">Chargement des statistiques...</div>
        ) : (
          <>
            {bestFormation && (
              <div className="learner-stats-best-formation">
                <h2>
                  <FontAwesomeIcon icon={faTrophy} style={{ color: '#FFD700', marginRight: '10px' }} />
                  Votre meilleure formation: {bestFormation.formationTitle}
                </h2>
                <div className="learner-stats-best-formation-content">
                  <div className="learner-stats-metric">
                    <h3>Taux de présence</h3>
                    <div className="value">{formatNumber(bestFormation.attendanceRate)}%</div>
                  </div>
                  <div className="learner-stats-metric">
                    <h3>Satisfaction</h3>
                    <div className="value">{formatNumber(convertSatisfactionScore(bestFormation.feedbackAverages?.globalRating || 0))}%</div>
                  </div>
                  <div className="learner-stats-metric">
                    <h3>Compétences après</h3>
                    <div className="value">{formatNumber(bestFormation.skillsAfter)}%</div>
                  </div>
                </div>
              </div>
            )}

            <div className="learner-stats-charts">
              <div className="learner-stats-chart-card">
                <h2>Taux de présence par formation</h2>
                <div className="learner-stats-chart" style={{ height: "400px" }}>
                  {statistics.length > 0 && (
                    <Bar
                      data={generateAttendanceChartData(statistics)}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: function(value) {
                                return formatNumber(value) + '%';
                              },
                              font: { size: 14 }
                            },
                            title: {
                              display: true,
                              text: 'Taux de présence (%)',
                              font: { size: 16 }
                            }
                          },
                          x: {
                            ticks: {
                              font: { size: 12 },
                              maxRotation: 45,
                              minRotation: 45
                            },
                            title: {
                              display: true,
                              text: 'Formations',
                              font: { size: 16 }
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              font: { size: 14 },
                              boxWidth: 12,
                              padding: 10
                            }
                          },
                          tooltip: {
                            titleFont: { size: 14 },
                            bodyFont: { size: 12 },
                            callbacks: {
                              label: function(context) {
                                return `${context.dataset.label}: ${formatNumber(context.raw)}%`;
                              }
                            }
                          }
                        },
                        animation: {
                          duration: 1500,
                          easing: 'easeOutQuart'
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="learner-stats-chart-card">
                <h2>Mes Formations et Certificats</h2>
                <div className="learner-stats-certificates-container">
                  <div className="learner-stats-certificate-box">
                    <div className="learner-stats-certificate-icon">
                      <FontAwesomeIcon icon={faGraduationCap} size="3x" style={{ color: '#4682B4' }} />
                    </div>
                    <div className="learner-stats-certificate-content">
                      <div className="learner-stats-certificate-number">{formationCount}</div>
                      <div className="learner-stats-certificate-label">Formations suivies</div>
                    </div>
                  </div>
                  
                  <div className="learner-stats-certificate-box">
                    <div className="learner-stats-certificate-icon">
                      <FontAwesomeIcon icon={faCertificate} size="3x" style={{ color: '#FFD700' }} />
                    </div>
                    <div className="learner-stats-certificate-content">
                      <div className="learner-stats-certificate-number">{certificateCount}</div>
                      <div className="learner-stats-certificate-label">Certificats obtenus</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="learner-stats-skills-container">
              <h2>
                <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '10px' }} />
                Progression des compétences par formation
              </h2>
              {statistics.map((stat) => (
                <div key={stat.formationId} className="learner-stats-formation-skills">
                  <div className="learner-stats-skills-header">
                    <h3>{stat.formationTitle}</h3>
                    <div className="learner-stats-skills-score">
                      <FontAwesomeIcon icon={faChartLine} className="learner-stats-skills-score-icon" />
                      Score de progression: {formatNumber(stat.skillsScore)}%
                    </div>
                  </div>
                  <div className="learner-stats-global-progress">
                    <div className="learner-stats-global-progress-label">Progression globale:</div>
                    <div className="learner-stats-global-progress-bar-container">
                      <div 
                        className="learner-stats-global-progress-bar" 
                        style={{ width: `${formatNumber(stat.skillsScore)}%` }}
                      ></div>
                    </div>
                    <div className="learner-stats-global-progress-value">
                      {formatNumber(stat.skillsBefore/10)}/10 → {formatNumber(stat.skillsAfter/10)}/10
                      <FontAwesomeIcon 
                        icon={faArrowUp} 
                        style={{ 
                          marginLeft: '8px', 
                          transform: stat.skillsAfter > stat.skillsBefore ? 'none' : 'rotate(180deg)',
                          color: stat.skillsAfter >= stat.skillsBefore ? '#28a745' : '#dc3545'
                        }} 
                      />
                    </div>
                  </div>
                  <div className="learner-stats-charts-grid">
                    <div className="learner-stats-chart-container">
                      <h4>Satisfaction par critère</h4>
                      <div className="learner-stats-chart-wrapper" style={{ height: '400px' }}>
                        <PolarArea
                          ref={chartRefs.satisfaction}
                          data={generateSatisfactionChartData(stat.feedbackAverages)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              r: {
                                ticks: {
                                  display: true,
                                  backdropColor: 'transparent',
                                  callback: function(value) {
                                    return formatNumber(value);
                                  },
                                  font: { size: 14 }
                                },
                                angleLines: { display: true },
                                suggestedMin: 0,
                                suggestedMax: 100
                              }
                            },
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  boxWidth: 18,
                                  padding: 15,
                                  font: { size: 14 }
                                }
                              },
                              tooltip: {
                                titleFont: { size: 14 },
                                bodyFont: { size: 12 },
                                callbacks: {
                                  label: function(context) {
                                    return `${context.label}: ${formatNumber(context.raw)}%`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="learner-stats-chart-container">
                      <h4>Niveau de compétence actuel</h4>
                      <div className="learner-stats-chart-wrapper" style={{ height: '400px' }}>
                        <Doughnut
                          ref={chartRefs.doughnut}
                          data={generateDoughnutChartData(stat.skillsBefore, stat.skillsAfter)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '70%',
                            plugins: {
                              legend: { position: 'bottom' },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const value = formatNumber(context.raw);
                                    return context.dataIndex === 0 
                                      ? `Compétences acquises: ${value}/10` 
                                      : `Compétences à acquérir: ${value}/10`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                        <div className="learner-stats-doughnut-center">
                          <div className="learner-stats-doughnut-value">{formatNumber(stat.skillsAfter/10)}/10</div>
                          <div className="learner-stats-doughnut-label">Niveau actuel</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="learner-stats-satisfaction-summary">
                    <div className="learner-stats-satisfaction-score">
                      <div className="learner-stats-satisfaction-value">
                        {displayScore(stat.feedbackAverages.globalRating)}
                      </div>
                      <div className="learner-stats-satisfaction-label">
                        Satisfaction globale
                      </div>
                    </div>
                    <div className="learner-stats-satisfaction-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FontAwesomeIcon 
                          key={star}
                          icon={faStar} 
                          className={
                            star <= Math.round(convertSatisfactionScore(stat.feedbackAverages.globalRating) / 20) 
                              ? "learner-stats-star filled" 
                              : "learner-stats-star"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="learner-stats-skills-table-container">
                    <h4>Détail de la satisfaction par critère</h4>
                    <table className="learner-stats-skills-table">
                      <thead>
                        <tr>
                          <th>Critère</th>
                          <th>Note</th>
                          <th>Évaluation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Clarté du contenu</td>
                          <td>{stat.feedbackAverages.clarity ? displayScore(stat.feedbackAverages.clarity) : 'N/A'}</td>
                          <td>
                            <div className="learner-stats-table-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesomeIcon 
                                  key={star}
                                  icon={faStar} 
                                  className={
                                    star <= Math.round(convertSatisfactionScore(stat.feedbackAverages.clarity || 0) / 20) 
                                      ? "learner-stats-star-small filled" 
                                      : "learner-stats-star-small"
                                  }
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Atteinte des objectifs</td>
                          <td>{stat.feedbackAverages.objectives ? formatNumber(convertSatisfactionScore(stat.feedbackAverages.objectives)) + '%' : 'N/A'}</td>
                          <td>
                            <div className="learner-stats-table-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesomeIcon 
                                  key={star}
                                  icon={faStar} 
                                  className={
                                    star <= Math.round(convertSatisfactionScore(stat.feedbackAverages.objectives || 0) / 20) 
                                      ? "learner-stats-star-small filled" 
                                      : "learner-stats-star-small"
                                  }
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Qualité du formateur</td>
                          <td>{stat.feedbackAverages.trainer ? formatNumber(convertSatisfactionScore(stat.feedbackAverages.trainer)) + '%' : 'N/A'}</td>
                          <td>
                            <div className="learner-stats-table-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesomeIcon 
                                  key={star}
                                  icon={faStar} 
                                  className={
                                    star <= Math.round(convertSatisfactionScore(stat.feedbackAverages.trainer || 0) / 20) 
                                      ? "learner-stats-star-small filled" 
                                      : "learner-stats-star-small"
                                  }
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Qualité des supports</td>
                          <td>{stat.feedbackAverages.materials ? formatNumber(convertSatisfactionScore(stat.feedbackAverages.materials)) + '%' : 'N/A'}</td>
                          <td>
                            <div className="learner-stats-table-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesomeIcon 
                                  key={star}
                                  icon={faStar} 
                                  className={
                                    star <= Math.round(convertSatisfactionScore(stat.feedbackAverages.materials || 0) / 20) 
                                      ? "learner-stats-star-small filled" 
                                      : "learner-stats-star-small"
                                  }
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Organisation</td>
                          <td>{stat.feedbackAverages.materialOrganization ? formatNumber(convertSatisfactionScore(stat.feedbackAverages.materialOrganization)) + '%' : 'N/A'}</td>
                          <td>
                            <div className="learner-stats-table-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesomeIcon 
                                  key={star}
                                  icon={faStar} 
                                  className={
                                    star <= Math.round(convertSatisfactionScore(stat.feedbackAverages.materialOrganization || 0) / 20) 
                                      ? "learner-stats-star-small filled" 
                                      : "learner-stats-star-small"
                                  }
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Qualité d'accueil</td>
                          <td>{stat.feedbackAverages.welcomeQuality ? formatNumber(convertSatisfactionScore(stat.feedbackAverages.welcomeQuality)) + '%' : 'N/A'}</td>
                          <td>
                            <div className="learner-stats-table-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesomeIcon 
                                  key={star}
                                  icon={faStar} 
                                  className={
                                    star <= Math.round(convertSatisfactionScore(stat.feedbackAverages.welcomeQuality || 0) / 20) 
                                      ? "learner-stats-star-small filled" 
                                      : "learner-stats-star-small"
                                  }
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Confort des locaux</td>
                          <td>{stat.feedbackAverages.premisesComfort ? formatNumber(convertSatisfactionScore(stat.feedbackAverages.premisesComfort)) + '%' : 'N/A'}</td>
                          <td>
                            <div className="learner-stats-table-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesomeIcon 
                                  key={star}
                                  icon={faStar} 
                                  className={
                                    star <= Math.round(convertSatisfactionScore(stat.feedbackAverages.premisesComfort || 0) / 20) 
                                      ? "learner-stats-star-small filled" 
                                      : "learner-stats-star-small"
                                  }
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr className="learner-stats-table-global">
                          <td><strong>Satisfaction globale</strong></td>
                          <td><strong>{displayScore(stat.feedbackAverages.globalRating)}</strong></td>
                          <td>
                            <div className="learner-stats-table-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesomeIcon 
                                  key={star}
                                  icon={faStar} 
                                  className={
                                    star <= Math.round(convertSatisfactionScore(stat.feedbackAverages.globalRating) / 20) 
                                      ? "learner-stats-star-small filled" 
                                      : "learner-stats-star-small"
                                  }
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="learner-stats-comments">
              <h2>Vos commentaires (5 derniers)</h2>
              <table className="learner-stats-comments-table">
                <thead>
                  <tr>
                    <th>Formation</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics
                    .flatMap((stat) =>
                      stat.comments.map((comment, index) => ({
                        formation: stat.formationTitle,
                        comment,
                        id: `${stat.formationId}-${index}`,
                      }))
                    )
                    .slice(0, 5)
                    .map((item) => (
                      <tr key={item.id}>
                        <td>{item.formation}</td>
                        <td>{item.comment}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {showNotifications && (
        <div className="learner-stats-notifications-popup">
          <div className="learner-stats-notifications-content">
            <div className="learner-stats-popup-header">
              <h3>Notifications</h3>
              <button className="learner-stats-close-popup" onClick={() => setShowNotifications(false)}>
                ×
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="learner-stats-no-notifications">Aucune notification.</p>
            ) : (
              <ul className="learner-stats-notification-list">
                {notifications.map((notification) => (
                  <li key={notification.id} className={`learner-stats-notification-item ${notification.read ? 'read' : 'unread'}`}>
                    <div className="learner-stats-notification-title">
                      {notification.message?.substring(0, 50) || 'Message indisponible'}
                      {!notification.read && <span className="learner-stats-unread-dot"></span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatApprenant;













