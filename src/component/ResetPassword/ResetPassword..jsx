import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Ajoutez Link ici
import logo from '../assets/logo.png'; // Assurez-vous d'importer votre logo
import '../login/login.css'; // Importez votre fichier CSS existant

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Nouvel état pour la confirmation
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { newPassword });
      setMessage(response.data.message);
      setError('');
      setTimeout(() => navigate('/login'), 3000); // Rediriger vers la page de connexion après 3 secondes
    } catch (err) {
      console.error("Erreur lors de la réinitialisation du mot de passe :", err);

      if (err.response?.data?.message === 'Le lien de réinitialisation a expiré.') {
        setError('Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
      } else if (err.response?.data?.message === 'Lien de réinitialisation invalide.') {
        setError('Lien de réinitialisation invalide. Veuillez vérifier le lien.');
      } else {
        setError('Erreur lors de la réinitialisation du mot de passe.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <img src={logo} alt="Logo" className="login-logo" />
        <h2>Réinitialiser le mot de passe</h2>
        {message && <p>{message}</p>}
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="form-input"
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="form-input"
          />
          <button type="submit" className="form-button">
            Réinitialiser
          </button>
        </form>
        <footer className="login-footer">
          <p>
            Retour à la <Link to="/login">connexion</Link>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ResetPassword;