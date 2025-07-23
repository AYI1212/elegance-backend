const mongoose = require('mongoose');

// Définit la structure (le "schéma") d'un utilisateur dans la base de données
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'], // Le nom est obligatoire
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'], // L'email est obligatoire
    unique: true, // L'email doit être unique (pas deux utilisateurs avec le même email)
    lowercase: true, // L'email sera enregistré en minuscules
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'], // Le mot de passe est obligatoire
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Le rôle peut être 'user' ou 'admin'
    default: 'user', // Par défaut, un nouvel utilisateur est un 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now, // Date de création de l'utilisateur (automatique)
  },
});

// Crée le modèle 'User' basé sur le schéma
// Ce modèle nous permettra d'interagir avec la collection 'users' dans MongoDB
const User = mongoose.model('User', userSchema);

module.exports = User; // Exporte le modèle pour pouvoir l'utiliser dans d'autres fichiers