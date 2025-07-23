// server.js
const express = require('express');
const cors = require('cors'); // Pour gérer les requêtes depuis votre frontend
const mongoose = require('mongoose'); // Pour interagir avec MongoDB
require('dotenv').config(); // Pour charger les variables d'environnement
const path = require('path'); // NOUVELLE LIGNE : Importe le module 'path'

const app = express();

// Middleware : permet à Express de comprendre le JSON dans les requêtes
app.use(express.json());

// Middleware : permet les requêtes Cross-Origin (essentiel pour la communication frontend/backend)
// IMPORTANT : Assurez-vous que 'http://localhost:8000' correspond bien au port
// sur lequel tourne votre Live Server (ou autre serveur de développement frontend).
// Ex: si c'est http://127.0.0.1:5500, mettez 'http://127.0.0.1:5500' ou 'http://localhost:5500'
app.use(cors({
    origin: 'https://PLACEHOLDER-POUR-URL-FRONTEND-RENDER.onrender.com', // C'est cette ligne qu'il faut ajuster !
}));

// NOUVELLE LIGNE : Sert les fichiers statiques du dossier 'uploads'
// Cela rendra les images uploadées accessibles via http://127.0.0.1:5001/uploads/nom_fichier.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Importe les routes d'authentification
const authRoutes = require('./routes/authRoutes');
// Importe les nouvelles routes de réservation que vous venez de créer
const reservationRoutes = require('./routes/reservationRoutes'); // NOUVELLE LIGNE


// Utilise les routes d'authentification avec le préfixe /api/users
app.use('/api/users', authRoutes);
// Utilise les routes de réservation avec le préfixe /api/reservations
app.use('/api/reservations', reservationRoutes); // NOUVELLE LIGNE


// URI de connexion à votre base de données MongoDB
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salonDB';

// Se connecte à MongoDB
mongoose.connect(dbURI)
    .then(() => console.log('Connecté à MongoDB !'))
    .catch(err => console.error('Erreur de connexion à MongoDB :', err));

// Définit le port sur lequel le serveur va écouter les requêtes
const PORT = process.env.PORT || 5001;

// Première route de test : quand quelqu'un va sur l'adresse '/' (racine)
app.get('/', (req, res) => {
    res.send('Bienvenue sur le backend de votre salon de coiffure !');
});

// Démarre le serveur et le fait écouter sur le port défini
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Pour vérifier, ouvrez votre navigateur et allez sur : http://localhost:${PORT}`);
});
