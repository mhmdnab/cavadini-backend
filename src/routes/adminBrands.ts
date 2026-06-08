import { Router } from 'express';
import { createBrand, updateBrand, deleteBrand } from '../controllers/brandController';

const router = Router();
router.post('/', createBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

export default router;
