import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

// HESAP OLUŞTURMA
export const createUser = async (req, res) => {
    console.log("📥 FRONTEND'DEN GELEN KAYIT VERİSİ:", req.body);
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
        console.error("🚨 HATA (KAYIT):", error);
        res.status(400).json({ error: true, isUserCreated: false, message: error.message });
    }
}

// KULLANICI GİRİŞİ (LOGIN)
export const loginUser = async (req, res) => {
    console.log("📥 FRONTEND'DEN GELEN GİRİŞ VERİSİ:", req.body);
    const { email, nickname } = req.body;
    const password = req.body.password || req.body.hashedPassword;

    if (!email && !nickname) return res.status(400).json({ message: 'Email or nickname is missing!' });
    if (!password) return res.status(400).json({ message: 'Password is missing!' });

    try {
        let user;
        if (email) {
            user = await User.findOne({ email });
        } else if (nickname) {
            user = await User.findOne({ nickname });
        }

        if (!user) return res.status(400).json({ error: true, message: 'User not found!' });

        const savedPasswordInDb = user.password || user.hashedPassword;
        if (!savedPasswordInDb) return res.status(400).json({ error: true, message: 'User password hash not found in database!' });

        const isPasswordCorrect = await bcrypt.compare(password, savedPasswordInDb);
        if (!isPasswordCorrect) return res.status(400).json({ error: true, message: 'Password is incorrect!' });

        const jwtSecretKey = process.env.JWT_SECRET || 'loodo_jwt_secret_key_2026';
        const token = jwt.sign({ id: user._id, role: user.role }, jwtSecretKey, { expiresIn: '30d' });

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: true, 
            sameSite: 'None', 
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        const { password: _, hashedPassword: __, ...userData } = user.toObject();

        // 🎯 DÜZELTME: Veriyi hem 'user' objesinde hem de kök dizinde spread ederek gönderiyoruz (undefined hatasını çözer)
        return res.status(200).json({ 
            error: false, 
            isLoggedIn: true, 
            message: 'Login successful!',
            token,
            user: userData,
            ...userData 
        });

    } catch (error) {
        console.error("🚨 HATA (LOGIN):", error);
        res.status(500).json({ error: true, isLoggedIn: false, message: error.message || 'Internal server error!' });
    }
}

// AUTH KONTROLÜ
export const isAuthenticated = async (req, res) => {
    try {
        const token = req.cookies.authToken;
        if (!token) return res.status(401).json({ error: true, isLoggedIn: false, message: 'No token provided!' });

        const jwtSecretKey = process.env.JWT_SECRET || 'loodo_jwt_secret_key_2026';
        const decodedToken = jwt.verify(token, jwtSecretKey);
        const user = await User.findById(decodedToken.id);

        if (!user) return res.status(401).json({ error: true, isLoggedIn: false, message: 'User not found!' });
        if (user.status !== 'active') return res.status(401).json({ error: true, isLoggedIn: false, message: 'User is inactive!' });

        return res.status(200).json({ error: false, isLoggedIn: true, message: 'User is logged in.' });
    } catch (error) {
        return res.status(401).json({ error: true, isLoggedIn: false, message: 'Authentication error!' });
    }
}

// PROFİL BİLGİLERİNİ GETİRME
export const getUserProfile = async (req, res) => {
    try {
        // Eğer bir auth middleware kullanıyorsan req.user doludur
        const userObj = req.user ? req.user : await User.findById(req.body.userId);
        if (!userObj) return res.status(404).json({ error: true, message: 'User not found!' });

        const { _id, hashedPassword, password, ...userData } = userObj.toObject();
        
        // 🎯 DÜZELTME: Profil çekerken de çift yönlü veri yapısı sağladık
        return res.status(200).json({ 
            error: false, 
            message: 'User profile fetched successfully!', 
            user: userData,
            ...userData 
        });
    } catch (error) {
        return res.status(500).json({ error: true, message: 'Internal server error while getting profile!' });
    }
}

// 👑 YENİ ÖZELLİK: PROFİL ÖZELLEŞTİRME (Kullanıcı güncelleme)
export const updateUserProfile = async (req, res) => {
    console.log("📥 PROFILE UPDATE REQUEST:", req.body);
    try {
        // Auth middleware'den gelen id'yi veya gövdeden gelen id'yi yakala
        const userId = req.user?._id || req.body.userId; 
        if (!userId) return res.status(401).json({ error: true, message: 'Unauthorized action!' });

        const { firstName, lastName, nickname, country, bio, avatarUrl } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, nickname, country, bio, avatarUrl },
            { new: true, runValidators: true }
        ).select('-password -hashedPassword');

        return res.status(200).json({
            error: false,
            message: 'Profile updated successfully!',
            user: updatedUser,
            ...updatedUser.toObject()
        });
    } catch (error) {
        console.error("🚨 HATA (PROFILE UPDATE):", error);
        return res.status(500).json({ error: true, message: error.message });
    }
}

// ÇIKIŞ YAPMA
export const logoutUser = (req, res) => {
    try {
        res.clearCookie('authToken', { httpOnly: true, secure: true, sameSite: 'None' });
        return res.status(200).json({ error: false, isLoggedIn: false, isLoggedOut: true, message: 'Logout successful!' });
    } catch (error) {
        return res.status(500).json({ error: true, message: 'Internal server error!' });
    }
}