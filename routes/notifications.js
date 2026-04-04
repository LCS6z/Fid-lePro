const express = require('express');
const router = express.Router();
const { envoyerNotification } = require('../services/notification');
const { verifierToken } = require('../middleware/auth');

// Envoyer une notification à un client
router.post('/envoyer', verifierToken, async (req, res) => {
  try {
    const { fcmToken, titre, message } = req.body;
    if (!fcmToken || !titre || !message) {
      return res.status(400).json({ message: 'Paramètres manquants' });
    }
    await envoyerNotification(fcmToken, titre, message);
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur notification:', e);
    res.status(500).json({ message: 'Erreur envoi notification' });
  }
});

module.exports = router;
