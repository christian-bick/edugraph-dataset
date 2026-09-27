import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {CountingTenOffsetGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('counting-ten-offset spec', () => {
    const countingLabels = [Scope.Before, Scope.After, Scope.AdditiveCount, Scope.SubtractiveCount];

    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Scope.StepsOf10]));
        expect(new CountingTenOffsetGenerator().schema).not.toHaveProperty('stepMagnitude');
    });

    it('supports arithmetic directions without sequence-position or counting capabilities', () => {
        const labels = [...spec.generalLabels, ...extractSchemaLabels(new CountingTenOffsetGenerator().schema)];
        expect(labels).toEqual(expect.arrayContaining([Area.Increment, Area.Decrement]));
        for (const label of countingLabels) expect(labels).not.toContain(label);
    });

    it.each([
        [Scope.TwoDigitLargestOperand, 'two-digit', 2],
        [Scope.ThreeDigitLargestOperand, 'three-digit', 3]
    ] as const)('resolves the optional %s profile separately from the task range', (profile, operandProfile, digits) => {
        const generator = new CountingTenOffsetGenerator();
        expect(extractSchemaLabels(generator.schema)).toContain(profile);
        expect(spec.generalLabels).not.toContain(profile);
        for (const direction of [Area.Increment, Area.Decrement]) {
            const labels = [Scope.NumbersLarger10, Scope.NumbersSmaller1000, direction, profile];
            expect(extractConfig(generator.schema, labels).config.operandProfile).toBe(operandProfile);
            const stub = generateWithLabels(generator, labels)!;
            expect(stub.labels).toContain(profile);
            expect(String(Math.max(stub.data.numObjects, stub.data.stepSize))).toHaveLength(digits);
            expect(stub.data.numObjects).toBeGreaterThanOrEqual(stub.data.stepSize);
        }
    });

    it('does not select or emit an operand profile when none is requested', () => {
        const generator = new CountingTenOffsetGenerator();
        const labels = [Scope.NumbersSmaller20, Area.Increment];
        expect(extractConfig(generator.schema, labels).config.operandProfile).toBe('unrestricted');
        const stub = generateWithLabels(generator, labels)!;
        expect(stub.data.numObjects).toBeLessThan(10);
        expect(stub.labels).not.toContain(Scope.TwoDigitLargestOperand);
        expect(stub.labels).not.toContain(Scope.ThreeDigitLargestOperand);
    });

    it.each([[Area.Increment, 'inc'], [Area.Decrement, 'dec']] as const)(
        'resolves %s without inventing a counting or sequence-position claim', (direction, incDecType) => {
            for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(new CountingTenOffsetGenerator(), [Scope.NumbersSmaller1000, direction])!;
                expect(stub.data.stepSize).toBe(10);
                expect(stub.data.incDecType).toBe(incDecType);
                expect(stub.data.incDecAnswer).toBe(stub.data.numObjects + (incDecType === 'inc' ? 10 : -10));
                expect(stub.labels.filter(label => label === Area.Increment || label === Area.Decrement)).toEqual([direction]);
                for (const label of countingLabels) expect(stub.labels).not.toContain(label);
            }
        }
    );

    it('keeps the same payload family and emits the chosen arithmetic direction when it is unspecified', () => {
        const seen = new Set<string>();
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(new CountingTenOffsetGenerator(), [Scope.NumbersSmaller1000])!;
            const {data} = stub;
            expect(data.stepSize).toBe(10);
            seen.add(data.incDecType);
            const expectedDirection = data.incDecType === 'inc' ? Area.Increment : Area.Decrement;
            expect(stub.labels.filter(label => label === Area.Increment || label === Area.Decrement)).toEqual([expectedDirection]);
            for (const label of countingLabels) expect(stub.labels).not.toContain(label);
        }
        expect([...seen].sort()).toEqual(['dec', 'inc']);
    });
});
