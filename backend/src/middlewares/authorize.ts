import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';

export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' });
      return;
    }

    next();
  };
}
