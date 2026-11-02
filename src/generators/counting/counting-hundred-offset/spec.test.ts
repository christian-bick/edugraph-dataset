import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {extractConfig, extractSchemaLabels, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {CountingHundredOffsetGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('counting-hundred-offset declarations', () => {
    const generator = new CountingHundredOffsetGenerator();
    const countingLabels = [Scope.Before, Scope.After, Scope.AdditiveCount, Scope.SubtractiveCount];
    it('retains the fixed step and arithmetic direction without sequence/counting claims', () => {
        const labels = [...spec.generalLabels, ...extractSchemaLabels(generator.schema)];
        expect(spec.generalLabels).toContain(Scope.StepsOf100);
        expect(labels).toEqual(expect.arrayContaining([Area.Increment, Area.Decrement]));
        for (const label of countingLabels) expect(labels).not.toContain(label);
        expect(generator.schema).not.toHaveProperty('stepMagnitude');
        expect(spec).not.toHaveProperty('inferredLabels');
    });
    it('makes zero involvement requestable and rejects false global floors', () => {
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithoutZero);
        expect(extractSchemaLabels(generator.schema)).toEqual(expect.arrayContaining([Scope.NumbersWithZero, Scope.NumbersWithoutZero]));
        expect(extractSchemaLabels(generator.schema)).not.toContain(Scope.NumbersLargerZero);
        expect(extractSchemaLabels(generator.schema)).not.toContain(Scope.NumbersLarger10);
        expect(extractSchemaLabels(generator.schema)).not.toContain(Scope.NumbersLarger100);
        expect(findSchemaFallbackContractIssues(generator.schema)).toEqual([]);
    });
    it('keeps optional widths separate from canonical whole-task ranges', () => {
        for (const [profile, operandProfile, upper] of [[Scope.ThreeDigitLargestOperand, 'three-digit', Scope.NumbersSmaller1000]] as const) {
            for (const direction of [Area.Increment, Area.Decrement]) {
                const labels = [upper, direction, profile, Scope.NumbersWithoutZero];
                setSeed(1234); const before = getRandomState();
                const config = extractConfig(generator.schema, labels).config;
                expect(config.operandProfile).toBe(operandProfile);
                expect(config.requireZero).toBe(false);
                expect(getRandomState()).toBe(before);
                const stub = generateWithLabels(generator, labels)!;
                expect(stub.labels).toEqual(expect.arrayContaining(labels));
                expect(String(stub.data.numObjects)).toHaveLength(3);
            }
        }
        expect(extractSchemaLabels(generator.schema)).not.toContain(Scope.TwoDigitLargestOperand);
    });
    it('preserves unprofiled small-primary mathematics with truthful visible-zero labels', () => {
        const labels = [Scope.NumbersSmaller120, Area.Increment, Scope.NumbersWithZero];
        const config = extractConfig(generator.schema, labels).config;
        expect(config.operandProfile).toBe('unrestricted');
        const stub = generateWithLabels(generator, labels)!;
        expect(stub.data.numObjects).toBeLessThan(100);
        expect([...Object.values(stub.data.startPlaceValue), ...Object.values(stub.data.resultPlaceValue)]).toContain(0);
        expect(stub.labels).not.toContain(Scope.TwoDigitLargestOperand);
        expect(stub.labels).not.toContain(Scope.ThreeDigitLargestOperand);
    });
    it('resolves an unspecified direction only among feasible arithmetic choices', () => {
        const seen = new Set<string>();
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [Scope.NumbersSmaller1000, Scope.ThreeDigitLargestOperand, Scope.NumbersWithoutZero])!;
            seen.add(stub.data.incDecType);
            expect(stub.data.stepSize).toBe(100);
            expect(stub.labels.filter(label => label === Area.Increment || label === Area.Decrement))
                .toEqual([stub.data.incDecType === 'inc' ? Area.Increment : Area.Decrement]);
            for (const label of countingLabels) expect(stub.labels).not.toContain(label);
        }
        expect([...seen].sort()).toEqual(['dec', 'inc']);
    });
});
