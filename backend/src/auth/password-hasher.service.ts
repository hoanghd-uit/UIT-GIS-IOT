import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
  keyLen: number;
  maxmem: number;
}

const DEFAULT_SCRYPT_PARAMS: ScryptParams = {
  N: 131072, // 2^17 (OWASP recommended baseline)
  r: 8,
  p: 1,
  keyLen: 32,
  maxmem: 256 * 1024 * 1024, // 256MB
};

@Injectable()
export class PasswordHasherService {
  private readonly logger = new Logger(PasswordHasherService.name);

  /**
   * Hashes a password using asynchronous Node scrypt with random salt.
   * Returns formatted string: scrypt$N=...,r=...,p=...$salt$hash
   */
  async hash(password: string, params: ScryptParams = DEFAULT_SCRYPT_PARAMS): Promise<string> {
    const salt = crypto.randomBytes(16);
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(
        password,
        salt,
        params.keyLen,
        { N: params.N, r: params.r, p: params.p, maxmem: params.maxmem },
        (err, progress) => {
          if (err) return reject(err);
          resolve(progress as Buffer);
        },
      );
    });

    const saltHex = salt.toString('hex');
    const hashHex = derivedKey.toString('hex');
    return `scrypt$N=${params.N},r=${params.r},p=${params.p}$${saltHex}$${hashHex}`;
  }

  /**
   * Constant-time verification of password against formatted encoded hash.
   */
  async verify(password: string, encodedHash: string): Promise<boolean> {
    try {
      const parts = encodedHash.split('$');
      if (parts.length !== 4 || parts[0] !== 'scrypt') {
        return false;
      }

      // Parse parameters: N=131072,r=8,p=1
      const paramMatches = parts[1].match(/^N=(\d+),r=(\d+),p=(\d+)$/);
      if (!paramMatches) {
        return false;
      }

      const N = parseInt(paramMatches[1], 10);
      const r = parseInt(paramMatches[2], 10);
      const p = parseInt(paramMatches[3], 10);

      // Bounds check on parameters to prevent DoS via malicious stored hashes
      if (N < 1024 || N > 262144 || r < 1 || r > 16 || p < 1 || p > 16) {
        return false;
      }

      const salt = Buffer.from(parts[2], 'hex');
      const expectedKey = Buffer.from(parts[3], 'hex');

      if (salt.length < 16 || expectedKey.length === 0) {
        return false;
      }

      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(
          password,
          salt,
          expectedKey.length,
          { N, r, p, maxmem: 256 * 1024 * 1024 },
          (err, progress) => {
            if (err) return reject(err);
            resolve(progress as Buffer);
          },
        );
      });

      if (derivedKey.length !== expectedKey.length) {
        return false;
      }

      return crypto.timingSafeEqual(derivedKey, expectedKey);
    } catch (error) {
      this.logger.warn(`Password verification error: ${(error as Error).message}`);
      return false;
    }
  }
}
