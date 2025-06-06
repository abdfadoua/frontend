import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './signup.css';
import logo from '../assets/logoblancsvg 1.svg';
import formImage from '../assets/background.png';
import { isValidPhoneNumber } from 'libphonenumber-js';

const SignUp = () => {
  useEffect(() => {
    console.log("Origine actuelle:", window.location.origin);
  }, []);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [dialCode, setDialCode] = useState('');
  const [city, setCity] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [interests, setInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState('');
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Ajout d'un état de chargement
  const navigate = useNavigate();
  const location = useLocation();

  // Liste prédéfinie des catégories d'intérêt
  const interestCategories = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'UI/UX Design',
    'DevOps',
    'Cloud Computing',
    'Cybersecurity',
    'Blockchain',
    'Game Development'
  ];

  // Récupérer le rôle depuis les paramètres d'URL
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role') || 'apprenant';

  useEffect(() => {
    axios
      .get('https://countriesnow.space/api/v0.1/countries/codes')
      .then((response) => {
        const countryList = response.data.data;
        setCountries(countryList);
      })
      .catch((error) => {
        console.error("Error fetching countries:", error);
        toast.error("Unable to load the list of countries.");
      });
  }, []);

  useEffect(() => {
    if (country) {
      axios
        .post('https://countriesnow.space/api/v0.1/countries/cities', { country })
        .then((response) => {
          const cityList = response.data.data;
          setCities(cityList);
          setCity('');
        })
        .catch((error) => {
          console.error("Error fetching cities:", error);
          setCities([]);
          toast.error("Unable to load cities for this country.");
        });
    } else {
      setCities([]);
    }
  }, [country]);

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const selectedCountryData = countries.find((c) => c.name === selectedCountry);
    setCountry(selectedCountry);
    setDialCode(selectedCountryData ? selectedCountryData.dial_code : '');
  };

  const responseGoogle = (response) => {
    console.log("Google response:", response);
    const { credential } = response;
    if (!credential) {
      toast.error("Google authentication failed: No credential received.", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    const mappedRole = role === 'candidats' ? 'apprenant' : role === 'formateurs' ? 'formateur' : role;

    console.log("Envoi de la requête avec:", { 
      token: credential.substring(0, 20) + "...", 
      role: mappedRole 
    });

    axios.post('http://localhost:5000/api/auth/google', { token: credential, role: mappedRole })
      .then((res) => {
        console.log("Réponse du serveur:", res.data);
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('userId', res.data.userId);
        localStorage.setItem('email', res.data.email);
        localStorage.setItem('name', res.data.name);

        toast.success('Google sign-up successful! Redirecting...', {
          position: "top-right",
          autoClose: 3000,
        });

        if (res.data.role === 'apprenant') {
          setTimeout(() => navigate('/apprenant-dashboard'), 3000);
        } else if (res.data.role === 'formateur') {
          setTimeout(() => navigate('/formateur-dashboard'), 3000);
        }
      })
      .catch((err) => {
        console.error("Google sign-up error:", err);
        toast.error(err.response?.data?.message || "Error during Google sign-up", {
          position: "top-right",
          autoClose: 5000,
        });
      });
  };

  const validatePassword = (password) => {
    const regex = /^[A-Za-z0-9]+$/;
    return regex.test(password);
  };

  const validatePhoneNumber = (phone, countryCode) => {
    if (!countryCode) return false;
    return isValidPhoneNumber(phone, countryCode);
  };

  const handleInterestChange = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(item => item !== interest));
    } else if (interests.length < 2) {
      setInterests([...interests, interest]);
    } else {
      toast.warning('Vous ne pouvez sélectionner que 2 centres d\'intérêt maximum.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleAddCustomInterest = () => {
    if (!customInterest.trim()) return;
    
    if (interests.length < 2) {
      setInterests([...interests, customInterest.trim()]);
      setCustomInterest('');
    } else {
      toast.warning('Vous ne pouvez sélectionner que 2 centres d\'intérêt maximum.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // ✅ FONCTION CORRIGÉE
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Empêcher les soumissions multiples
    if (isLoading) return;
    
    setIsLoading(true);
    setError(''); // Reset les erreurs précédentes
    
    // ✅ CORRECTION : Définir fullPhoneNumber AVANT de l'utiliser
    const fullPhoneNumber = `${dialCode}${phone}`;
    
    console.log("Tentative d'inscription avec les données:", {
      email,
      password,
      name,
      phone: fullPhoneNumber,
      username,
      country,
      city,
      role,
      birthDate,
      interests
    });
    
    try {
      // Validation des champs obligatoires
      if (!email || !password || !name || !phone || !username || !country || !city) {
        throw new Error('Veuillez remplir tous les champs obligatoires.');
      }

      if (!termsAccepted) {
        throw new Error('Vous devez accepter les Conditions d\'utilisation et la Politique de confidentialité.');
      }

      if (!validatePassword(password)) {
        throw new Error('Le mot de passe ne doit contenir que des lettres et des chiffres.');
      }

      // ✅ VALIDATION CORRIGÉE
      if (!validatePhoneNumber(fullPhoneNumber, country)) {
        throw new Error('Numéro de téléphone invalide pour le pays sélectionné.');
      }

      if (!['apprenant', 'formateur'].includes(role)) {
        throw new Error('Rôle invalide sélectionné.');
      }

      // Message de chargement
      toast.info('Inscription en cours...', {
        position: "top-right",
        autoClose: 3000,
      });
      
      console.log('Données envoyées au serveur:', {
        email,
        password,
        name,
        phone: fullPhoneNumber,
        username,
        country,
        city,
        role,
        birthDate,
        interests,
      });
      
      // ✅ REQUÊTE AVEC GESTION D'ERREUR AMÉLIORÉE
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        email,
        password,
        name,
        phone: fullPhoneNumber,
        username,
        country,
        city,
        role,
        birthDate,
        interests,
      });
      
      console.log('✅ Réponse du serveur:', response.data);
      
      toast.success('Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.', {
        position: "top-right",
        autoClose: 5000,
      });
      
      setTimeout(() => navigate('/login'), 5000);
      
    } catch (error) {
      console.error("❌ Erreur lors de l'inscription :", error);
      
      let errorMessage = "Erreur lors de l'inscription";
      
      if (error.message && !error.response) {
        // Erreur de validation locale
        errorMessage = error.message;
      } else if (error.response) {
        // Erreur du serveur
        console.error("Statut d'erreur:", error.response.status);
        console.error("Données d'erreur:", error.response.data);
        errorMessage = error.response.data?.message || `Erreur serveur (${error.response.status})`;
      } else if (error.request) {
        // Pas de réponse du serveur
        console.error("Aucune réponse du serveur:", error.request);
        errorMessage = "Le serveur ne répond pas. Vérifiez votre connexion internet.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FONCTION SIMPLIFIÉE POUR VÉRIFIER LA VALIDITÉ DU FORMULAIRE
  const isFormValid = () => {
    return email && password && name && phone && username && country && city && termsAccepted && !isLoading;
  };

  const handleGoogleError = (error) => {
    console.error("Google Sign-Up Error:", error);
    
    let errorMessage = "Échec de l'inscription Google. ";
    
    if (error.message && error.message.includes("origin")) {
      errorMessage += "Origine non autorisée. Veuillez contacter le support.";
    } else {
      errorMessage += "Veuillez réessayer plus tard.";
    }
    
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 5000,
    });
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <div className='header'>
          <img src={logo} alt="UKNOW Logo" className="signup-logo" />
          <h2>Sign Up</h2>
        </div>
        {error && <p className="error" style={{color: 'red', marginBottom: '10px'}}>{error}</p>}
        
        <form className="signup-form" onSubmit={handleSignUp}>
          <label>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
          
          <label>User name *</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
          
          <div className='multi-form'>
            <select
              value={country}
              onChange={handleCountryChange}
              required
              className="country-select"
              disabled={isLoading}
            >
              <option value="">Select Country</option>
              {countries.map((countryData) => (
                <option key={countryData.code} value={countryData.name}>
                  {countryData.name} ({countryData.dial_code})
                </option>
              ))}
            </select>
            
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              disabled={!country || isLoading}
            >
              <option value="">Select City</option>
              {cities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
          </div>
          
          <label>Phone * {dialCode && <span style={{color: '#666'}}>({dialCode})</span>}</label>
          <div className="phone-input">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Numéro de téléphone"
            />
          </div>
          
          <label>E-mail *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          
          <label>Password *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Lettres et chiffres uniquement"
          />
          
          <label>Date of Birth</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            disabled={isLoading}
          />
          
          <label>Interests (select up to 2)</label>
          <div className="interests-container">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !interests.includes(e.target.value)) {
                  if (interests.length < 2) {
                    setInterests([...interests, e.target.value]);
                  } else {
                    toast.warning('Maximum 2 intérêts autorisés.', {
                      position: "top-right",
                      autoClose: 3000,
                    });
                  }
                }
              }}
              className="interest-select"
              disabled={isLoading}
            >
              <option value="">Select an interest</option>
              {interestCategories.map((category) => (
                <option 
                  key={category} 
                  value={category}
                  disabled={interests.includes(category)}
                >
                  {category}
                </option>
              ))}
            </select>
            
            <div className="custom-interest">
              <input
                type="text"
                placeholder="Add your own interest"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                disabled={interests.length >= 2 || isLoading}
              />
              <button 
                type="button" 
                onClick={handleAddCustomInterest}
                disabled={interests.length >= 2 || !customInterest.trim() || isLoading}
                className="add-interest-btn"
              >
                Add
              </button>
            </div>
          </div>

          {interests.length > 0 && (
            <div className="selected-interests">
              <p>Selected interests:</p>
              <div className="interest-tags">
                {interests.map((interest) => (
                  <span key={interest} className="interest-tag">
                    {interest}
                    <button 
                      type="button" 
                      onClick={() => handleInterestChange(interest)}
                      className="remove-interest"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="terms">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={isLoading}
            />
            <span>
              By creating an account, I agree to our{' '}
              <a href="#">TERMS OF USE</a> and{' '}
              <a href="#">PRIVACY POLICY</a> *
            </span>
          </div>
          
          <button 
            type="submit" 
            className={`signup-button ${isFormValid() ? 'active' : ''}`}
            disabled={!isFormValid()}
          >
            {isLoading ? 'Inscription en cours...' : "S'inscrire"}
          </button>
          
          <div className="google-signup">
            <p>Or sign up with:</p>
            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={responseGoogle}
                onError={handleGoogleError}
                disabled={isLoading}
              />
            </GoogleOAuthProvider>
          </div>
        </form>
      </div>
      <div className="signup-right">
        <img src={formImage} alt="Illustration" className="form-image" />
        <h3>Let's build the future together</h3>
        <p>
          "Coming together is a beginning, keeping together is progress, working together is success."
          <br /> Henry Ford
        </p>
      </div>
    </div>
  );
};

export default SignUp;


