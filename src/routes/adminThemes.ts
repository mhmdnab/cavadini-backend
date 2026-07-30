import { Router } from 'express';
import { createTheme, updateTheme, deleteTheme, reorderThemes } from '../controllers/themeController';

const router = Router();
router.post('/', createTheme);
// Must precede '/:id' so "reorder" isn't captured as an id param.
router.put('/reorder', reorderThemes);
router.put('/:id', updateTheme);
router.delete('/:id', deleteTheme);

export default router;
