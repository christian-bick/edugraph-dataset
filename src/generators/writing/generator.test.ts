import { describe, it, expect, beforeEach } from 'vitest';
import { WritingGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('WritingGenerator', () => {
    let generator: WritingGenerator;

    beforeEach(() => {
        generator = new WritingGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('writing');
    });

    it('should default min to 1 and max to 9 if constraints are missing', () => {
        const input = { labels: [], constraints: {} };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(9);
            expect(stub!.data.mode).toBe('stroke');
        }
    });

    it('should respect custom min/max bounds including zero and twenty', () => {
        const input = { labels: [], constraints: { min: 0, max: 20 } };
        let zeroFound = false;
        let twentyFound = false;
        for (let i = 0; i < 100; i++) {
            const stub = generator.generate(input);
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

    it('should respect exact fixed number constraint', () => {
        const input = { labels: [], constraints: { number: 15 } };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.number).toBe(15);
    });

    it('should return null for count-objects mode', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'count-objects' }
        });
        expect(stub).toBeNull();
    });
});
