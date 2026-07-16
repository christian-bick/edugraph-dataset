import { describe, it, expect, beforeEach } from 'vitest';
import { ArithmeticDecomposeGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('ArithmeticDecomposeGenerator', () => {
    let generator: ArithmeticDecomposeGenerator;

    beforeEach(() => {
        generator = new ArithmeticDecomposeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate valid decomposition pairs', () => {
        const input = {
            labels: [],
            constraints: { mode: 'decompose', targetNumber: 6 }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.targetNumber).toBe(6);
            expect(stub!.data.mode).toBe('decompose');
            
            const p1 = stub!.data.pair1;
            const p2 = stub!.data.pair2;
            expect(p1[0] + p1[1]).toBe(6);
            expect(p2[0] + p2[1]).toBe(6);
            expect(p1[0] === p2[0] && p1[1] === p2[1]).toBe(false);
        }
    });

    it('should return null for non-decompose modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'standard' }
        });
        expect(stub).toBeNull();
    });
});
