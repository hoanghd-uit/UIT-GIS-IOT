import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
}

@Injectable()
export class RateLimiterService {
  private readonly attempts = new Map<string, AttemptRecord>();
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes window
  private readonly maxAttempts = 5;

  // Scrypt hashing concurrency semaphore to prevent CPU exhaustion DoS
  private activeHashJobs = 0;
  private readonly maxConcurrentHashJobs = 4;

  checkLoginAttempt(key: string): void {
    const record = this.attempts.get(key);
    if (!record) return;

    const now = Date.now();
    if (now - record.firstAttemptAt > this.windowMs) {
      // Window expired, reset
      this.attempts.delete(key);
      return;
    }

    if (record.count >= this.maxAttempts) {
      const waitMinutes = Math.ceil((record.firstAttemptAt + this.windowMs - now) / 60000);
      throw new HttpException(
        `Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau ${waitMinutes} phút.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailedAttempt(key: string): void {
    const now = Date.now();
    const record = this.attempts.get(key);
    if (!record || now - record.firstAttemptAt > this.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      });
    } else {
      record.count += 1;
      record.lastAttemptAt = now;
    }
  }

  resetAttempts(key: string): void {
    this.attempts.delete(key);
  }

  async acquireHashSlot<T>(fn: () => Promise<T>): Promise<T> {
    while (this.activeHashJobs >= this.maxConcurrentHashJobs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this.activeHashJobs++;
    try {
      return await fn();
    } finally {
      this.activeHashJobs--;
    }
  }
}
