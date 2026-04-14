import multer from 'multer';
import path from 'path';
import { SUPPORTED_EXTENSIONS } from '../services/file-parser';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ((SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Faqat .docx yoki .pdf formatdagi fayllar qabul qilinadi'));
    }
  },
});

export default upload;
