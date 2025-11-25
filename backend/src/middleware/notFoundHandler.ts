import { Request, Response, NextFunction } from 'express'

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  })
}

