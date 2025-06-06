/**
 * Utilitaire pour gérer les chemins d'images et les erreurs
 */

// Fonction pour obtenir l'URL d'une image avec gestion d'erreur
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Nettoyer le chemin de l'image
  const cleanPath = imagePath.replace(/^\/+/, "");
  
  // Retourner l'URL complète
  return `http://localhost:5000/${cleanPath}`;
};

// Fonction pour obtenir les initiales à partir d'un nom
export const getInitials = (name) => {
  if (!name) return "?";
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Fonction pour gérer les erreurs d'image
export const handleImageError = (event, showFallback = true) => {
  event.target.onerror = null;
  
  if (showFallback) {
    event.target.style.display = 'none';
    
    // Si l'élément suivant est le fallback, l'afficher
    if (event.target.nextSibling && 
        event.target.nextSibling.classList.contains('learner-image-fallback')) {
      event.target.nextSibling.style.display = 'flex';
    }
  } else {
    // Remplacer par une image par défaut
    event.target.src = '/path/to/default/image.png';
  }
};