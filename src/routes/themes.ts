import { Router } from 'express';
import { getThemes } from '../controllers/themeController';

const router = Router();

router.get('/', getThemes);

export default router;
