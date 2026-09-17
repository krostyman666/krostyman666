import type { PayloadToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      auth?: PayloadToken;
    }
  }
}

export {};
