import { describe, it, expect } from 'vitest';
import { toRoman, fromRoman } from './romanNumerals';

describe('romanNumerals', () => {
  describe('toRoman', () => {
    it('converts 1 to I', () => {
      expect(toRoman(1)).toBe('I');
    });

    it('converts 4 to IV', () => {
      expect(toRoman(4)).toBe('IV');
    });

    it('converts 9 to IX', () => {
      expect(toRoman(9)).toBe('IX');
    });

    it('converts 10 to X', () => {
      expect(toRoman(10)).toBe('X');
    });

    it('converts 42 to XLII', () => {
      expect(toRoman(42)).toBe('XLII');
    });

    it('converts 100 to C', () => {
      expect(toRoman(100)).toBe('C');
    });
  });

  describe('fromRoman', () => {
    it('converts I to 1', () => {
      expect(fromRoman('I')).toBe(1);
    });

    it('converts IV to 4', () => {
      expect(fromRoman('IV')).toBe(4);
    });

    it('converts IX to 9', () => {
      expect(fromRoman('IX')).toBe(9);
    });

    it('converts X to 10', () => {
      expect(fromRoman('X')).toBe(10);
    });

    it('converts XLII to 42', () => {
      expect(fromRoman('XLII')).toBe(42);
    });

    it('handles lowercase input', () => {
      expect(fromRoman('xlii')).toBe(42);
    });
  });
});
