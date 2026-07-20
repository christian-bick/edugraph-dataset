import {beforeEach, describe, expect, it} from 'vitest';
import {WritingGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('WritingGenerator', () => {
    let generator: WritingGenerator;

    beforeEach(() => {
        generator = new WritingGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('writing');
    });

    it('should default min to 1 and max to 9 if labels are empty', () => {
        const config = { range: { min: 1, max: 9 } };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(9);
        }
    });

    it('should respect custom min/max bounds including zero and twenty when includeZero is true', () => {
        const config = { range: { min: 0, max: 20 }, includeZero: true };
        let zeroFound = false;
        let twentyFound = false;
        for (let i = 0; i < 100; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            const num = stub!.data.number;
            expect(num).toBeGreaterThanOrEqual(0);
            expect(num).toBeLessThanOrEqual(20);
            if (num === 0) zeroFound = true;
            if (num === 20) twentyFound = true;
        }
        expect(zeroFound).toBe(true);
        expect(twentyFound).toBe(true);
    });

    it('should clamp min to 1 when includeZero is false', () => {
        const config = { range: { min: 0, max: 20 }, includeZero: false };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
        }
    });

    it('should return null if range is invalid', () => {
        const config = { range: { min: 5, max: 2 }, includeZero: false };
        const stub = generator.generate(config);
        expect(stub).toBeNull();
    });

    it('should return null if range configuration is missing', () => {
        const stub = generator.generate({} as any);
        expect(stub).toBeNull();
    });
});
