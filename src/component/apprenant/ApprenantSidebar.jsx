import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import profileIcon from "../assets/Profile.png";
import trainingsIcon from "../assets/trainings.png";
import emargementIcon from "../assets/emargement.png";
import evaluationIcon from "../assets/evaluation.png";
import validationIcon from "../assets/correction.png";
import Stat from "../assets/Chart.png";
import logoutIcon from "../assets/logout.png";
import "./ApprenantSidebar.css";

const ApprenantSidebar = ({ isSidebarOpen, toggleSidebar }) => {
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
      <div className={`sidebar-toggle ${isSidebarOpen ? 'open' : 'closed'}`} onClick={toggleSidebar}>
        {isSidebarOpen ? "<" : ">"}
      </div>

      <nav className={`sidebar ${isSidebarOpen ? 'active' : 'inactive'}`}>
        <img src={logo} alt="Logo" className="sidebar-logo" />
        <ul>
          {[
            { name: "Profil", icon: profileIcon, path: "/apprenant-dashboard" },
            { name: "Formations", icon: trainingsIcon, path: "/trainings" },
            { name: "Émargement", icon: emargementIcon, path: "/emargement" },
            { name: "Évaluation", icon: evaluationIcon, path: "/feedback" },
            { name: "Validation des acquis", icon: validationIcon, path: "/validation-acquis" },
            { name: "Statistiques", icon: Stat, path: "/apprenant/statistics" },
          ].map((item, index) => (
            <li key={index}>
              <Link to={item.path} className={location.pathname === item.path ? "active" : ""}>
                <img src={item.icon} alt={item.name} className="sidebar-icon" /> {item.name}
              </Link>
            </li>
          ))}
          <li className="logout-item">
            <a href="#" onClick={handleLogout}>
              <img src={logoutIcon} alt="Déconnexion" className="sidebar-icon" /> Déconnexion
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default ApprenantSidebar;
