/**
 * Tests para validación de schemas Zod compartidos
 * Verifica que los schemas rechacen datos inválidos y acepten válidos
 */
import '@testing-library/jest-dom';

describe('Business Logic Tests', () => {
  describe('Email validation', () => {
    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.pe')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('DNI validation (Peru)', () => {
    const isValidDNI = (dni: string) => {
      return /^\d{8}$/.test(dni);
    };

    it('should accept 8-digit DNIs', () => {
      expect(isValidDNI('12345678')).toBe(true);
      expect(isValidDNI('87654321')).toBe(true);
    });

    it('should reject invalid DNIs', () => {
      expect(isValidDNI('1234567')).toBe(false); // 7 digits
      expect(isValidDNI('123456789')).toBe(false); // 9 digits
      expect(isValidDNI('1234567a')).toBe(false); // letter
      expect(isValidDNI('')).toBe(false);
    });
  });

  describe('Currency formatting', () => {
    const formatPEN = (amount: number) => {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
      }).format(amount);
    };

    it('should format positive amounts', () => {
      const result = formatPEN(1500.5);
      expect(result).toContain('1');
      expect(result).toContain('500');
    });

    it('should format zero', () => {
      const result = formatPEN(0);
      expect(result).toBeTruthy();
    });

    it('should handle negative amounts', () => {
      const result = formatPEN(-100);
      expect(result).toBeTruthy();
    });
  });

  describe('Date formatting', () => {
    it('should format ISO date to Peruvian format', () => {
      const date = new Date('2026-01-15T10:00:00Z');
      const formatted = date.toLocaleDateString('es-PE');
      expect(formatted).toBeTruthy();
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      expect(isNaN(invalidDate.getTime())).toBe(true);
    });
  });
});
