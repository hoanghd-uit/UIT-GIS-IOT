import { CaslAbilityFactory, AbilityUser } from '../casl-ability.factory';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;

  const viewerUser: AbilityUser = {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'beiviewer',
    role: 'viewer',
    isActive: true,
  };

  const managerUser: AbilityUser = {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'beimanager',
    role: 'manager',
    isActive: true,
  };

  const inactiveUser: AbilityUser = {
    id: '33333333-3333-3333-3333-333333333333',
    username: 'inactiveuser',
    role: 'manager',
    isActive: false,
  };

  beforeEach(() => {
    factory = new CaslAbilityFactory();
  });

  describe('Anonymous & Inactive Users', () => {
    it('should deny all actions when user is undefined or null', () => {
      const anonAbility = factory.createForUser(undefined);
      expect(anonAbility.can('read', 'Dashboard')).toBe(false);
      expect(anonAbility.can('create', 'FireExtinguisher')).toBe(false);
      expect(anonAbility.can('update', 'DeviceDisplayPosition')).toBe(false);
    });

    it('should deny all actions when user is inactive', () => {
      const inactiveAbility = factory.createForUser(inactiveUser);
      expect(inactiveAbility.can('read', 'Dashboard')).toBe(false);
      expect(inactiveAbility.can('read', 'FireExtinguisher')).toBe(false);
      expect(inactiveAbility.can('create', 'FireExtinguisher')).toBe(false);
    });

    it('should deny all actions when role is unknown', () => {
      const unknownAbility = factory.createForUser({
        id: '444',
        username: 'unknown',
        role: 'superadmin',
        isActive: true,
      });
      expect(unknownAbility.can('read', 'Dashboard')).toBe(false);
    });
  });

  describe('Viewer Matrix', () => {
    it('should allow read Dashboard, AlertConfig, FireExtinguisher, and FireDrill', () => {
      const ability = factory.createForUser(viewerUser);
      expect(ability.can('read', 'Dashboard')).toBe(true);
      expect(ability.can('read', 'AlertConfig')).toBe(true);
      expect(ability.can('read', 'FireExtinguisher')).toBe(true);
      expect(ability.can('read', 'FireDrill')).toBe(true);
    });

    it('should deny all create, update, delete operations for Viewer', () => {
      const ability = factory.createForUser(viewerUser);
      expect(ability.can('update', 'AlertConfig')).toBe(false);
      expect(ability.can('create', 'FireExtinguisher')).toBe(false);
      expect(ability.can('update', 'FireExtinguisher')).toBe(false);
      expect(ability.can('delete', 'FireExtinguisher')).toBe(false);
      expect(ability.can('create', 'FireDrill')).toBe(false);
      expect(ability.can('update', 'FireDrill')).toBe(false);
      expect(ability.can('delete', 'FireDrill')).toBe(false);
      expect(ability.can('update', 'DeviceDisplayPosition')).toBe(false);
      expect(ability.can('delete', 'DeviceDisplayPosition')).toBe(false);
    });
  });

  describe('Manager Matrix', () => {
    it('should allow read Dashboard and read/update AlertConfig', () => {
      const ability = factory.createForUser(managerUser);
      expect(ability.can('read', 'Dashboard')).toBe(true);
      expect(ability.can('read', 'AlertConfig')).toBe(true);
      expect(ability.can('update', 'AlertConfig')).toBe(true);
      expect(ability.can('create', 'AlertConfig')).toBe(false);
      expect(ability.can('delete', 'AlertConfig')).toBe(false);
    });

    it('should allow full create, read, update, delete on FireExtinguisher and FireDrill', () => {
      const ability = factory.createForUser(managerUser);
      expect(ability.can('read', 'FireExtinguisher')).toBe(true);
      expect(ability.can('create', 'FireExtinguisher')).toBe(true);
      expect(ability.can('update', 'FireExtinguisher')).toBe(true);
      expect(ability.can('delete', 'FireExtinguisher')).toBe(true);

      expect(ability.can('read', 'FireDrill')).toBe(true);
      expect(ability.can('create', 'FireDrill')).toBe(true);
      expect(ability.can('update', 'FireDrill')).toBe(true);
      expect(ability.can('delete', 'FireDrill')).toBe(true);
    });

    it('should strictly deny update and delete on DeviceDisplayPosition', () => {
      const ability = factory.createForUser(managerUser);
      expect(ability.can('update', 'DeviceDisplayPosition')).toBe(false);
      expect(ability.can('delete', 'DeviceDisplayPosition')).toBe(false);
    });
  });

  describe('Rule Sanitization', () => {
    it('should produce serializable sanitized rules without secret data', () => {
      const ability = factory.createForUser(managerUser);
      const sanitized = factory.getSanitizedRules(ability);
      expect(Array.isArray(sanitized)).toBe(true);
      for (const rule of sanitized) {
        expect(rule).toHaveProperty('action');
        expect(rule).toHaveProperty('subject');
        expect(rule).not.toHaveProperty('password');
        expect(rule).not.toHaveProperty('hash');
      }
    });
  });
});
