import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const hasVerified = useRef(false); // Empêche les requêtes multiples

  useEffect(() => {
    if (hasVerified.current) return; // Sortir si la vérification a déjà été effectuée
    hasVerified.current = true;

    const verifyEmail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
        toast.success(response.data.message, {
          position: 'top-right',
          autoClose: 3000,
        });
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        console.error('Erreur lors de la vérification :', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'Erreur lors de la vérification';
        
        // Gérer le cas "Compte déjà vérifié" comme une info, pas une erreur
        if (errorMessage === 'Compte déjà vérifié.') {
          toast.info('Votre compte est déjà vérifié. Veuillez vous connecter.', {
            position: 'top-right',
            autoClose: 3000,
          });
        } else {
          toast.error(errorMessage, {
            position: 'top-right',
            autoClose: 5000,
          });
        }
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    verifyEmail();

    // Nettoyer pour éviter les fuites
    return () => {
      hasVerified.current = true; // Empêche les appels après démontage
    };
  }, [token, navigate]);

  return (
    <div className="verify-email-container">
      <h2>Vérification de l'e-mail</h2>
      <p>Veuillez patienter pendant que nous vérifions votre compte. Vous serez redirigé vers la page de connexion...</p>
    </div>
  );
};

export default VerifyEmail;