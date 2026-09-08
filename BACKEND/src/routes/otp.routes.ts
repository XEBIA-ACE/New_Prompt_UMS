/**
 * otp.routes.ts
 *
 * Factory function that wires OtpService dependencies and returns an Express
 * Router with POST /send mounted.
 * Parent app mounts this at /api/v1/otp.
 *
 * The Redis client and OtpDeliveryPort are accepted as parameters (rather
 * than constructed internally) because they are shared external clients owned
 * by server.ts's top-level wiring.
 *
 * Requirements: US-001 FR-002, FR-007, FR-011
 */

import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { Redis } from 'ioredis';
import { UserRepository } from '../repositories/user.repository';
import { OtpRequestRepository } from '../repositories/otp-request.repository';
import { DefaultOtpService } from '../services/otp.service';
import { OtpDeliveryPort } from '../adapters/otp-delivery.port';
import { OtpController } from '../controllers/otp.controller';

export function createOtpRouter(
  db: Database,
  _redis: Redis,
  otpDeliveryPort: OtpDeliveryPort,
): Router {
  const router = Router();

  const controller = new OtpController(
    new DefaultOtpService(
      new UserRepository(db),
      new OtpRequestRepository(db),
      otpDeliveryPort,
      db,
    ),
  );

  // POST /api/v1/otp/send
  router.post('/send', (req, res) => { void controller.sendOtp(req, res); });

  return router;
}
