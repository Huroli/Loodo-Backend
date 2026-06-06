import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

// dotenv konfigürasyonu
dotenv.config();

// Hesap oluşturmak için gerekli olan fonksiyon tanımlanıyor.
export const createUser = async (req, res) => {
    // Gelen istek gövdesinden sadece istenilen bilgiler tanımlanıyor.
    const { email, firstName, lastName, nickname, password, confirmPassword, birthDate, country } = req.body;

    try {
        // Şifreler eşleşmiyorsa hata döndürülüyor.
        if (password !== confirmPassword) {
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Passwords do not match!' });
        }

        // Şifre en az 8 karakter olmalıdır.
        if (password.length < 8) {
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Password must be at least 8 characters long!' });
        }

        // Email zaten kullanılıyorsa hata döndürülüyor.
        const isEmailAvailable = await User.findOne({ email });
        if (isEmailAvailable) {
            return res.status(400).json({ error: true, isUserCreated: false, message: 'Email is already taken!' });
        }

        // Kullanıcı adı zaten kullanılıyorsa hata döndürülüyor.
        const isNicknameAvailable = await User.findOne({ nickname });
        if (isNicknameAvailable) {
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
        res.status(400).json({ error: true, isUserCreated: false, message: error.message });   // Başarısız işlem yanıtı döndürülüyor.
    }
}

// Kullanıcının giriş yapması için gerekli olan fonksiyon tanımlanıyor.
export const loginUser = async (req, res) => {
    // Gelen istek gövdesinden sadece istenilen bilgiler tanımlanıyor.
    const { email, nickname, password } = req.body;

    // Email eksik ise hata döndürülüyor.
    if (!email && !nickname) {
        return res.status(400).json({ message: 'Email or nickname is missing!' });
    }

    // Şifre eksik ise hata döndürülüyor.
    if (!password) {
        return res.status(400).json({ message: 'Password is missing!' });
    }

    try {
        // Kullanıcının mevcut olup olmadığı kontrol ediliyor.
        let user;
        if (email) {
            user = await User.findOne({ email });
        } else if (nickname) {
            user = await User.findOne({ nickname });
        } else {
            return res.status(400).json({ message: 'User not found!' });
        }

        // Girilen şifre hashlenmiş şifreyle kaşılaştırılıyor.
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        // Şifre doğruysa token oluşturuluyor. Oluşturulan token cookie olarak kullanıcıya gönderiliyor.
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Password is incorrect!' });   // Başarısız işlem yanıtı döndürülüyor.
        }

        // Token oluşturuluyor.
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

        // Cookie oluşturuluyor.
        res.cookie('authToken', token, {
            httpOnly: true,  // Sadece backend erişebilir
            secure: process.env.NODE_ENV === 'production',  // Sadece HTTPS üzerinden
            sameSite: 'Strict',  // CSRF koruması
            maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 günlük geçerlilik süresi
        });

        return res.status(200).json({ error: false, isLoggedIn: true, message: 'Login successful!' });   // Başarılı işlem yanıtı döndürülüyor.

    } catch (error) {
        res.status(500).json({ error: true, isLoggedIn: false, message: 'Internal server error while user log in!' }); // Başarısız işlem yanıtı döndürülüyor.
    }
}

// Kullanıcının giriş yapıp yapmadığını kontrol etmek için gerekli olan fonksiyon tanımlanıyor.
export const isAuthenticated = async (req, res) => {
    try {
        // Kullanıcının cookie'sinden token alınıyor.
        const token = req.cookies.authToken;

        // Token yok ise kullanıcı giriş yapmadığı için hata döndürülüyor.
        if (!token) {
            return res.status(401).json({ error: true, isLoggedIn: false, message: 'No token provided!' });
        }

        // Token doğrulanıyor.
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Token üzerindeki id değerine sahip kullanıcı bulunuyor ve tanımlanıyor.
        const user = await User.findById(decodedToken.id);

        // Kullanıcı bulunamazsa hata döndürülüyor.
        if (!user) {
            return res.status(401).json({ error: true, isLoggedIn: false, message: 'User not found!' });
        }

        // Kullanıcı aktif değilse hata döndürülüyor.
        if (user.status !== 'active') {
            return res.status(401).json({ error: true, isLoggedIn: false, message: 'User is inactive or banned!' });
        }

        // Token değeri doğru ise isLoggedIn değeri true olarak döndürülüyor.
        return res.status(200).json({ error: false, isLoggedIn: true, message: 'User is logged in.' });
    } catch (error) {
        return res.status(401).json({ error: true, isLoggedIn: false, message: 'Internal server error while checking user authentication!' });  // Başarısız işlem yanıtı döndürülüyor.
    }
}

// Kullanıcının bilgilerini getirmek için gerekli olan fonksiyon tanımlanıyor.
export const getUserProfile = async (req, res) => {
    try {
        const { _id, password, ...userData } = req.user.toObject();  // req.user middleware'den geliyor.
        return res.status(200).json({ error: false, message: 'User profile fetched successfully!', user: userData });  // Başarılı işlem yanıtı döndürülüyor.
    } catch (error) {
        return res.status(500).json({ error: true, message: 'Internal server error while getting user profile!' });  // Başarısız işlem yanıtı döndürülüyor.
    }
}

// Kullanıcının çıkışını yapmak için gerekli olan fonksiyon tanımlanıyor.
export const logoutUser = (req, res) => {
    try {
        // authToken adlı cookie siliniyor.
        res.clearCookie('authToken', {
            httpOnly: true, // Sadece backend erişebilir.
            secure: process.env.NODE_ENV === 'production',  // Sadece HTTPS üzerinden çalışacak.
            sameSite: 'Strict', // CSRF koruması.
        });
        return res.status(200).json({ error: false, isLoggedIn: false, isLoggedOut: true, message: 'Logout successful!' });  // Başarılı işlem yanıtı döndürülüyor.
    } catch (error) {
        return res.status(500).json({ error: true, isLoggedIn: false, isLoggedOut: false, message: 'Internal server error while user log out!' });  // Başarısız işlem yanıtı döndürülüyor.
    }
}