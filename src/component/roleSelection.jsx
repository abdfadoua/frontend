import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './roleSelection.css';

// Importer les images (chemins inchangés)
import SignatureIllustration from './assets/Illustration.png';
import CandidateImage from './assets/OBJECTS.png';
import FormateurImage from './assets/formateurill.png';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelection = (role) => {
    // Mapper les rôles du frontend aux rôles du backend
    const mappedRole = role === 'candidats' ? 'apprenant' : 'formateur';
    setSelectedRole(mappedRole);
  };

  const handleSignUp = () => {
    if (selectedRole) {
      navigate(`/signup?role=${selectedRole}`);
    }
  };

  return (
    <div className="role-page-container">
      {/* Left Panel */}
      <div className="role-left-panel">
        <div>
          <div className="role-logo-container">
            <h2 className="role-logo-text">U<span className="role-logo-exclamation">!</span>NOW</h2>
            <span className="role-logo-subtitle">Formation</span>
          </div>
          
          <div>
            <img 
              src={SignatureIllustration} 
              alt="Signature illustration" 
              className="role-illustration"
            />
          </div>

          <div className="role-tagline">
            <h3 className="role-tagline-text">Pour signer votre <br />feuille de présence en</h3>
            <p className="role-tagline-highlight">quelques clics</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="role-right-panel">
        <div className="role-content-container">
          <h1 className="role-page-title">
            Bienvenue sur U<span className="role-logo-exclamation">!</span>NOW Formation
          </h1>

          <div className="role-cards-container">
            {/* Candidats Card */}
            <div 
              className={`role-card ${selectedRole === 'apprenant' ? 'selected' : ''}`} 
              onClick={() => handleRoleSelection('candidats')}
            >
              <div className="role-check-circle">
                <span className="role-check-icon">✓</span>
              </div>
              <div className="role-card-content">
                <div className="role-card-image-container">
                  <img 
                    src={CandidateImage} 
                    alt="Candidate" 
                    className="role-card-image"
                  />
                </div>
                <h3 className="role-card-title">Espace Candidats</h3>
              </div>
            </div>

            {/* Formateurs Card */}
            <div 
              className={`role-card ${selectedRole === 'formateur' ? 'selected' : ''}`} 
              onClick={() => handleRoleSelection('formateurs')}
            >
              <div className="role-check-circle">
                <span className="role-check-icon">✓</span>
              </div>
              <div className="role-card-content">
                <div className="role-card-image-container">
                  <img 
                    src={FormateurImage} 
                    alt="Formateur" 
                    className="role-card-image"
                  />
                </div>
                <h3 className="role-card-title">Espace Formateurs</h3>
              </div>
            </div>
          </div>

          <div className="role-button-container">
            <button 
              className="role-signup-button"
              onClick={handleSignUp}
              disabled={!selectedRole}
            >
              {selectedRole 
                ? `S'inscrire en tant que ${selectedRole === 'apprenant' ? 'apprenant' : 'formateur'}`
                : 'Sélectionnez un rôle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;