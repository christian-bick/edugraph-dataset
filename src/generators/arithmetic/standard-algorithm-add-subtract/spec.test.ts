import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {capabilitySatisfies} from '../../../lib/ontology.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {StandardAlgorithmAddSubtractGenerator} from './generator.ts';
import {spec, StandardAlgorithmAddSubtractGeneratorSchema as schema} from './spec.ts';
import {isZeroFreeStandardAlgorithm} from './zero-arithmetic.ts';

const invariantLabels = [
    Scope.TwoOperands,
    Scope.IntegerNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersWithoutZero
];

describe('StandardAlgorithmAddSubtractGenerator spec integration', () => {
    const generator = new StandardAlgorithmAddSubtractGenerator();

    it('retains exactly the four supported upper corpora, with no capability claiming a positive global floor', () => {
        expect(schema.range[0]).toEqual([Scope.NumbersSmaller1000, Scope.NumbersSmaller10000,
            Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000]);
        expect(schema.range[0].some(label => capabilitySatisfies(label, Scope.NumbersLarger5))).toBe(false);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        for (const operation of [Area.AdditionStandardAlgorithm, Area.SubtractionStandardAlgorithm]) {
            for (const upper of schema.range[0]) {
                const target = [operation, upper];
                const direct = extractConfig(schema, target);
                const bindings = Object.fromEntries(normalizeSchemaChoices(schema, target, 'generator')
                    .map(field => [field.field, field.alternatives[0]!.labels]));
                const planned = resolveSchemaChoices(schema, target, bindings);
                expect(planned.config).toEqual(direct.config);
                expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
                expect(direct.config.range?.min).toBe(0);
            }
        }
    });

    it('declares only invariant mathematical capabilities as general labels', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining(invariantLabels));
        expect(spec.generalLabels).not.toContain(Area.AdditionStandardAlgorithm);
        expect(spec.generalLabels).not.toContain(Area.SubtractionStandardAlgorithm);
    });

    it.each([
        [Area.AdditionStandardAlgorithm, 'addition'],
        [Area.SubtractionStandardAlgorithm, 'subtraction']
    ] as const)('resolves %s and the authored Grade 4 range', (operationLabel, operation) => {
        setSeed(operation);
        const stub = generateWithLabels(generator, [
            operationLabel,
            ...invariantLabels,
            Scope.ArabicNumerals,
            Scope.NumbersSmaller1000000
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.data.topValue).toBeGreaterThanOrEqual(1000);
        expect(stub!.data.topValue).toBeLessThanOrEqual(999999);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            operationLabel,
            Scope.NumbersSmaller1000000
        ]));
        expect([...spec.generalLabels, ...stub!.labels]).toContain(Scope.NumbersWithoutZero);
        expect(isZeroFreeStandardAlgorithm(stub!.data)).toBe(true);
    });

    it.each([
        [Area.AdditionStandardAlgorithm, 'addition'],
        [Area.SubtractionStandardAlgorithm, 'subtraction']
    ] as const)('resolves %s for the Grade 3 three-digit range', (operationLabel, operation) => {
        setSeed(`grade-3-${operation}`);
        const stub = generateWithLabels(generator, [
            operationLabel,
            ...invariantLabels,
            Scope.ArabicNumerals,
            Scope.NumbersSmaller1000
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.data.columns).toHaveLength(3);
        expect(stub!.data.topValue).toBeGreaterThanOrEqual(100);
        expect(stub!.data.topValue).toBeLessThan(1000);
        expect([...spec.generalLabels, ...stub!.labels]).toContain(Scope.NumbersWithoutZero);
        expect(isZeroFreeStandardAlgorithm(stub!.data)).toBe(true);
    });
});
