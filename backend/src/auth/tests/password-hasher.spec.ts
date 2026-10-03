import { PasswordHasherService } from '../password-hasher.service';

describe('PasswordHasherService', () => {
  let service: PasswordHasherService;

  beforeEach(() => {
    service = new PasswordHasherService();
  });

  it('should hash and verify password correctly with scrypt parameters', async () => {
    // Use lower N for fast unit test
    const fastParams = { N: 1024, r: 8, p: 1, keyLen: 32, maxmem: 64 * 1024 * 1024 };
    const hash = await service.hash('bei1234', fastParams);
    expect(hash).toMatch(/^scrypt\$N=1024,r=8,p=1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);

    const isValid = await service.verify('bei1234', hash);
    expect(isValid).toBe(true);

    const isInvalid = await service.verify('wrong_password', hash);
    expect(isInvalid).toBe(false);
  });

  it('should generate distinct salts and hashes for the same password', async () => {
    const fastParams = { N: 1024, r: 8, p: 1, keyLen: 32, maxmem: 64 * 1024 * 1024 };
    const hash1 = await service.hash('bei1234', fastParams);
    const hash2 = await service.hash('bei1234', fastParams);
    expect(hash1).not.toBe(hash2);

    expect(await service.verify('bei1234', hash1)).toBe(true);
    expect(await service.verify('bei1234', hash2)).toBe(true);
  });

  it('should safely return false for malformed or corrupted hashes', async () => {
    expect(await service.verify('bei1234', 'not-a-hash')).toBe(false);
    expect(await service.verify('bei1234', 'scrypt$badparam$1234$5678')).toBe(false);
    expect(await service.verify('bei1234', 'scrypt$N=9999999,r=8,p=1$1234$5678')).toBe(false);
  });
});
