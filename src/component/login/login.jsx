import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import '../login/login.css';
import logo from '../assets/logoblancsvg 1.svg';
import formImage from '../assets/background.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPasswordPopup, setShowForgotPasswordPopup] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('userId', response.data.userId);

      // Si l'utilisateur est fadoua.abdelhak@polytechnicien.tn, vérifier et corriger le rôle admin
      if (email === 'fadoua.abdelhak@polytechnicien.tn') {
        try {
          await axios.get('http://localhost:5000/api/auth/verify-admin-role');
          console.log('Vérification du rôle admin effectuée');
          // Mettre à jour le rôle dans le localStorage
          localStorage.setItem('role', 'admin');
          // Rediriger vers le dashboard admin
          navigate('/admin-dashboard');
          return;
        } catch (adminError) {
          console.error('Erreur lors de la vérification du rôle admin:', adminError);
        }
      }

      // Redirection normale basée sur le rôle
      if (response.data.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (response.data.role === 'formateur') {
        navigate('/formateur-dashboard');
      } else if (response.data.role === 'apprenant') {
        navigate('/apprenant-dashboard');
      } else {
        navigate('/role-selection');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError(error.response?.data?.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pin) {
      setError('Veuillez entrer le PIN.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-pin', { email, pin });
      if (response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('name', response.data.name);
        localStorage.setItem('email', response.data.email);
        localStorage.setItem('phone', response.data.phone);

        if (response.data.role === 'apprenant') {
          navigate('/apprenant-dashboard');
        } else if (response.data.role === 'formateur') {
          navigate('/formateur-dashboard');
        } else if (response.data.role === 'admin') {
          navigate('/admin-dashboard');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification du PIN :', err.response?.data);
      setError(err.response?.data?.message || 'Erreur lors de la vérification du PIN.');
    }
  };

  const handleGoogleLogin = async (response) => {
    console.log("Google response:", response);
    const { credential } = response;
    if (!credential) {
      setError("Google authentication failed: No credential received.");
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/google', { token: credential });
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('email', res.data.email);
      localStorage.setItem('name', res.data.name);

      if (res.data.role === 'apprenant') {
        navigate('/apprenant-dashboard');
      } else if (res.data.role === 'formateur') {
        navigate('/formateur-dashboard');
      } else if (res.data.role === 'admin') {
        navigate('/admin-dashboard');
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.response?.data?.message || "Error during Google login");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setError('Veuillez entrer une adresse e-mail.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email: forgotPasswordEmail });
      setError('');
      setShowForgotPasswordPopup(false);
      alert('Un e-mail de réinitialisation a été envoyé.');
    } catch (err) {
      console.error('Erreur lors de la demande de réinitialisation :', err);
      setError(err.response?.data?.message || 'Erreur lors de la demande de réinitialisation.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={logo} alt="UNOW Logo" className="login-logo" />
        <h2>Login Now</h2>
        {error && <p className="error">{error}</p>}
        {!showPinInput ? (
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
            <button type="submit" className="form-button">
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="login-form">
            <input
              type="text"
              placeholder="Entrez le PIN reçu par email"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="form-input"
            />
            <button type="submit" className="form-button">
              Vérifier le PIN
            </button>
          </form>
        )}
        <div className="google-login">
          <GoogleOAuthProvider clientId="355051455832-oearohcicvqg73m3f7g18gh2sfjo7mha.apps.googleusercontent.com">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setError('Erreur lors de la connexion Google.')}
              useOneTap
            />
          </GoogleOAuthProvider>
        </div>
        <footer className="login-footer">
          <p>
            Don't have an account? <Link to="/role-selection">Sign Up</Link>
          </p>
          <p>
            <span className="forgot-password-link" onClick={() => setShowForgotPasswordPopup(true)}>
              Forgot Password?
            </span>
          </p>
        </footer>
      </div>
      <div className="login-right">
        <img src={formImage} alt="Illustration" className="form-image" />
        <h3>Let's build the future together</h3>
        <p>
          "Coming together is a beginning, keeping together is progress, working together is success."
          <br /> Henry Ford
        </p>
      </div>
      {showForgotPasswordPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Forgot Password</h3>
            <input
              type="email"
              placeholder="Enter your email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              required
            />
            <button onClick={handleForgotPassword} className="form-button">
              Send Reset Link
            </button>
            <button onClick={() => setShowForgotPasswordPopup(false)} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
