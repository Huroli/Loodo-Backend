import mongoose from 'mongoose';

// MongoDB'ye bağlanmak için gerekli bir fonksiyon oluşturuluyor.
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);    // Hata olursa uygulama sonlandırılıyor.
    }
}

export default connectDB;