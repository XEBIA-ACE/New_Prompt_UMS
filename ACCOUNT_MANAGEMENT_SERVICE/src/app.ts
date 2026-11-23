import express, { NextFunction, Request, Response } from 'express';
import { createHealthRouter, DatabaseCheck } from './routes/health.routes';

export interface AppDependencies {
  checkDatabase: DatabaseCheck;
}

export function createApp({ checkDatabase }: AppDependencies) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.use(createHealthRouter(checkDatabase));

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found.' });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[account-management-service] Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  });

  return app;
}
