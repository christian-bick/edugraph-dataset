import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {CountingHundredOffsetGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('counting-hundred-offset spec', () => {
    const countingLabels = [Scope.Before, Scope.After, Scope.AdditiveCount, Scope.SubtractiveCount];

    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Scope.StepsOf100]));
        expect(new CountingHundredOffsetGenerator().schema).not.toHaveProperty('stepMagnitude');
    });

    it('supports arithmetic directions without sequence-position or counting capabilities', () => {
        const labels = [...spec.generalLabels, ...extractSchemaLabels(new CountingHundredOffsetGenerator().schema)];
        expect(labels).toEqual(expect.arrayContaining([Area.Increment, Area.Decrement]));
        for (const label of countingLabels) expect(labels).not.toContain(label);
    });

    it('supports only the optional three-digit largest-operand profile', () => {
        const generator = new CountingHundredOffsetGenerator();
        const supported = extractSchemaLabels(generator.schema);
        expect(supported).toContain(Scope.ThreeDigitLargestOperand);
        expect(supported).not.toContain(Scope.TwoDigitLargestOperand);
        expect(spec.generalLabels).not.toContain(Scope.ThreeDigitLargestOperand);
        for (const direction of [Area.Increment, Area.Decrement]) {
            const labels = [Scope.NumbersLarger100, Scope.NumbersSmaller1000, direction, Scope.ThreeDigitLargestOperand];
            expect(extractConfig(generator.schema, labels).config.operandProfile).toBe('three-digit');
            const stub = generateWithLabels(generator, labels)!;
            expect(stub.labels).toContain(Scope.ThreeDigitLargestOperand);
            expect(String(Math.max(stub.data.numObjects, stub.data.stepSize))).toHaveLength(3);
            expect(stub.data.numObjects).toBeGreaterThanOrEqual(stub.data.stepSize);
        }
    });

    it('preserves small starting operands without inventing a profile claim', () => {
        const generator = new CountingHundredOffsetGenerator();
        const labels = [Scope.NumbersSmaller120, Area.Increment];
        expect(extractConfig(generator.schema, labels).config.operandProfile).toBe('unrestricted');
        const stub = generateWithLabels(generator, labels)!;
        expect(stub.data.numObjects).toBeLessThan(stub.data.stepSize);
        expect(stub.labels).not.toContain(Scope.TwoDigitLargestOperand);
        expect(stub.labels).not.toContain(Scope.ThreeDigitLargestOperand);
    });

    it.each([[Area.Increment, 'inc'], [Area.Decrement, 'dec']] as const)(
        'resolves %s without inventing a counting or sequence-position claim', (direction, incDecType) => {
            for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(new CountingHundredOffsetGenerator(), [Scope.NumbersSmaller1000, direction])!;
                expect(stub.data.stepSize).toBe(100);
                expect(stub.data.incDecType).toBe(incDecType);
                expect(stub.data.incDecAnswer).toBe(stub.data.numObjects + (incDecType === 'inc' ? 100 : -100));
                expect(stub.labels.filter(label => label === Area.Increment || label === Area.Decrement)).toEqual([direction]);
                for (const label of countingLabels) expect(stub.labels).not.toContain(label);
            }
        }
    );

    it('keeps the same payload family and emits the chosen arithmetic direction when it is unspecified', () => {
        const seen = new Set<string>();
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(new CountingHundredOffsetGenerator(), [Scope.NumbersSmaller1000])!;
            const {data} = stub;
            expect(data.stepSize).toBe(100);
            seen.add(data.incDecType);
            const expectedDirection = data.incDecType === 'inc' ? Area.Increment : Area.Decrement;
            expect(stub.labels.filter(label => label === Area.Increment || label === Area.Decrement)).toEqual([expectedDirection]);
            for (const label of countingLabels) expect(stub.labels).not.toContain(label);
        }
        expect([...seen].sort()).toEqual(['dec', 'inc']);
    });
});
