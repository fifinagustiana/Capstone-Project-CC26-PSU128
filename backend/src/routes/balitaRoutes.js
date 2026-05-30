import express from 'express';
import {
    getAllBalita,
    createBalita,
    deleteBalita,
} from '../controllers/balitaController.js';

const router = express.Router();

router.get('/', getAllBalita);
router.post('/', createBalita);
router.delete('/:id', deleteBalita);

export default router;