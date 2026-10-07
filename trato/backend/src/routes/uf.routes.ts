import { Router } from 'express';
import * as controlador from '../controllers/uf.controller';

const router = Router();

router.get('/', controlador.obtener);

export default router;
