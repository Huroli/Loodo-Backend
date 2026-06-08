import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

// dotenv konfigürasyonu
dotenv.config();

// Hesap oluşturmak için gerekli olan fonksiyon tanımlanıyor.
export const createUser = async (req, res) => {
    console.log("📥 FRONTEND'DEN GELEN KAYIT VERİSİ (req.body):", req.body);

    const { email, firstName, lastName, nickname, confirmPassword, birthDate, country } = req.body;
    const password = req.body.password || req.body.hashedPassword;

    try {
        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Passwords do not match!' });
        }

        if (!password) {
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Password is required!' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Password must be at least 8 characters long!' });
        }

        const isEmailAvailable = await User.findOne({ email });
        if (isEmailAvailable) {
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Email is already taken!' });
        }

        const isNicknameAvailable = await User.findOne({ nickname });
        if (isNicknameAvailable) {
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Nickname is already taken!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            firstName,
            lastName,
            nickname,
            password: hashedPassword,       
            hashedPassword: hashedPassword, 
            birthDate,
            country,
        });

        await newUser.save();
        res.status(201).json({ error: false, isUserCreated: true, message: 'User created successfully!' });
    } catch (error) {
        console.error("🚨 AMAN HOCAM KABUL EDİLMEYEN HATA (KAYIT):", error);
        res.status(400).json({ error: true, isUserCreated: false, message: error.message });
    }
}

// Kullanıcının giriş yapması için gerekli olan fonksiyon tanımlanıyor.
export const loginUser = async (req, res) => {
    // 🎯 LOG EKLEDİK: Giriş yaparken frontend'in ne gönderdiğini Render loglarında görebileceğiz
    console.log("📥 FRONTEND'DEN GELEN GİRİŞ VERİSİ (req.body):", req.body);

    const { email, nickname } = req.body;
    
    // 🎯 KRİTİK DÜZELTME: Frontend şifreyi giriş yaparken de 'hashedPassword' olarak gönderiyorsa burada yakalıyoruz.
    const password = req.body.password || req.body.hashedPassword;

    if (!email && !nickname) {
        return res.status(400).json({ message: 'Email or nickname is missing!' });
    }

    if (!password) {
        return res.status(400).json({ message: 'Password is missing!' });
    }

    try {
        let user;
        if (email) {
            user = await User.findOne({ email });
        } else if (nickname) {
            user = await User.findOne({ nickname });
        }

        if (!user) {
            return res.status(400).json({ error: true, message: 'User not found!' });
        }

        // Veritabanında şifre hangi isimle tutuluyorsa esnek şekilde yakala
        const savedPasswordInDb = user.password || user.hashedPassword;
        if (!savedPasswordInDb) {
            return res.status(400).json({ error: true, message: 'User password hash not found in database!' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, savedPasswordInDb);

        if (!isPasswordCorrect) {
            return res.status(400).json({ error: true, message: 'Password is incorrect!' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ error: false, isLoggedIn: true, message: 'Login successful!' });

    } catch (error) {
        console.error("🚨 AMAN HOCAM KABUL EDİLMEYEN HATA (LOGIN):", error);
        res.status(500).json({ error: true, isLoggedIn: false, message: error.message || 'Internal server error while user log in!' });
    }
}

// Kullanıcının giriş yapıp yapmadığını kontrol etmek için gerekli olan fonksiyon tanımlanıyor.
export const isAuthenticated = async (req, res) => {
    try {
        const token = req.cookies.authToken;

        if (!token) {
            return res.status(401).json({ error: true, isLoggedIn: false, message: 'No token provided!' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken.id);

        if (!user) {
            return res.status(401).json({ error: true, isLoggedIn: false, message: 'User not found!' });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ error: true, isLoggedIn: false, message: 'User is inactive or banned!' });
        }

        return res.status(200).json({ error: false, isLoggedIn: true, message: 'User is logged in.' });
    } catch (error) {
        return res.status(401).json({ error: true, isLoggedIn: false, message: 'Internal server error while checking user authentication!' });
    }
}

// Kullanıcının bilgilerini getirmek için gerekli olan fonksiyon tanımlanıyor.
export const getUserProfile = async (req, res) => {
    try {
        const { _id, hashedPassword, password, ...userData } = req.user.toObject();
        return res.status(200).json({ error: false, message: 'User profile fetched successfully!', user: userData });
    } catch (error) {
        return res.status(500).json({ error: true, message: 'Internal server error while getting user profile!' });
    }
}

// Kullanıcının çıkışını yapmak için gerekli olan fonksiyon tanımlanıyor.
export const logoutUser = (req, res) => {
    try {
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });
        return res.status(200).json({ error: false, isLoggedIn: false, isLoggedOut: true, message: 'Logout successful!' });
    } catch (error) {
        return res.status(500).json({ error: true, isLoggedIn: false, isLoggedOut: false, message: 'Internal server error while user log out!' });
    }
}