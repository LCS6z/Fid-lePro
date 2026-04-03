const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Routes
const authRoutes = require('./routes/auth')
const scanRoutes = require('./routes/scan')
const commercantRoutes = require('./routes/commercant')
const clientRoutes = require('./routes/client')
const stripeRoutes = require('./routes/stripe')
const { verifierToken, verifierRole } = require('./middleware/auth')

// Route protégée test commerçant
app.get('/api/commercant/dashboard', verifierToken, verifierRole('commercant'), (req, res) => {
  res.json({ message: 'Bienvenue sur votre dashboard commerçant !', user: req.user })
})

app.use('/api/auth', authRoutes)
app.use('/api/scan', scanRoutes)
app.use('/api/commercant', commercantRoutes)
app.use('/api/client', clientRoutes)
app.use('/api/stripe', stripeRoutes)

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'FidèlePro API fonctionne !' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`)
})