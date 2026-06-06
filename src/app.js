import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import cookieParser from 'cookie-parser';
import usersRoutes from './routes/usersRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';

// Express uygulaması oluşturuluyor.
const app = express();

// Cookie Parser middleware olarak ekleniyor.
app.use(cookieParser());

// Gelen isteklerde JSON gövdesini ayrıştırmak için middleware ekleniyor.
app.use(express.json());

// Cors middleware olarak ekleniyor.
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL_PRODUCTION 
        : process.env.FRONTEND_URL_DEVELOPMENT,
    credentials: true,  // Tarayıcıdan gelen cookie bilgilerine erişim izni veriliyor.
}));

// MongoDB'ye bağlantısı ekleniyor.
connectDB();

// Route'lar tanımlanıyor.
app.use('/api/users', usersRoutes);
app.use('/api/media', mediaRoutes);

export default app;