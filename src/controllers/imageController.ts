import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { uploadImage, deleteImage, ALLOWED_MIME } from '../lib/storage';

async function getProductOr404(id: string, res: Response) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return null;
  }
  return product;
}

export const uploadProductImages = async (req: Request, res: Response) => {
  const product = await getProductOr404(req.params.id, res);
  if (!product) return;

  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    res.status(400).json({ message: 'No files uploaded' });
    return;
  }
  for (const f of files) {
    if (!ALLOWED_MIME.has(f.mimetype)) {
      res.status(400).json({ message: `Unsupported file type: ${f.mimetype}` });
      return;
    }
  }

  const newUrls: string[] = [];
  for (const f of files) {
    newUrls.push(await uploadImage({ buffer: f.buffer, originalname: f.originalname, mimetype: f.mimetype }));
  }

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { images: [...product.images, ...newUrls] },
  });
  res.status(201).json({ images: updated.images });
};

export const reorderProductImages = async (req: Request, res: Response) => {
  const product = await getProductOr404(req.params.id, res);
  if (!product) return;

  const { images } = req.body as { images?: string[] };
  if (!Array.isArray(images)) {
    res.status(400).json({ message: 'images must be an array' });
    return;
  }
  const same =
    images.length === product.images.length &&
    [...images].sort().join('|') === [...product.images].sort().join('|');
  if (!same) {
    res.status(400).json({ message: 'images must be a reordering of the existing images' });
    return;
  }

  const updated = await prisma.product.update({ where: { id: product.id }, data: { images } });
  res.json({ images: updated.images });
};

export const deleteProductImage = async (req: Request, res: Response) => {
  const product = await getProductOr404(req.params.id, res);
  if (!product) return;

  const url = (req.body?.url ?? req.query.url) as string | undefined;
  if (!url || !product.images.includes(url)) {
    res.status(400).json({ message: 'url must be one of the product images' });
    return;
  }

  await deleteImage(url).catch(() => undefined); // best-effort object removal
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { images: product.images.filter((u) => u !== url) },
  });
  res.json({ images: updated.images });
};
