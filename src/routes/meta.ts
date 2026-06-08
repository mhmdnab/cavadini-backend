import { Router } from 'express';
import { getFieldOptions } from '../controllers/metaController';

const router = Router();
router.get('/field-options', getFieldOptions);

export default router;
