const express = require('express');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('./key.js'); // Paste your Firebase key file here
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const userRef = db.collection('users').doc(username);
  const doc = await userRef.get();

  if (doc.exists) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await userRef.set({
    passwordHash: hashedPassword,
    data: { coins: 0, level: 1 }
  });

  res.json({ success: true });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userRef = db.collection('users').doc(username);
  const doc = await userRef.get();

  if (!doc.exists) {
    return res.status(400).json({ error: 'User not found' });
  }

  const userData = doc.data();
  const isValid = await bcrypt.compare(password, userData.passwordHash);

  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  res.json({ success: true, data: userData.data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
