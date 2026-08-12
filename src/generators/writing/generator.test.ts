import {describe, expect, it} from 'vitest';
import {setSeed} from '../../lib/random.ts';
import {WritingGenerator} from './generator.ts';
import {Area} from 'edugraph-ts';

const digitNotation = {notationFamily: Area.DigitNotation} as const;

describe('WritingGenerator', () => {
    const generator = new WritingGenerator();

    it('should have the correct type', () => {
        expect(generator.type).toBe('writing');
    });

    it('should produce zero for every sample that requires zero', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({...digitNotation, range: {min: 0, max: 20}, requireZero: true});
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBe(0);
        }
    });

    it('should exclude zero for every sample that does not require zero', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({...digitNotation, range: {min: 0, max: 20}, requireZero: false});
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(20);
        }
    });

    it('should include the upper boundary of 120', () => {
        const stub = generator.generate({...digitNotation, range: {min: 120, max: 120}, requireZero: false});
        expect(stub).not.toBeNull();
        expect(stub!.data.number).toBe(120);
    });

    it('should stay within the inclusive 1-120 range', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({...digitNotation, range: {min: 0, max: 120}, requireZero: false});
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(120);
        }
    });

    it('should include the upper boundary of 1000', () => {
        const stub = generator.generate({...digitNotation, range: {min: 1000, max: 1000}, requireZero: false});
        expect(stub).not.toBeNull();
        expect(stub!.data.number).toBe(1000);
    });

    it('should return null for invalid or zero-incompatible ranges', () => {
        expect(generator.generate({...digitNotation, range: {min: 5, max: 2}, requireZero: false})).toBeNull();
        expect(generator.generate({...digitNotation, range: {min: 1, max: 20}, requireZero: true})).toBeNull();
    });

    it('should strictly validate every required config field', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({range: {min: 0, max: 20}} as any)).toThrow();
        expect(() => generator.generate({requireZero: false} as any)).toThrow();
    });
});
