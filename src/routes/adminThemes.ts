import { Router } from 'express';
import { createTheme, updateTheme, deleteTheme } from '../controllers/themeController';

const router = Router();
router.post('/', createTheme);
router.put('/:id', updateTheme);
router.delete('/:id', deleteTheme);

export default router;
