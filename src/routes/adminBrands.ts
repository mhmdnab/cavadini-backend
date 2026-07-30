import { Router } from 'express';
import { createBrand, updateBrand, deleteBrand, reorderBrands } from '../controllers/brandController';

const router = Router();
router.post('/', createBrand);
// Must precede '/:id' so "reorder" isn't captured as an id param.
router.put('/reorder', reorderBrands);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

export default router;
