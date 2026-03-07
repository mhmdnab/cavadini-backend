import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
      isAdmin?: boolean;
    };
    if (!decoded.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default adminMiddleware;
