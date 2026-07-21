import { beforeEach, describe, expect, it } from 'vitest';
import { ComparisonGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../lib/utils.ts';

describe('ComparisonGenerator Spec Integration', () => {
    let generator: ComparisonGenerator;

    beforeEach(() => {
        generator = new ComparisonGenerator();
        setSeed(42);
    });

    it('should generate correct comparison problems based on relation labels', () => {
        const lessStub = generateWithLabels(generator, [
            Scope.Less,
            Scope.NumbersSmaller10
        ]);
        expect(lessStub).not.toBeNull();
        expect(lessStub!.data.relation).toBe('less');
        expect(lessStub!.data.num1).toBeLessThan(lessStub!.data.num2);

        const greaterStub = generateWithLabels(generator, [
            Scope.Greater,
            Scope.NumbersSmaller10
        ]);
        expect(greaterStub).not.toBeNull();
        expect(greaterStub!.data.relation).toBe('greater');
        expect(greaterStub!.data.num1).toBeGreaterThan(greaterStub!.data.num2);

        const equalStub = generateWithLabels(generator, [
            Scope.Equal,
            Scope.NumbersSmaller10
        ]);
        expect(equalStub).not.toBeNull();
        expect(equalStub!.data.relation).toBe('equal');
        expect(equalStub!.data.num1).toBe(equalStub!.data.num2);
    });

    it('should respect range boundaries from labels', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Scope.NumbersSmaller20,
                Scope.NumbersWithoutZero,
                Scope.Less
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeGreaterThanOrEqual(1);
            expect(stub!.data.num1).toBeLessThanOrEqual(20);
            expect(stub!.data.num2).toBeGreaterThanOrEqual(1);
            expect(stub!.data.num2).toBeLessThanOrEqual(20);
        }
    });

    it('should respect negative numbers and zero constraints', () => {
        const stubWithZero = generateWithLabels(generator, [
            Scope.NumbersWithZero,
            Scope.NumbersSmaller10,
            Scope.Equal
        ]);
        expect(stubWithZero).not.toBeNull();

        const stubWithNegatives = generateWithLabels(generator, [
            Scope.NumbersWithNegatives,
            Scope.NumbersSmaller10
        ]);
        expect(stubWithNegatives).not.toBeNull();
    });
});
