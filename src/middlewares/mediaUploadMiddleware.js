import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Dosyaların kaydedileceği klasör tanımlanıyor.
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Benzersiz dosya adı tanımlanıyor.
    },
});

const upload = multer({ storage });

export default upload;