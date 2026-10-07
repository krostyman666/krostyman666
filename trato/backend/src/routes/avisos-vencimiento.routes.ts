import { Router } from 'express';
import { autenticar, exigirRol } from '../middleware/autenticar';
import * as controlador from '../controllers/avisos-vencimiento.controller';

const router = Router();

router.use(autenticar, exigirRol('admin', 'asesor'));

router.get('/', controlador.listar);
router.post('/', controlador.enviar);

export default router;
