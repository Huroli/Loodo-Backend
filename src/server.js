import './config.js';
import app from './app.js';

// Port numarası belirleniyor.
const PORT = process.env.PORT || 5173;

// Uygulama belirlenen port numarasında çalıştırılıyor.
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});