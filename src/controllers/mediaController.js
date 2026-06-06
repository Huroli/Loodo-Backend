import Media from '../models/mediaModel.js';

// Medya oluşturmak için gerekli olan fonksiyon tanımlanıyor.
export const uploadMedia = async (req, res) => {
    // Gelen istek gövdesinden sadece istenilen bilgiler tanımlanıyor.
    const { uploadedBy, title, description, metadata, tags, categoryId } = req.body;
    const file = req.file; // Multer tarafından sağlanan dosya bilgisi

    console.log(req.file); // Gelen dosya bilgisini kontrol et
    console.log(req.body); // Gelen diğer bilgileri kontrol et

    if (!file) {
        return res.status(400).json({ message: 'File is required.' });
    }

    try {
        // Medya modeli kullanılarak yeni bir medya oluşturuluyor.
        const newMedia = new Media({
            uploadedBy,
            title,
            description,
            metadata,
            tags: tags.split(","),
            type: file.mimetype.split("/")[0],
            fileUrl: `/uploads/${file.filename}`,
            categoryId: categoryId ? categoryId : null,
        });

        // Oluşturulan yeni medya veri tabanına kaydediliyor.
        await newMedia.save();

        res.status(201).json({ message: 'Media uploaded successfully.', media: newMedia }); // Başarılı işlem yanıtı döndürülüyor.
    } catch (error) {
        console.error("Media upload error:", error); // Hata logu
        res.status(500).json({ message: 'Error uploading media.', error: error.message });  // Başarısız işlem yanıtı döndürülüyor.
    }
}