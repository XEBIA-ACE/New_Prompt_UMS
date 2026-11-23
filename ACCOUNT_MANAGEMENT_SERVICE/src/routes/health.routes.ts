import { Router } from 'express';

export type DatabaseCheck = () => Promise<boolean>;

/**
 * GET /health — unauthenticated liveness probe. Always 200 while the process
 * is serving; `database` reports PostgreSQL reachability without exposing
 * connection details.
 */
export function createHealthRouter(checkDatabase: DatabaseCheck): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const databaseUp = await checkDatabase().catch(() => false);
    res.status(200).json({
      status: 'ok',
      service: 'account-management-service',
      database: databaseUp ? 'up' : 'down',
    });
  });

  return router;
}
