import express from 'express';
import { createUser, loginUser, isAuthenticated, getUserProfile, logoutUser } from '../controllers/usersController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

// Express Router tanımlanıyor.
const router = express.Router();

// Hangi route isteğinde hangi fonksiyonun çalışacağı tanımlanıyor.
router.post('/create-user', createUser);
router.post('/login-user', loginUser);
router.get('/is-authenticated', isAuthenticated);
// Kullanıcı bilgileri ve çıkış işlemleri için authentication gerekli
router.get('/user-informations', authenticateToken, getUserProfile);
router.post('/user-logout', authenticateToken, logoutUser);

export default router;