import { Router } from 'express';
import multer from 'multer';
import { MAX_BYTES } from '../lib/storage';
import {
  uploadProductImages,
  reorderProductImages,
  deleteProductImage,
} from '../controllers/imageController';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES } });

const router = Router();
router.post('/products/:id/images', upload.array('images', 12), uploadProductImages);
router.put('/products/:id/images', reorderProductImages);
router.delete('/products/:id/images', deleteProductImage);

export default router;
