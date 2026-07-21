import {beforeEach, describe, expect, it} from 'vitest';
import {ComparisonGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Scope} from 'edugraph-ts';

describe('ComparisonGenerator', () => {
    let generator: ComparisonGenerator;

    beforeEach(() => {
        generator = new ComparisonGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('comparison');
    });

    it('should throw validation error when range is missing', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });

    it('should respect resolved ranges', () => {
        for (let i = 0; i < 100; i++) {
            const stub = generator.generate({ 
                range: { min: 0, max: 10 }
            });
            if (stub) {
                expect(stub.data.num1).toBeGreaterThanOrEqual(0);
                expect(stub.data.num1).toBeLessThanOrEqual(10);
                expect(stub.data.num2).toBeGreaterThanOrEqual(0);
                expect(stub.data.num2).toBeLessThanOrEqual(10);
                expect(['less', 'greater', 'equal']).toContain(stub.data.relation);
            }
        }
    });

    it('should respect greater relation constraint', () => {
        const config = {
            range: { min: 0, max: 20 },
            relation: Scope.Greater
        } as const;
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeGreaterThan(stub!.data.num2);
            expect(stub!.data.relation).toBe('greater');
        }
    });

    it('should respect less relation constraint', () => {
        const config = {
            range: { min: 0, max: 20 },
            relation: Scope.Less
        } as const;
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeLessThan(stub!.data.num2);
            expect(stub!.data.relation).toBe('less');
        }
    });

    it('should respect equal relation constraint', () => {
        const config = {
            range: { min: 0, max: 20 },
            relation: Scope.Equal
        } as const;
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toEqual(stub!.data.num2);
            expect(stub!.data.relation).toBe('equal');
        }
    });

    it('should respect includeZero: false', () => {
        const config = {
            range: { min: 0, max: 5 },
            includeZero: false,
            relation: Scope.Equal
        } as const;
        for (let i = 0; i < 100; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).not.toBe(0);
            expect(stub!.data.num2).not.toBe(0);
        }
    });

    it('should respect allowNegatives: true', () => {
        const config = {
            range: { min: 1, max: 5 },
            allowNegatives: true,
            relation: Scope.Less
        } as const;
        let sawNegative = false;
        for (let i = 0; i < 200; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            if (stub!.data.num1 < 0 || stub!.data.num2 < 0) {
                sawNegative = true;
            }
        }
        expect(sawNegative).toBe(true);
    });
});
