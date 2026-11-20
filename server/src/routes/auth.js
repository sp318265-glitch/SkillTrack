import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = Router();

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    return res.status(201).json({
      message: 'Account created.',
      token: makeToken(user.id),
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Could not register. Check the server terminal.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    return res.json({
      message: 'Signed in.',
      token: makeToken(user.id),
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Could not sign in. Check the server terminal.' });
  }
});

export default router;