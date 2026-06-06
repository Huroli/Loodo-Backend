import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const authenticateToken = async (req, res, next) => {
    try {
        // Kullanıcının cookie'sinden token alınıyor.
        const token = req.cookies.authToken;

        // Token yok ise kullanıcı giriş yapmadığı için hata döndürülüyor.
        if (!token) {
            return res.status(401).json({ error: true, isLoggedIn: false, message: 'No token provided' });
        }

        // Token doğrulanıyor.
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Token üzerindeki id değerine sahip kullanıcı bulunuyor ve tanımlanıyor.
        const user = await User.findById(decodedToken.id);

        // Kullanıcı bulunamazsa hata döndürülüyor.
        if (!user) {
            return res.status(401).json({ error: true, isLoggedIn: false, message: 'User not found' });
        }

        // Kullanıcı aktif değilse hata döndürülüyor.
        if (user.status !== 'active') {
            return res.status(401).json({ error: true, isLoggedIn: false, message: 'User is inactive or banned' });
        }

        // Kullanıcı giriş yapmışsa true döndürülüyor.
        res.status(200).json({ error: false, isLoggedIn: true, message: 'User is logged in' });

        // Kullanıcı bilgileri request nesnesine ekleniyor.
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: true, isLoggedIn: false, message: 'Invalid token' });
    }
}; 