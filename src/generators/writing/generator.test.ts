import {describe, expect, it} from 'vitest';
import {setSeed} from '../../lib/random.ts';
import {WritingGenerator} from './generator.ts';

describe('WritingGenerator', () => {
    const generator = new WritingGenerator();

    it('should have the correct type', () => {
        expect(generator.type).toBe('writing');
    });

    it('should produce zero for every sample that requires zero', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({range: {min: 0, max: 20}, requireZero: true});
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBe(0);
        }
    });

    it('should exclude zero for every sample that does not require zero', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({range: {min: 0, max: 20}, requireZero: false});
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(20);
        }
    });

    it('should return null for invalid or zero-incompatible ranges', () => {
        expect(generator.generate({range: {min: 5, max: 2}, requireZero: false})).toBeNull();
        expect(generator.generate({range: {min: 1, max: 20}, requireZero: true})).toBeNull();
    });

    it('generates the grade-one extension from 101 through 120', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const stub = generator.generate({range: {min: 101, max: 999}, requireZero: false});
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(111);
            expect(stub!.data.number).toBeLessThanOrEqual(119);
            expect(String(stub!.data.number)).not.toContain('0');
        }
    });

    it('should strictly validate every required config field', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({range: {min: 0, max: 20}} as any)).toThrow();
        expect(() => generator.generate({requireZero: false} as any)).toThrow();
    });
});
