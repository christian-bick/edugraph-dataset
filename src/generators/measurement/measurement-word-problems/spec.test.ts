import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementWordProblemsGenerator} from './generator.ts';
import {MeasurementWordProblemsGeneratorSchema, spec} from './spec.ts';

const measurementCases = [
    [[Scope.MeterScale], [Scope.MeterScale], 'length'],
    [[Scope.HourIntervals], [Scope.HourIntervals], 'time'],
    [[Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale], [Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale], 'liquid-volume'],
    [[Scope.KilogramScale], [Scope.KilogramScale], 'weight'],
    [[Scope.Dollar], [Scope.Dollar], 'money']
] as const;

const numberCases = [
    [Scope.IntegerNumbers, 'integer'],
    [Scope.FractionNumbers, 'fraction'],
    [Scope.DecimalNumbers, 'decimal']
] as const;

const operationCases = [
    [Area.Addition, 'addition'],
    [Area.Subtraction, 'subtraction'],
    [Area.Multiplication, 'multiplication'],
    [Area.Division, 'division']
] as const;

const numberSchema = {numberKind: MeasurementWordProblemsGeneratorSchema.numberKind};
const fractionLabels = [Scope.FractionNumbers, Scope.ProperFractions];

describe('MeasurementWordProblemsGenerator spec integration', () => {
    const generator = new MeasurementWordProblemsGenerator();

    it('declares one-step, two-operand, and positive-quantity invariants generally', () => {
        expect(spec.generalLabels).toEqual([
            Scope.SingleStep,
            Scope.TwoOperands,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]);
    });

    it('resolves all 60 corrected Grade 4 label permutations', () => {
        for (const [measurementLabels, resolvedMeasurementLabels, measurementKind] of measurementCases) {
            for (const [numberLabel, numberKind] of numberCases) {
                for (const [operationLabel, operation] of operationCases) {
                    const labels = [
                        Scope.SingleStep,
                        Scope.TwoOperands,
                        Ability.TextualReception,
                        ...measurementLabels,
                        numberLabel,
                        operationLabel
                    ];
                    setSeed(`${measurementKind}-${numberKind}-${operation}`);
                    const stub = generateWithLabels(generator, labels);
                    expect(stub).not.toBeNull();
                    expect(stub!.data).toMatchObject({measurementKind, numberKind, operation});
                    expect(stub!.labels).toEqual(expect.arrayContaining([
                        ...resolvedMeasurementLabels,
                        numberLabel,
                        operationLabel
                    ]));
                    expect(stub!.labels).not.toContain(Area.MeasuringWithUnits);
                    expect(stub!.labels).not.toContain(Ability.TextualReception);
                    expect(stub!.labels.includes(Scope.ProperFractions)).toBe(numberKind === 'fraction');
                }
            }
        }
    });

    it('keeps exactly three number configurations with proper magnitude owned by the fraction choice', () => {
        expect(spec.generalLabels).not.toContain(Scope.ProperFractions);
        expect(findSchemaFallbackContractIssues(numberSchema)).toEqual([]);
        const [domain] = normalizeSchemaChoices(numberSchema, [], 'generator');
        expect(domain.alternatives).toHaveLength(3);
        const configurations = domain.alternatives.map(alternative => {
            const resolved = resolveSchemaChoices(numberSchema, [], {numberKind: alternative.labels});
            return {value: resolved.config.numberKind, labels: resolved.resolvedLabels};
        });
        expect(configurations).toEqual([
            {value: 'decimal', labels: [Scope.DecimalNumbers]},
            {value: 'fraction', labels: fractionLabels},
            {value: 'integer', labels: [Scope.IntegerNumbers]}
        ]);
        expect(MeasurementWordProblemsGeneratorSchema.numberKind[1]([])).toBeUndefined();
    });

    it.each([
        ['partial fraction request', [Scope.FractionNumbers]],
        ['explicit proper-fraction request', [Scope.ProperFractions]],
        ['complete fraction request', fractionLabels]
    ])('resolves a %s to the same fraction configuration and mathematical draw', (_, requestedLabels) => {
        const labels = requestedLabels as string[];
        const [domain] = normalizeSchemaChoices(numberSchema, labels, 'generator');
        expect(domain.alternatives).toHaveLength(1);
        expect(domain.alternatives[0].labels).toEqual(fractionLabels);
        expect(resolveSchemaChoices(numberSchema, labels, {numberKind: domain.alternatives[0].labels}))
            .toEqual({config: {numberKind: 'fraction'}, resolvedLabels: fractionLabels});
        expect(extractConfig(numberSchema, labels))
            .toEqual({config: {numberKind: 'fraction'}, resolvedLabels: fractionLabels});

        const fixedLabels = [Scope.MeterScale, Area.Multiplication];
        setSeed('proper-fraction-declaration');
        const original = generateWithLabels(generator, [...fixedLabels, Scope.FractionNumbers]);
        setSeed('proper-fraction-declaration');
        const explicit = generateWithLabels(generator, [...fixedLabels, ...labels]);
        expect(explicit!.data).toEqual(original!.data);
        expect(explicit!.data.numberKind).toBe('fraction');
        expect(explicit!.labels).toEqual(expect.arrayContaining(fractionLabels));
    });

    it.each([
        [Scope.FractionNumbers, Scope.IntegerNumbers],
        [Scope.ProperFractions, Scope.DecimalNumbers],
        [Scope.IntegerNumbers, Scope.DecimalNumbers]
    ])('rejects competing number-kind claims %s + %s', (...labels) => {
        const [domain] = normalizeSchemaChoices(numberSchema, labels, 'generator');
        expect(domain.alternatives).toEqual([]);
        expect(() => extractConfig(numberSchema, labels)).toThrow();
    });

    it('preserves unspecified number-kind fallback values and entropy consumption', () => {
        // Capture the preceding three-choice contract so this annotation change cannot bias fallback sampling.
        const precedingSchema = {numberKind: [
            [Scope.IntegerNumbers, Scope.FractionNumbers, Scope.DecimalNumbers],
            selectExactLabelMap([
                [Scope.IntegerNumbers, 'integer'],
                [Scope.FractionNumbers, 'fraction'],
                [Scope.DecimalNumbers, 'decimal']
            ])
        ]} as const;
        const seen = new Set<string>();
        for (let index = 0; index < 60; index++) {
            setSeed(`number-kind-fallback-${index}`);
            const preceding = extractConfig(precedingSchema, []);
            const precedingRandomState = getRandomState();
            setSeed(`number-kind-fallback-${index}`);
            const current = extractConfig(numberSchema, []);
            expect(current.config).toEqual(preceding.config);
            expect(getRandomState()).toEqual(precedingRandomState);
            expect(current.resolvedLabels).toEqual(preceding.config.numberKind === 'fraction'
                ? fractionLabels : preceding.resolvedLabels);
            seen.add(current.config.numberKind!);
        }
        expect([...seen].sort()).toEqual(['decimal', 'fraction', 'integer']);
    });

    it('resolves Dollar as a unit-measurement Scope', () => {
        setSeed('money-only');
        const stub = generateWithLabels(generator, [
            Scope.SingleStep,
            Scope.TwoOperands,
            Scope.Dollar,
            Scope.FractionNumbers,
            Area.Division,
            Ability.TextualReception
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.measurementKind).toBe('money');
        expect(stub!.labels).toContain(Scope.Dollar);
        expect(stub!.labels).not.toContain(Area.MeasuringWithUnits);
    });
});
