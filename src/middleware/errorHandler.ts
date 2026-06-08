import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Multer upload errors (e.g. file too large) → 400 with a clear message
  // instead of a misleading 500.
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: err.message });
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const fields = (err.meta?.target as string[])?.join(', ') ?? 'field';
        res.status(409).json({ message: 'Duplicate key error', details: `${fields} must be unique` });
        return;
      }
      case 'P2025':
        res.status(404).json({ message: 'Record not found' });
        return;
      case 'P2003':
        res.status(400).json({ message: 'Referenced record does not exist' });
        return;
      case 'P2014':
        res.status(400).json({ message: 'Relation constraint violated' });
        return;
      default:
        break;
    }
  }

  // Prisma validation errors (wrong type passed to client)
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ message: 'Validation error', details: err.message });
    return;
  }

  // Manual validation errors thrown in controllers
  if (err.message.startsWith('Validation:')) {
    res.status(400).json({ message: err.message.replace('Validation: ', '') });
    return;
  }

  console.error(err);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
