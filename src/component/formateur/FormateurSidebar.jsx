import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import profileIcon from "../assets/Profile.png";
import sessionsIcon from "../assets/group (4).png";
import trainingsIcon from "../assets/trainings.png";
import evaluationIcon from "../assets/evaluation.png";
import statistiqueIcon from "../assets/Chart.png";
import logoutIcon from "../assets/logout.png";
import "./FormateurSidebar.css";

const FormateurSidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <>
      <div 
        className={`formateur-sidebar-toggle ${isSidebarOpen ? 'open' : 'closed'}`} 
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? "<" : ">"}
      </div>

      <nav className={`formateur-sidebar ${isSidebarOpen ? 'active' : 'inactive'}`}>
        <img src={logo} alt="Logo" className="formateur-sidebar-logo" />
        <ul>
          {[
            { name: "Profil", icon: profileIcon, path: "/formateur-dashboard" },
            { name: "Participants", icon: sessionsIcon, path: "/formateur/participants-emargement" },
            { name: "Formations", icon: trainingsIcon, path: "/formateur/trainings" },
            { name: "Mon évaluation", icon: evaluationIcon, path: "/validation" },
            { name: "Statistiques", icon: statistiqueIcon, path: "/formateur/statistiques" },
          ].map((item, index) => (
            <li key={index}>
              <Link to={item.path} className={location.pathname === item.path ? "active" : ""}>
                <img src={item.icon} alt={item.name} className="formateur-sidebar-icon" /> {item.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="formateur-logout-item">
          <a href="#" onClick={handleLogout}>
            <img src={logoutIcon} alt="Déconnexion" className="formateur-sidebar-icon" /> Déconnexion
          </a>
        </div>
      </nav>
    </>
  );
};

export default FormateurSidebar;


