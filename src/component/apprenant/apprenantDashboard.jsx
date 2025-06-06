import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./apprenantDashboard.css";
import profilePic from "../assets/profil.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faMapMarkerAlt, faPhone, faEdit } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import ApprenantSidebar from "./ApprenantSidebar";

const ApprenantDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [rangeSelection, setRangeSelection] = useState({ start: null, end: null, selecting: false });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("Aucun token trouvé, redirection vers login");
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
        setName(response.data.name);
        setEmail(response.data.email);
        setPhone(response.data.phone);
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur :", error);
        if (error.response?.status === 401) {
          console.log("Token invalide ou expiré, redirection vers login");
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchUserData();
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

  const formatCurrentDate = useCallback(() => {
    const date = new Date();
    return `${date.getDate().toString().padStart(2, '0')} / ${(date.getMonth() + 1).toString().padStart(2, '0')} / ${date.getFullYear()}`;
  }, []);

  const firstDayOfMonth = new Date(new Date().getFullYear(), currentMonth, 1).getDay();
  const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(new Date().getFullYear(), currentMonth, 0).getDate();

  const prevDays = [];
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
    prevDays.push(prevMonthDays - i);
  }
  prevDays.reverse();

  const currentDays = [...Array(daysInMonth).keys()].map((day) => day + 1);

  const totalDaysShown = Math.ceil((prevDays.length + currentDays.length) / 7) * 7;
  const nextDays = [...Array(totalDaysShown - (prevDays.length + currentDays.length)).keys()].map((day) => day + 1);

  const handleMonthChange = (direction) => {
    setCurrentMonth((prev) => (direction === "prev" ? prev - 1 : prev + 1));
  };

  const handleDateClick = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return;

    if (!rangeSelection.selecting) {
      setRangeSelection({ start: day, end: day, selecting: true });
    } else {
      let start = rangeSelection.start;
      let end = day;

      if (start > end) {
        [start, end] = [end, start];
      }

      setRangeSelection({ start, end, selecting: false });
    }
  };

  const isInSelectedRange = (day) => {
    if (!rangeSelection.start || !rangeSelection.end) return false;
    return day >= rangeSelection.start && day <= rangeSelection.end;
  };

  const isRangeStart = (day) => day === rangeSelection.start;
  const isRangeEnd = (day) => day === rangeSelection.end;

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && new Date().getFullYear() === today.getFullYear();
  };

  const getMonthName = useCallback(() => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthNames[currentMonth];
  }, [currentMonth]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('city', userData.city);
      formData.append('country', userData.country);
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      const response = await axios.put('http://localhost:5000/api/auth/update', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setUserData(response.data);

      localStorage.setItem('name', response.data.name);
      localStorage.setItem('email', response.data.email);
      localStorage.setItem('phone', response.data.phone);

      togglePopup();
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données utilisateur :", error);
      alert("Une erreur est survenue lors de la mise à jour. Veuillez réessayer.");
    }
  };

  return (
    <div className="dashboard-container">
      <ApprenantSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${isSidebarOpen ? 'shifted' : 'full-width'}`}>
        <div className="dashboard-header">
          <h1>Profile</h1>
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

        <div className="profile-banner">Bonjour {userData?.name || "Utilisateur"}! Ravi de vous revoir!</div>

        <div className="profile-card">
          <img
            src={userData?.profileImage ? `http://localhost:5000/${userData.profileImage.replace(/^\/+/, '')}` : profilePic}
            alt="Profil"
            className="profile-pic"
          />
          <div className="profile-info">
            <p><FontAwesomeIcon icon={faPhone} /> {userData?.phone || "Non renseigné"}</p>
            <p><FontAwesomeIcon icon={faEnvelope} /> {userData?.email || "Non renseigné"}</p>
            <p><FontAwesomeIcon icon={faMapMarkerAlt} className="custom-icon" /> {userData?.city || "Ville non renseignée"}, {userData?.country || "Pays non renseigné"}</p>
          </div>
          <FontAwesomeIcon icon={faEdit} className="edit-icon" onClick={togglePopup} />
        </div>

        {isPopupOpen && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>Modifier le profil</h2>
              {profileImagePreview && <img src={profileImagePreview} alt="Aperçu" style={{ maxWidth: "100px", marginBottom: "10px" }} />}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nom complet</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Photo de profil</label>
                  <input
                    type="file"
                    onChange={handleImageChange}
                  />
                </div>
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={togglePopup}>Annuler</button>
              </form>
            </div>
          </div>
        )}

        <div className="dashboard-widgets">
          <div className="calendar-container">
            <div className="calendar-header">
              <h2>Calendar</h2>
              <div className="month-navigation">
                <button onClick={() => handleMonthChange("prev")} className="nav-button">
                  {"<"}
                </button>
                <span className="current-month">{getMonthName()}</span>
                <button onClick={() => handleMonthChange("next")} className="nav-button">
                  {">"}
                </button>
              </div>
            </div>

            <div className="weekdays-row">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={index} className="weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {prevDays.map((day) => (
                <div key={`prev-${day}`} className="calendar-day disabled">
                  {day}
                </div>
              ))}

              {currentDays.map((day) => (
                <div
                  key={`current-${day}`}
                  className={`calendar-day
                    ${isInSelectedRange(day) ? "day-range" : ""}
                    ${isRangeStart(day) ? "range-start" : ""}
                    ${isRangeEnd(day) ? "range-end" : ""}
                    ${isToday(day) ? "today" : ""}`}
                  onClick={() => handleDateClick(day, true)}
                >
                  {day}
                </div>
              ))}

              {nextDays.map((day) => (
                <div key={`next-${day}`} className="calendar-day disabled">
                  {day}
                </div>
              ))}
            </div>
          </div>

          <div className="tasks-container">
            <div className="tasks-header">
              <h2>Daily Task</h2>
              <span className="date-display">{formatCurrentDate()}</span>
            </div>

            <div className="task">
              <span className="task-time">10:00</span>
              <span className="task-activity blue">ITIL Fondation <span>10:00 - 12:00</span></span>
            </div>
            <div className="task">
              <span className="task-time">12:00</span>
              <span className="task-activity red">Pause <span>12:00 - 14:00</span></span>
            </div>
            <div className="task">
              <span className="task-time">14:00</span>
              <span className="task-activity blue">ITIL Fondation <span>14:00 - 17:00</span></span>
            </div>
            <div className="task">
              <span className="task-time">17:00</span>
              <div className="task-line"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprenantDashboard;


