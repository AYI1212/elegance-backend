const jwt = require('jsonwebtoken'); // Pour vérifier les tokens
require('dotenv').config(); // Pour accéder à la clé secrète

// Clé secrète pour vérifier les JWT (doit être la même que dans authRoutes.js)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_tres_securisee';

// Fonction middleware qui sera appelée avant d'accéder à une route protégée
module.exports = function(req, res, next) {
  // 1. Récupérer le token depuis l'en-tête de la requête
  // Le frontend enverra le token dans un en-tête appelé 'x-auth-token'
  const token = req.header('x-auth-token');

  // 2. Vérifier si un token existe
  if (!token) {
    // Si pas de token, l'utilisateur n'est pas autorisé
    return res.status(401).json({ message: 'Aucun token, autorisation refusée' });
  }

  try {
    // 3. Vérifier le token
    // jwt.verify va décoder le token et vérifier s'il est valide (non altéré, non expiré)
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Ajouter l'utilisateur décodé à l'objet 'req'
    // Cela nous permettra d'accéder à l'ID de l'utilisateur et son rôle dans les routes protégées
    req.user = decoded.user; // 'decoded.user' contient { id: user.id, role: user.role }

    // 5. Passer au prochain middleware/route
    next(); 

  } catch (err) {
    // Si le token n'est pas valide (expiré, falsifié, etc.)
    res.status(401).json({ message: 'Token non valide' });
  }
};