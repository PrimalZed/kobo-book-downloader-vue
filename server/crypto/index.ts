import cors from 'cors';
import { Router } from 'express';
import multer from 'multer';
import { removeKdrm } from './remove-kdrm';

export default function() {
  const router = Router()
    .use(cors({
      methods: 'POST',
      origin: process.env.VITE_FRONTEND_URL,
    }));

  router.post('/kdrm', multer().single('encryptedFile'), async (req, res) => {
    if (!req.file) {
      res.sendStatus(400);
      return;
    }
    const { key, ...fileKeys } = req.body;
    const decryptedFile = await removeKdrm(req.file.buffer, key, fileKeys);
    res.attachment('decryptedFile.epub3');
    res.send(decryptedFile);
  });

  return router;
}
