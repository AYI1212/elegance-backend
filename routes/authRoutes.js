const express = require('express');
const router = express.Router(); // Crée un routeur Express pour gérer nos routes
const bcrypt = require('bcryptjs'); // Pour hacher les mots de passe
const jwt = require('jsonwebtoken'); // Pour créer les tokens de connexion (JWT)
const User = require('../models/User'); // Importe le modèle User que nous venons de créer
const auth = require('../middleware/auth'); // NOUVEAU : Importe le middleware d'authentification

// Clé secrète pour signer les JWT. À NE JAMAIS PARTAGER et à mettre dans un .env en production !
// Pour l'instant, on la met ici pour simplifier, mais on la mettra dans .env plus tard.
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_tres_securisee';

// Route d'inscription d'un nouvel utilisateur (POST /api/users/signup)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body; // Récupère les données envoyées par le frontend

  try {
    // 1. Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // 2. Hacher le mot de passe avant de l'enregistrer
    const salt = await bcrypt.genSalt(10); // Génère un "sel" pour le hachage
    const hashedPassword = await bcrypt.hash(password, salt); // Hache le mot de passe

    // 3. Créer un nouvel utilisateur
    user = new User({
      name,
      email,
      password: hashedPassword, // Enregistre le mot de passe haché
      // Le rôle sera 'user' par défaut selon notre modèle
    });

    // 4. Sauvegarder l'utilisateur dans la base de données
    await user.save();

    // 5. Générer un token JWT pour l'utilisateur fraîchement inscrit (connexion automatique)
    const payload = {
      user: {
        id: user.id, // L'ID de l'utilisateur
        role: user.role, // Son rôle
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' }, // Le token expire après 1 heure
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ message: 'Inscription réussie', token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur lors de l\'inscription');
  }
});

// Route de connexion d'un utilisateur (POST /api/users/login)
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // Récupère l'email et le mot de passe

  try {
    // 1. Vérifier si l'utilisateur existe
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // 2. Comparer le mot de passe fourni avec le mot de passe haché de la base de données
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // 3. Si les identifiants sont corrects, générer un token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' }, // Le token expire après 1 heure
      (err, token) => {
        if (err) throw err;
        res.json({ message: 'Connexion réussie', token }); // Renvoie le token au frontend
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur lors de la connexion');
  }
});

// NOUVELLE ROUTE : Route de test protégée (GET /api/users/auth-test)
// Seul un utilisateur connecté avec un token valide pourra y accéder
router.get('/auth-test', auth, async (req, res) => {
  try {
    // Si nous arrivons ici, le token est valide et req.user contient les infos de l'utilisateur
    res.json({ 
        message: 'Accès autorisé ! Vous êtes connecté.', 
        user: req.user // Affiche les infos de l'utilisateur extrait du token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router; // Exporte le routeur pour pouvoir l'utiliser dans server.js