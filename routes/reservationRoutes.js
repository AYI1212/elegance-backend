const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reservation = require('../models/Reservation');
const multer = require('multer');
const path = require('path');

// Configuration de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// @route   POST /api/reservations
// @desc    Créer une nouvelle réservation avec possibilité d'upload de preuve de paiement
// @access  Privé (utilisateur authentifié)
router.post('/', auth, upload.single('paymentProof'), async (req, res) => {
    const { serviceName, date, time, price, hasColor, paymentMethod } = req.body;
    const paymentProof = req.file ? req.file.filename : null;

    try {
        // Validation basique
        if (!serviceName || !date || !time || !price || !req.user.id) {
            return res.status(400).json({ message: 'Veuillez fournir toutes les informations requises pour la réservation.' });
        }

        // --- DÉBUT DE LA VÉRIFICATION DE DISPONIBILITÉ POUR LA CRÉATION ---
        const bookingsCount = await Reservation.countDocuments({
            date: new Date(date), // Convertir la chaîne de date en objet Date
            time: time,
            status: { $in: ['pending', 'confirmed', 'completed'] } // Seuls ces statuts comptent
        });

        const MAX_CLIENTS_PER_SLOT = 3; // Limite de 3 clients par créneau
        if (bookingsCount >= MAX_CLIENTS_PER_SLOT) {
            return res.status(409).json({ message: 'Ce créneau est déjà complet. Veuillez choisir une autre date ou heure.' });
        }
        // --- FIN DE LA VÉRIFICATION DE DISPONIBILITÉ POUR LA CRÉATION ---


        const newReservation = new Reservation({
            userId: req.user.id,
            serviceName,
            date: new Date(date),
            time,
            price,
            hasColor: hasColor === 'true' || hasColor === true,
            paymentMethod,
            paymentProof,
            status: 'pending'
        });

        const reservation = await newReservation.save();
        res.status(201).json({ message: 'Réservation créée avec succès !', booking: reservation });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erreur serveur lors de la création de la réservation.' });
    }
});


// NOUVELLE ROUTE : Vérification de disponibilité des créneaux
// @route   POST /api/reservations/check-availability
// @desc    Vérifier si un créneau date/heure est disponible (moins de 3 réservations)
// @access  Privé (nécessite un utilisateur authentifié)
router.post('/check-availability', auth, async (req, res) => {
    const { date, time } = req.body;

    if (!date || !time) {
        return res.status(400).json({ available: false, message: 'La date et l\'heure sont requises.' });
    }

    try {
        const searchDate = new Date(date);

        const count = await Reservation.countDocuments({
            date: searchDate,
            time: time,
            status: { $in: ['pending', 'confirmed', 'completed'] }
        });

        const MAX_CLIENTS_PER_SLOT = 3;

        if (count < MAX_CLIENTS_PER_SLOT) {
            res.json({ available: true, message: 'Le créneau est disponible.' });
        } else {
            res.status(200).json({ available: false, message: 'Ce créneau est déjà complet.' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ available: false, message: 'Erreur serveur lors de la vérification de disponibilité.' });
    }
});


// @route   GET /api/reservations/user
// @desc    Récupérer les réservations d'un utilisateur spécifique
// @access  Privé (utilisateur authentifié)
router.get('/user', auth, async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.user.id }).sort({ date: -1, time: -1 });
        res.json(reservations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur lors de la récupération des réservations.');
    }
});

// @route   DELETE /api/reservations/:id
// @desc    Annuler une réservation
// @access  Privé (utilisateur authentifié, propriétaire de la réservation ou admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ message: 'Réservation non trouvée.' });
        }

        if (reservation.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Non autorisé.' });
        }

        reservation.status = 'cancelled';
        await reservation.save();

        res.json({ message: 'Réservation annulée avec succès.' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de réservation invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors de l\'annulation de la réservation.' });
    }
});


// @route   GET /api/reservations/admin
// @desc    Récupérer toutes les réservations (pour l'admin)
// @access  Privé (admin uniquement - à implémenter)
router.get('/admin', auth, async (req, res) => {
    // Ici, vous devrez ajouter une vérification de rôle si vous avez des rôles utilisateurs
    // if (req.user.role !== 'admin') {
    //     return res.status(403).json({ message: 'Accès refusé, vous n\'êtes pas administrateur.' });
    // }
    try {
        const reservations = await Reservation.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(reservations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur lors de la récupération des réservations (admin).');
    }
});


// @route   PUT /api/reservations/:id/status
// @desc    Mettre à jour le statut d'une réservation (pour l'admin)
// @access  Privé (admin uniquement - à implémenter)
router.put('/:id/status', auth, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Statut invalide fourni.' });
    }

    try {
        let reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ message: 'Réservation non trouvée.' });
        }

        // Ajoutez ici la vérification du rôle admin si nécessaire
        // if (req.user.role !== 'admin') {
        //     return res.status(403).json({ message: 'Accès refusé, vous n\'êtes pas administrateur.' });
        // }

        reservation.status = status;
        await reservation.save();

        res.json({ message: `Statut de la réservation mis à jour en '${status}'`, reservation });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de réservation invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;