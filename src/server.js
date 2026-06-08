import './config.js';
import app from './app.js';
import express from 'express';
import fs from 'fs';

// 🎯 RENDER İÇİN KRİTİK: .gitignore yüzünden uploads klasörü sunucuya gitmediyse 
// sistem çökmesin diye klasörü canlıda otomatik oluşturuyoruz.
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// 🎯 MEDYA ERİŞİMİ: Frontend'in (Vercel) yüklenen resimlerin URL'sine 
// (örn: https://loodo-backend.onrender.com/uploads/resim.jpg) erişebilmesi için bu satır şart.
app.use('/uploads', express.static('uploads'));

// Port numarası belirleniyor.
const PORT = process.env.PORT || 5173;

// Uygulama belirlenen port numarasında çalıştırılıyor.
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});