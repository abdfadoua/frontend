import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Emargement.css";
import profilePic from "../assets/profil.png";
import emargementSignIcon from "../assets/emargement-log.png";
import axios from "axios";
import ApprenantSidebar from "./ApprenantSidebar";
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";

const Emargement = () => {
  const [userData, setUserData] = useState(null);
  const [emargements, setEmargements] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFormationId, setSelectedFormationId] = useState(null);
  const [uniqueFormations, setUniqueFormations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(null);
  const [signatures, setSignatures] = useState({});
  const signatureRefs = useRef({});
  const navigate = useNavigate();

  const refreshToken = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/refresh-token', {
        refreshToken: localStorage.getItem('refreshToken'),
      });
      localStorage.setItem('token', response.data.token);
      return response.data.token;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token :', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/login');
      return null;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Aucun token trouvé, redirection vers login');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur :', error);
        if (error.response?.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            fetchUserData();
          }
        }
      }
    };

    const fetchEmargements = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/emargements/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Réponse de l\'API /emargements/user :', response.data);
        setEmargements(response.data);
        // Map emargements to the sessions format expected by the component
        const formattedSessions = response.data.reduce((acc, emargement) => {
          const formation = emargement.session.formation;
          const existingPurchase = acc.find(p => p.formation.id === formation.id);
          if (existingPurchase) {
            existingPurchase.formation.sessions.push({
              ...emargement.session,
              isEmargedByUser: emargement.isPresent,
              emargements: [{ validatedBy: emargement.validatedBy, isPresent: emargement.isPresent }],
            });
          } else {
            acc.push({
              formation: {
                ...formation,
                sessions: [{
                  ...emargement.session,
                  isEmargedByUser: emargement.isPresent,
                  emargements: [{ validatedBy: emargement.validatedBy, isPresent: emargement.isPresent }],
                }],
              },
            });
          }
          return acc;
        }, []);
        setSessions(formattedSessions);
      } catch (error) {
        console.error('Erreur lors de la récupération des émargements :', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        if (error.response?.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            fetchEmargements();
          }
        }
      }
    };

    fetchUserData();
    fetchEmargements();
  }, [navigate]);

  // Ajoutez cet useEffect pour extraire les formations uniques des émargements
  useEffect(() => {
    if (emargements.length > 0) {
      // Extraire les formations uniques des émargements
      const formationsMap = new Map(
        emargements.map((emargement) => [
          emargement.session.formation.id,
          emargement.session.formation,
        ])
      );
      setUniqueFormations(Array.from(formationsMap.values()));
    }
  }, [emargements]);

  const handleSign = (sessionId) => {
    const session = sessions
      .flatMap((purchase) => purchase.formation.sessions)
      .find((s) => s.id === sessionId);

    if (!session) {
      alert('Session non trouvée.');
      return;
    }

    setIsPopupOpen(sessionId);
  };

  const handleClear = (sessionId) => {
    signatureRefs.current[sessionId]?.clear();
    setSignatures((prev) => ({ ...prev, [sessionId]: null }));
  };

  const handleSubmit = async (sessionId) => {
    if (!signatureRefs.current[sessionId]?.isEmpty()) {
      const signatureData = signatureRefs.current[sessionId].toDataURL();
      setSignatures((prev) => ({ ...prev, [sessionId]: signatureData }));

      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `http://localhost:5000/api/sessions/${sessionId}/emargement`,
          { signature: signatureData },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const response = await axios.get('http://localhost:5000/api/emargements/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const updatedSessions = response.data.reduce((acc, emargement) => {
          const formation = emargement.session.formation;
          const existingPurchase = acc.find(p => p.formation.id === formation.id);
          if (existingPurchase) {
            existingPurchase.formation.sessions.push({
              ...emargement.session,
              isEmargedByUser: emargement.isPresent,
              emargements: [{ validatedBy: emargement.validatedBy, isPresent: emargement.isPresent }],
            });
          } else {
            acc.push({
              formation: {
                ...formation,
                sessions: [{
                  ...emargement.session,
                  isEmargedByUser: emargement.isPresent,
                  emargements: [{ validatedBy: emargement.validatedBy, isPresent: emargement.isPresent }],
                }],
              },
            });
          }
          return acc;
        }, []);

        setSessions(updatedSessions);
        setEmargements(response.data);
        setIsPopupOpen(null);
        alert('Émargement réussi !');
      } catch (error) {
        console.error('Erreur lors de l\'émargement :', error.response?.data || error.message);
        alert(error.response?.data?.message || 'Erreur lors de l\'émargement.');
      }
    } else {
      alert('Veuillez signer avant de soumettre.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const canDownloadCertificate = (formation) => {
    return formation.sessions.every(session =>
      session.isEmargedByUser &&
      session.emargements.some(e =>
        e.validatedBy !== null &&
        e.isPresent !== null
      )
    );
  };

  const filteredSessions = selectedFormationId
    ? sessions.filter(purchase => purchase.formation.id === parseInt(selectedFormationId))
    : sessions;

  const groupedSessions = filteredSessions.reduce((acc, purchase) => {
    const formation = purchase.formation;

    if (!acc[formation.id]) {
      acc[formation.id] = {
        formation,
        sessionsByDate: {},
      };
    }

    formation.sessions.forEach((session) => {
      const sessionDate = new Date(session.startTime).toLocaleDateString('fr-FR');

      if (!acc[formation.id].sessionsByDate[sessionDate]) {
        acc[formation.id].sessionsByDate[sessionDate] = {
          morning: null,
          afternoon: null,
        };
      }

      new Date(session.startTime).getHours() < 14
        ? (acc[formation.id].sessionsByDate[sessionDate].morning = session)
        : (acc[formation.id].sessionsByDate[sessionDate].afternoon = session);
    });

    return acc;
  }, {});

  const generateCertificate = async (formation, user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/formations/${formation.id}/certificate-info`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { formateur } = response.data;
      const doc = new jsPDF();

      doc.addImage(logo, 'PNG', 20, 10, 40, 15);

      doc.setFontSize(22);
      doc.text("CERTIFICAT DE PRÉSENCE", 105, 30, { align: "center" });

      const tableStyles = {
        headStyles: {
          fillColor: [207, 226, 243],
          textColor: [59, 59, 59],
          fontStyle: 'bold',
          cellPadding: 4,
        },
        bodyStyles: {
          textColor: [102, 102, 102],
          cellPadding: 4,
        },
        margin: { top: 10 },
        theme: 'grid',
        styles: {
          lineWidth: 0.25,
          lineColor: [207, 226, 243],
        }
      };

      autoTable(doc, {
        ...tableStyles,
        startY: 40,
        head: [['Détail', 'Valeur']],
        body: [
          ['Formation', formation.title],
          ['Période', getTrainingPeriod(formation)],
          ['Durée', formation.duration || '7h'],
          ['Participant', user.name],
          ['Formateur', formateur.name]
        ],
      });

      const sessionsData = formation.sessions.map(session => {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        return [
          start.toLocaleDateString('fr-FR'),
          start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          `${((end - start) / 3.6e6).toFixed(1)}h`
        ];
      });

      autoTable(doc, {
        ...tableStyles,
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Date', 'Début', 'Fin', 'Durée']],
        body: sessionsData,
      });

      const finalY = doc.lastAutoTable.finalY + 20;
      if (formateur.signature) {
        doc.addImage(formateur.signature, 'PNG', 20, finalY, 50, 20);
        doc.setFontSize(10);
        doc.text("Signature du formateur", 20, finalY + 25);
      }

      doc.setFontSize(10);
      doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 160, finalY + 25);

      doc.save(`Certificat_${formation.title.replace(/\s+/g, '_')}_${user.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Erreur génération certificat:', error);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  const getTrainingPeriod = (formation) => {
    if (!formation.sessions || formation.sessions.length === 0) return '-';

    const dates = formation.sessions.map(session => ({
      start: new Date(session.startTime),
      end: new Date(session.endTime)
    }));

    const sortedDates = dates.sort((a, b) => a.start - b.start);
    const firstDate = sortedDates[0].start;
    const lastDate = sortedDates[sortedDates.length - 1].end;

    return `Du ${firstDate.toLocaleDateString('fr-FR')} au ${lastDate.toLocaleDateString('fr-FR')}`;
  };

  return (
    <div className="emargement-dashboard-container">
      <ApprenantSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`emargement-main-content ${isSidebarOpen ? 'shifted' : 'full-width'}`}>
        <div className="emargement-dashboard-header">
          <div className="emargement-formation-selection">
            <select
              id="formation-select"
              value={selectedFormationId || ""}
              onChange={(e) => setSelectedFormationId(e.target.value)}
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
          <div className="emargement-user-profile">
            <img src={profilePic} alt="User Profile" />
            <span>{userData?.name || 'Nezha Oukan'}</span>
          </div>
        </div>

        <div className="tables-container">
          {selectedFormationId ? (
            <>
              <table className="registration-table">
                <thead>
                  <tr>
                    <th>Training</th>
                    <th>Participant</th>
                    <th>Training Period</th>
                    <th>The training duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((purchase) => (
                    <tr key={purchase.formation.id}>
                      <td>{purchase.formation.title}</td>
                      <td>{userData?.name || 'Nezha Oukan'}</td>
                      <td>{getTrainingPeriod(purchase.formation)}</td>
                      <td>{purchase.formation.duration || '7h'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Morning 09h00 à 12h00</th>
                    <th>Afternoon 14h00 à 18h00</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(groupedSessions).map((group) =>
                    Object.entries(group.sessionsByDate).map(([date, sessions], index) => (
                      <tr key={`${group.formation.id}-${date}-${index}`}>
                        <td>{date}</td>
                        <td>
                          {sessions.morning ? (
                            <div className="session-cell">
                              {new Date(sessions.morning.startTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(sessions.morning.endTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              <div className="emargement-actions">
                                <button
                                  onClick={() => handleSign(sessions.morning.id)}
                                  disabled={sessions.morning.isEmargedByUser || !sessions.morning.startTime}
                                  className="emargement-button"
                                >
                                  <img
                                    src={emargementSignIcon}
                                    alt="Sign"
                                    className={`emargement-icon ${sessions.morning.isEmargedByUser ? 'signed' : ''}`}
                                  />
                                </button>
                                {sessions.morning.emargements?.some(e => e.validatedBy) && (
                                  <span className="validation-check">✓</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>-</div>
                          )}
                        </td>
                        <td>
                          {sessions.afternoon ? (
                            <div className="session-cell">
                              {new Date(sessions.afternoon.startTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(sessions.afternoon.endTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              <div className="emargement-actions">
                                <button
                                  onClick={() => handleSign(sessions.afternoon.id)}
                                  disabled={sessions.afternoon.isEmargedByUser || !sessions.afternoon.startTime}
                                  className="emargement-button"
                                >
                                  <img
                                    src={emargementSignIcon}
                                    alt="Sign"
                                    className={`emargement-icon ${sessions.afternoon.isEmargedByUser ? 'signed' : ''}`}
                                  />
                                </button>
                                {sessions.afternoon.emargements?.some(e => e.validatedBy) && (
                                  <span className="validation-check">✓</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>-</div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <p>Veuillez sélectionner une formation.</p>
          )}
        </div>

        {filteredSessions.length > 0 && (
          <div className="certificate-download">
            {filteredSessions.map((purchase) => {
              const formation = purchase.formation;
              const canDownload = canDownloadCertificate(formation);

              return (
                <div key={formation.id}>
                  <h3>{formation.title}</h3>
                  {canDownload ? (
                    <button
                      onClick={() => generateCertificate(formation, userData)}
                      className="download-button"
                    >
                      Télécharger le certificat de présence
                    </button>
                  ) : (
                    <p>
                      Le certificat sera disponible une fois que toutes les sessions sont émargées et validées par le formateur.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Electronic attendance</h2>
            <p>
              {new Date(
                sessions
                  .flatMap((purchase) => purchase.formation.sessions)
                  .find((session) => session.id === isPopupOpen)?.startTime
              ).toLocaleDateString('en-GB')}{' '}
              -{' '}
              {new Date(
                sessions
                  .flatMap((purchase) => purchase.formation.sessions)
                  .find((session) => session.id === isPopupOpen)?.startTime
              ).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              to{' '}
              {new Date(
                sessions
                  .flatMap((purchase) => purchase.formation.sessions)
                  .find((session) => session.id === isPopupOpen)?.endTime
              ).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p>You are about to digitally certify your attendance for a training slot via an electronic signature.</p>
            <SignatureCanvas
              canvasProps={{ width: 300, height: 150, className: 'signature-canvas' }}
              ref={(ref) => (signatureRefs.current[isPopupOpen] = ref)}
              onEnd={() =>
                setSignatures((prev) => ({
                  ...prev,
                  [isPopupOpen]: signatureRefs.current[isPopupOpen].toDataURL(),
                }))
              }
              disabled={
                sessions
                  .flatMap((purchase) => purchase.formation.sessions)
                  .find((session) => session.id === isPopupOpen)?.isEmargedByUser
              }
            />
            <p>Please sign above, using your mouse or finger, as neatly as possible!</p>
            {signatures[isPopupOpen] && (
              <img src={signatures[isPopupOpen]} alt="Signature" className="signature-preview" />
            )}
            <div className="popup-buttons">
              <button onClick={() => handleClear(isPopupOpen)}>Delete</button>
              <button onClick={() => handleSubmit(isPopupOpen)}>I certify my attendance for this slot</button>
            </div>
            <button className="close-button" onClick={() => setIsPopupOpen(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emargement;







