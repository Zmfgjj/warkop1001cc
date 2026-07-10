const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');

const auth = require('../middleware/auth');

// Middleware Validasi
const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi').isAlphanumeric().withMessage('Username hanya boleh huruf dan angka'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    next();
  }
];

router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', auth(), authController.getMe);
module.exports = router;