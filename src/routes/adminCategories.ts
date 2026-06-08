import { Router } from 'express';
import { createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';

const router = Router();
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
