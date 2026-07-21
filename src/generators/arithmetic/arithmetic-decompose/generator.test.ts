import {beforeEach, describe, expect, it} from 'vitest';
import {ArithmeticDecomposeGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';

describe('ArithmeticDecomposeGenerator', () => {
    let generator: ArithmeticDecomposeGenerator;

    beforeEach(() => {
        generator = new ArithmeticDecomposeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should throw validation error when range is missing', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });

    it('should throw validation error when range bounds are invalid', () => {
        expect(() => generator.generate({ range: { min: 100, max: 10 } })).toThrow();
        expect(() => generator.generate({ range: { min: 1, max: 2 } })).toThrow();
    });

    it('should generate valid decomposition pairs', () => {
        const config = {
            range: { min: 1, max: 10 }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            
            const target = stub!.data.targetNumber;
            expect(target).toBeGreaterThanOrEqual(3);
            
            const p1 = stub!.data.pair1;
            const p2 = stub!.data.pair2;
            expect(p1[0] + p1[1]).toBe(target);
            expect(p2[0] + p2[1]).toBe(target);
            expect(p1[0] === p2[0] && p1[1] === p2[1]).toBe(false);
        }
    });
});
