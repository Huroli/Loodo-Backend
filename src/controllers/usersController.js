import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

// dotenv konfigürasyonu
dotenv.config();

// Hesap oluşturmak için gerekli olan fonksiyon tanımlanıyor.
export const createUser = async (req, res) => {
    // 🎯 İŞTE BURASI: Frontend'den gelen ham veriyi Render loglarına aynen yazdırıyoruz!
    console.log("📥 FRONTEND'DEN GELEN KAYIT VERİSİ (req.body):", req.body);

    // Gelen istek gövdesinden sadece istenilen bilgiler tanımlanıyor.
    const { email, firstName, lastName, nickname, password, confirmPassword, birthDate, country } = req.body;

    try {
        // DÜZELTME: Frontend'de confirmPassword alanı olmadığı için, sadece gönderilirse kontrol etmesini sağladık.
        if (confirmPassword && password !== confirmPassword) {
            console.warn("⚠️ Takılan Kural: Şifreler eşleşmiyor!");
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Passwords do not match!' });
        }

        // DÜZELTME: Şifre hiç gönderilmediyse (undefined ise)
        if (!password) {
            console.warn("⚠️ Takılan Kural: Şifre alanı boş (undefined) geldi!");
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Password is required!' });
        }

        // Şifre en az 8 karakter olmalıdır.
        if (password.length < 8) {
            console.warn(`⚠️ Takılan Kural: Şifre kısa! Gelen uzunluk: ${password.length}`);
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Password must be at least 8 characters long!' });
        }

        // Email zaten kullanılıyorsa hata döndürülüyor.
        const isEmailAvailable = await User.findOne({ email });
        if (isEmailAvailable) {
            console.warn("⚠️ Takılan Kural: Bu Email zaten alınmış!");
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Email is already taken!' });
        }

        // Kullanıcı adı zaten kullanılıyorsa hata döndürülüyor.
        const isNicknameAvailable = await User.findOne({ nickname });
        if (isNicknameAvailable) {
            console.warn("⚠️ Takılan Kural: Bu Nickname zaten alınmış!");
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Nickname is already taken!' });
        }

        // Şifre hashleniyor.
        const hashedPassword = await bcrypt.hash(password, 10);

        // User modeli kullanılarak yeni bir kullanıcı oluşturuluyor.
        const newUser = new User({
            email,
            firstName,
            lastName,
            nickname,
            hashedPassword,
            birthDate,
            country,
        });

        // Oluşturulan yeni kullanıcı veri tabanına kaydediliyor.
        await newUser.save();
        res.status(201).json({ error: false, isUserCreated: true, message: 'User created successfully!' });  // Başarılı işlem yanıtı döndürülüyor.
    } catch (error) {
        console.error("🚨 AMAN HOCAM KABUL EDİLMEYEN HATA:", error);
        res.status(400).json({ error: true, isUserCreated: false, message: error.message });   // Başarısız işlem yanıtı döndürülüyor.
    }
}

// Kullanıcının giriş yapması için gerekli olan fonksiyon tanımlanıyor.
export const loginUser = async (req, res) => {
    const { email, nickname, password } = req.body;

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
        } else {
            return res.status(400).json({ message: 'User not found!' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.hashedPassword);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Password is incorrect!' });
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
        res.status(500).json({ error: true, isLoggedIn: false, message: 'Internal server error while user log in!' });
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
        const { _id, hashedPassword, ...userData } = req.user.toObject();
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