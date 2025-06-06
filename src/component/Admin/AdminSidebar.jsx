import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from "../assets/logo.png";
import logoutIcon from "../assets/logout.png";
import learnersIcon from "../assets/leaners.png";
import trainersIcon from "../assets/coach.png";
import statsIcon from "../assets/Chart.png";
import historyIcon from "../assets/history.png";
import './AdminSidebar.css';

const AdminSidebar = ({ isSidebarOpen, toggleSidebar, handleLogout }) => {
  const location = useLocation();

  return (
    <>
      <div
        className={`admin-sidebar-toggle ${isSidebarOpen ? "open" : "closed"}`}
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? "<" : ">"}
      </div>

      <nav className={`admin-sidebar ${isSidebarOpen ? "active" : "inactive"}`}>
        <img src={logo} alt="Logo" className="admin-sidebar-logo" />
        <ul>
          <li>
            <Link
              to="/admin/learners"
              className={location.pathname === "/admin/learners" ? "active" : ""}
            >
              <img
                src={learnersIcon}
                alt="Apprenants"
                className="admin-sidebar-icon"
              />{" "}
              Apprenants
            </Link>
          </li>
          <li>
            <Link
              to="/admin/trainers"
              className={location.pathname === "/admin/trainers" ? "active" : ""}
            >
              <img
                src={trainersIcon}
                alt="Formateurs"
                className="admin-sidebar-icon"
              />{" "}
              Formateurs
            </Link>
          </li>
          <li>
            <Link
              to="/admin/statistics"
              className={location.pathname === "/admin/statistics" ? "active" : ""}
            >
              <img
                src={statsIcon}
                alt="Statistiques"
                className="admin-sidebar-icon"
              />{" "}
              Statistiques
            </Link>
          </li>
          <li>
            <Link
              to="/admin/history"
              className={location.pathname === "/admin/history" ? "active" : ""}
            >
              <img
                src={historyIcon}
                alt="Historique"
                className="admin-sidebar-icon"
              />{" "}
              Historique
            </Link>
          </li>
          <li className="admin-logout-item">
            <Link to="/login" onClick={handleLogout}>
              <img
                src={logoutIcon}
                alt="Déconnexion"
                className="admin-sidebar-icon"
              />{" "}
              Déconnexion
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default AdminSidebar;
