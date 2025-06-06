import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartPie, 
  faChartBar, 
  faBell, 
  faTrophy, 
  faSync, 
  faUserGraduate, 
  faChalkboardTeacher, 
  faBook,
  faUndo,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import AdminSidebar from "./AdminSidebar";
import profilePic from "../assets/profil.png";
import './statadmin.css';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const StatAdmin = () => {
  // États pour les données
  const [globalStats, setGlobalStats] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [userData, setUserData] = useState(null);
  const [formateurs, setFormateurs] = useState([]);
  const [formations, setFormations] = useState([]);
  const [bestFormation, setBestFormation] = useState(null);
  
  // États pour les filtres
  const [selectedFormateurId, setSelectedFormateurId] = useState('');
  const [selectedFormationId, setSelectedFormationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // États pour l'interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const navigate = useNavigate();
  
  // Références pour les graphiques
  const chartRefs = {
    attendance: useRef(null),
    feedback: useRef(null),
    validation: useRef(null),
    trainerEval: useRef(null),
    monthlyTrends: useRef(null),
    participantDistribution: useRef(null),
    radarChart: useRef(null),
  };

  // Fonction pour basculer la sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fonction pour se déconnecter
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
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

  // Fetch global statistics
  const fetchGlobalStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/statistics/admin/global-statistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Réponse des statistiques globales:', response.data);
      setGlobalStats(response.data);
      
      if (response.data && response.data.bestFormation) {
        setBestFormation(response.data.bestFormation);
      }
      
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques globales:', error);
      console.error('Détails de l\'erreur:', error.response?.data);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(`Erreur lors de la récupération des statistiques globales: ${error.message}. Détails: ${JSON.stringify(error.response?.data)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch filtered statistics
  const fetchFilteredStatistics = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (selectedFormateurId) params.append('formateurId', selectedFormateurId);
      if (selectedFormationId) params.append('formationId', selectedFormationId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      console.log('Fetching filtered statistics with params:', params.toString());
      
      const response = await axios.get(`http://localhost:5000/api/statistics/admin/filtered-statistics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Filtered statistics response:', response.data);
      
      if (Array.isArray(response.data)) {
        setStatistics(response.data);
        
        // Si aucune donnée n'est retournée, afficher un message
        if (response.data.length === 0) {
          setError('Aucune donnée disponible pour les filtres sélectionnés.');
        } else {
          setError(null);
        }
      } else {
        setStatistics([]);
        setError('Format de réponse inattendu.');
      }
    } catch (error) {
      console.error('Error fetching filtered statistics:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Erreur lors de la récupération des statistiques: ' + error.message);
        setStatistics([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch formateurs and formations for filters - FIXED URLs
  const fetchFilters = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      // Try loading formateurs directly
      try {
        console.log('Fetching trainers...');
        const formateursResponse = await axios.get('http://localhost:5000/api/statistics/admin/trainers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormateurs(formateursResponse.data);
        console.log('Formateurs loaded successfully:', formateursResponse.data.length);
      } catch (formateursError) {
        console.error('Error fetching trainers:', formateursError);
        setError(`Erreur lors du chargement des formateurs: ${formateursError.message}`);
      }
      
      // Try loading formations separately
      try {
        console.log('Fetching formations...');
        const formationsResponse = await axios.get('http://localhost:5000/api/statistics/admin/formations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormations(formationsResponse.data);
        console.log('Formations loaded successfully:', formationsResponse.data.length);
      } catch (formationsError) {
        console.error('Error fetching formations:', formationsError);
        setError(`Erreur lors du chargement des formations: ${formationsError.message}`);
      }
    } catch (error) {
      console.error('General error in fetchFilters:', error);
      setError(`Erreur générale: ${error.message}`);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
      
      // Calculer le nombre de notifications non lues
      const unreadCount = response.data.filter(notif => !notif.read).length;
      setUnreadNotifications(unreadCount);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      }
      // Don't show error for notifications as it's not critical
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchUserData();
    fetchGlobalStats();
    fetchFilters();
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Fetch filtered statistics when filters change
  useEffect(() => {
    if (activeTab === 'detailed') {
      fetchFilteredStatistics();
    }
  }, [activeTab, selectedFormateurId, selectedFormationId, startDate, endDate]);

  // Cleanup charts on unmount
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

  const resetFilters = () => {
    setSelectedFormateurId('');
    setSelectedFormationId('');
    setStartDate('');
    setEndDate('');
  };

  // Add this to your component
  const handleRefresh = () => {
    setIsLoading(true);
    Promise.all([
      fetchGlobalStats(),
      fetchFilters(),
      activeTab === 'detailed' ? fetchFilteredStatistics() : Promise.resolve()
    ])
      .catch(error => {
        console.error('Error refreshing data:', error);
        setError('Erreur lors du rafraîchissement des données: ' + error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Données pour les graphiques globaux
  const getGlobalChartData = () => {
    if (!globalStats) return null;
    
    const monthlyTrendsData = globalStats.monthlyStats ? {
      labels: globalStats.monthlyStats.map(stat => stat.month),
      datasets: [
        {
          label: 'Taux de présence',
          data: globalStats.monthlyStats.map(stat => stat.attendanceRate),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Satisfaction',
          data: globalStats.monthlyStats.map(stat => stat.satisfaction),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Validation des compétences',
          data: globalStats.monthlyStats.map(stat => stat.validationRate),
          borderColor: 'rgba(139, 92, 246, 1)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    } : null;
    
    const participantDistributionData = globalStats.counts ? {
      labels: ['Apprenants', 'Formateurs', 'Formations'],
      datasets: [
        {
          data: [
            globalStats.counts.learners,
            globalStats.counts.trainers,
            globalStats.counts.formations
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(139, 92, 246, 1)'
          ],
          borderWidth: 2,
        }
      ]
    } : null;
    
    return {
      monthlyTrendsData,
      participantDistributionData
    };
  };

  // Données pour les graphiques détaillés
  const getDetailedChartData = () => {
    if (!statistics || statistics.length === 0) return null;
    
    const attendanceChartData = {
      labels: statistics.map(stat => stat.formationTitle),
      datasets: [{
        label: 'Taux de présence (%)',
        data: statistics.map(stat => stat.attendanceRate),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      }]
    };
    
    // Limiter à 3 formations pour le graphique de feedback pour éviter la surcharge
    const limitedStats = statistics.slice(0, 3);
    
    const feedbackChartData = {
      labels: ['Clarté', 'Objectifs', 'Formateur', 'Matériel', 'Organisation', 'Accueil', 'Confort'],
      datasets: limitedStats.map((stat, index) => ({
        label: stat.formationTitle,
        data: [
          stat.feedbackAverages?.clarity || 0,
          stat.feedbackAverages?.objectives || 0,
          stat.feedbackAverages?.trainer || 0,
          stat.feedbackAverages?.materials || 0,
          stat.feedbackAverages?.materialOrganization || 0,
          stat.feedbackAverages?.welcomeQuality || 0,
          stat.feedbackAverages?.premisesComfort || 0,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(139, 92, 246, 0.6)'
        ][index],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)'
        ][index],
        borderWidth: 2,
      }))
    };
    
    const validationChartData = {
      labels: statistics.map(stat => stat.formationTitle),
      datasets: [{
        label: 'Progression des validations (%)',
        data: statistics.map(stat => stat.validationProgress),
        fill: false,
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.1,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      }]
    };
    
    const trainerEvalChartData = {
      labels: statistics.map(stat => stat.formationTitle),
      datasets: [{
        label: 'Évaluation du formateur',
        data: statistics.map(stat => stat.feedbackAverages?.trainer || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      }]
    };
    
    const radarChartData = statistics.length > 0 ? {
      labels: ['Clarté', 'Objectifs', 'Formateur', 'Matériel', 'Organisation', 'Accueil', 'Confort'],
      datasets: [{
        label: statistics[0].formationTitle,
        data: [
          statistics[0].feedbackAverages?.clarity || 0,
          statistics[0].feedbackAverages?.objectives || 0,
          statistics[0].feedbackAverages?.trainer || 0,
          statistics[0].feedbackAverages?.materials || 0,
          statistics[0].feedbackAverages?.materialOrganization || 0,
          statistics[0].feedbackAverages?.welcomeQuality || 0,
          statistics[0].feedbackAverages?.premisesComfort || 0,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointRadius: 6,
      }]
    } : null;
    
    return {
      attendanceChartData,
      feedbackChartData,
      validationChartData,
      trainerEvalChartData,
      radarChartData
    };
  };

  const { monthlyTrendsData, participantDistributionData } = getGlobalChartData() || { monthlyTrendsData: null, participantDistributionData: null };
  const detailedChartData = getDetailedChartData() || {
    attendanceChartData: null,
    feedbackChartData: null,
    validationChartData: null,
    trainerEvalChartData: null,
    radarChartData: null
  };
  const { 
    attendanceChartData, 
    feedbackChartData, 
    validationChartData, 
    trainerEvalChartData, 
    radarChartData 
  } = detailedChartData;

  // Fonction pour rendre les graphiques avec gestion des cas où les données sont absentes
  const renderChart = (ChartComponent, data, options, ref) => {
    if (!data || !data.datasets || data.datasets.length === 0) {
      return (
        <div className="chart-loading">
          <p>Chargement des données...</p>
        </div>
      );
    }
    
    return (
      <ChartComponent
        ref={ref}
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          ...options
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="admin-stats-container">
      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
      />
      
      <div className={`admin-stats-content ${isSidebarOpen ? 'shifted' : 'full-width'}`}>
        <div className="admin-stats-header">
          <h1>Tableau de bord des statistiques</h1>
          <div className="admin-stats-user-profile">
            <div className="admin-stats-notification-wrapper">
              <FontAwesomeIcon 
                icon={faBell} 
                className="admin-stats-notification-icon" 
                onClick={() => navigate('/admin/notifications')}
              />
              {unreadNotifications > 0 && (
                <span className="admin-stats-notification-badge">{unreadNotifications}</span>
              )}
            </div>
            <span>{userData?.name || 'Admin'}</span>
          </div>
        </div>
        
        {/* Bannière d'information */}
        <div className="admin-stats-profile-banner">
          Statistiques et analyses
        </div>
        
        {/* Onglets pour basculer entre les vues */}
        <div className="admin-stats-tabs-container">
          <div className="admin-stats-tabs">
            <button 
              className={`admin-stats-tab ${activeTab === 'global' ? 'active' : ''}`}
              onClick={() => setActiveTab('global')}
            >
              <FontAwesomeIcon icon={faChartPie} />
              Vue globale
            </button>
            <button 
              className={`admin-stats-tab ${activeTab === 'detailed' ? 'active' : ''}`}
              onClick={() => setActiveTab('detailed')}
            >
              <FontAwesomeIcon icon={faChartBar} />
              Vue détaillée
            </button>
          </div>
        </div>
        
        {/* Affichage des erreurs */}
        {error && (
          <div className="admin-stats-error">
            {error}
          </div>
        )}
        
        {/* Affichage du chargement */}
        {isLoading && (
          <div className="admin-stats-loading">
            <FontAwesomeIcon icon={faSync} spin /> Chargement des données...
          </div>
        )}
        
        {/* Contenu principal basé sur l'onglet actif */}
        <div className="admin-stats-main-content">
          {activeTab === 'global' ? (
            <div className="admin-stats-global-view">
              {/* Section pour la formation la plus performante */}
              {bestFormation && (
                <div className="admin-stats-best-formation">
                  <h2>
                    <FontAwesomeIcon icon={faTrophy} style={{ color: '#FFD700', marginRight: '10px' }} />
                    Formation la plus performante: {bestFormation.title || "Sans nom"}
                  </h2>
                  <div className="admin-stats-best-formation-content">
                    <div className="admin-stats-metric">
                      <h3>Taux de présence</h3>
                      <div className="value">{bestFormation.attendanceRate}%</div>
                    </div>
                    <div className="admin-stats-metric">
                      <h3>Satisfaction globale</h3>
                      <div className="value">{bestFormation.satisfaction}/100</div>
                    </div>
                    <div className="admin-stats-metric">
                      <h3>Progression des validations</h3>
                      <div className="value">{bestFormation.validationRate || bestFormation.validationProgress || 0}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ajouter les statistiques globales (nombre d'apprenants, formateurs, formations) */}
              {globalStats && globalStats.counts && (
                <div className="admin-stats-global-metrics">
                  <div className="admin-stats-global-metric-card">
                    <div className="admin-stats-global-metric-icon">
                      <FontAwesomeIcon icon={faUserGraduate} />
                    </div>
                    <div className="admin-stats-global-metric-content">
                      <h3>Apprenants</h3>
                      <div className="admin-stats-global-metric-value">
                        {globalStats.counts.learners || 0}
                      </div>
                    </div>
                  </div>
                  
                  <div className="admin-stats-global-metric-card">
                    <div className="admin-stats-global-metric-icon">
                      <FontAwesomeIcon icon={faChalkboardTeacher} />
                    </div>
                    <div className="admin-stats-global-metric-content">
                      <h3>Formateurs</h3>
                      <div className="admin-stats-global-metric-value">
                        {globalStats.counts.trainers || 0}
                      </div>
                    </div>
                  </div>
                  
                  <div className="admin-stats-global-metric-card">
                    <div className="admin-stats-global-metric-icon">
                      <FontAwesomeIcon icon={faBook} />
                    </div>
                    <div className="admin-stats-global-metric-content">
                      <h3>Formations</h3>
                      <div className="admin-stats-global-metric-value">
                        {globalStats.counts.formations || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Graphiques pour les tendances mensuelles et la distribution des participants */}
              <div className="admin-stats-charts">
                {monthlyTrendsData && (
                  <div className="admin-stats-chart-card">
                    <h2>Tendances mensuelles</h2>
                    <div className="admin-stats-chart">
                      {renderChart(
                        Line,
                        monthlyTrendsData,
                        {
                          plugins: { legend: { position: 'top' } },
                          scales: { y: { min: 0, max: 100, ticks: { callback: (value) => `${value}%` } } },
                        },
                        chartRefs.monthlyTrends
                      )}
                    </div>
                  </div>
                )}

                {participantDistributionData && (
                  <div className="admin-stats-chart-card">
                    <h2>Distribution des participants</h2>
                    <div className="admin-stats-chart">
                      {renderChart(
                        Doughnut,
                        participantDistributionData,
                        {
                          plugins: { legend: { position: 'right' } },
                        },
                        chartRefs.participantDistribution
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-stats-detailed-view">
              {/* Filtres pour la vue détaillée */}
              <div className="admin-stats-filters">
                <h2>Filtres</h2>
                <div className="admin-stats-filters-container">
                  <div className="admin-stats-filter-group">
                    <label htmlFor="formateur-filter">Formateur:</label>
                    <select 
                      id="formateur-filter" 
                      value={selectedFormateurId} 
                      onChange={(e) => setSelectedFormateurId(e.target.value)}
                    >
                      <option value="">Tous les formateurs</option>
                      {formateurs.map((formateur) => (
                        <option key={formateur.id} value={formateur.id}>
                          {formateur.name || `Formateur ${formateur.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-stats-filter-group">
                    <label htmlFor="formation-filter">Formation:</label>
                    <select 
                      id="formation-filter" 
                      value={selectedFormationId} 
                      onChange={(e) => setSelectedFormationId(e.target.value)}
                    >
                      <option value="">Toutes les formations</option>
                      {formations.map((formation) => (
                        <option key={formation.id} value={formation.id}>
                          {formation.title || `Formation ${formation.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-stats-filter-group">
                    <label htmlFor="start-date">Date de début:</label>
                    <input 
                      type="date" 
                      id="start-date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="admin-stats-filter-group">
                    <label htmlFor="end-date">Date de fin:</label>
                    <input 
                      type="date" 
                      id="end-date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="admin-stats-filter-actions">
                    <button 
                      className="admin-stats-filter-reset" 
                      onClick={resetFilters}
                    >
                      <FontAwesomeIcon icon={faUndo} /> Réinitialiser
                    </button>
                    <button 
                      className="admin-stats-filter-apply" 
                      onClick={fetchFilteredStatistics}
                    >
                      <FontAwesomeIcon icon={faSearch} /> Appliquer
                    </button>
                  </div>
                </div>
              </div>

              {/* Affichage des statistiques détaillées */}
              {statistics.length > 0 ? (
                <div className="admin-stats-detailed">
                  {/* Résumé des formations filtrées */}
                  <div className="admin-stats-summary">
                    <h2>Résumé des formations ({statistics.length})</h2>
                    <div className="admin-stats-summary-table-container">
                      <table className="admin-stats-summary-table">
                        <thead>
                          <tr>
                            <th>Formation</th>
                            <th>Formateur</th>
                            <th>Participants</th>
                            <th>Présence</th>
                            <th>Satisfaction</th>
                            <th>Progression</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.map((stat) => (
                            <tr key={stat.formationId}>
                              <td>{stat.formationTitle}</td>
                              <td>{stat.formateur?.name || 'Non assigné'}</td>
                              <td>{stat.participantCount || 0}</td>
                              <td>{stat.attendanceRate}%</td>
                              <td>{stat.satisfaction}/100</td>
                              <td>{stat.validationProgress || 0}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Graphiques détaillés */}
                  <div className="admin-stats-charts">
                    {detailedChartData.attendanceChartData && (
                      <div className="admin-stats-chart-card">
                        <h2>Taux de présence par formation</h2>
                        <div className="admin-stats-chart">
                          {renderChart(
                            Bar,
                            detailedChartData.attendanceChartData,
                            {
                              plugins: { legend: { position: 'top' } },
                              scales: { y: { min: 0, max: 100, ticks: { callback: (value) => `${value}%` } } },
                            },
                            chartRefs.attendance
                          )}
                        </div>
                      </div>
                    )}

                    {detailedChartData.feedbackChartData && (
                      <div className="admin-stats-chart-card">
                        <h2>Évaluations des apprenants par critère</h2>
                        <div className="admin-stats-chart">
                          {renderChart(
                            Bar,
                            detailedChartData.feedbackChartData,
                            {
                              plugins: { legend: { position: 'top' } },
                              scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } },
                            },
                            chartRefs.feedback
                          )}
                        </div>
                      </div>
                    )}

                    {detailedChartData.validationChartData && (
                      <div className="admin-stats-chart-card">
                        <h2>Progression des validations</h2>
                        <div className="admin-stats-chart">
                          {renderChart(
                            Line,
                            detailedChartData.validationChartData,
                            {
                              plugins: { legend: { position: 'top' } },
                              scales: { y: { min: 0, max: 100, ticks: { callback: (value) => `${value}%` } } },
                            },
                            chartRefs.validation
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="admin-stats-no-data">
                  <p>Aucune donnée disponible pour les filtres sélectionnés.</p>
                  <button 
                    className="admin-stats-filter-reset" 
                    onClick={resetFilters}
                  >
                    <FontAwesomeIcon icon={faUndo} /> Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatAdmin;













