import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
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
