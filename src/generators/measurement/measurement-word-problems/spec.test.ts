import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementWordProblemsGenerator} from './generator.ts';
import {MeasurementWordProblemsGeneratorConfig, MeasurementWordProblemsGeneratorSchema, spec} from './spec.ts';

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
const operationSchema = {operation: MeasurementWordProblemsGeneratorSchema.operation};
const operandDigitSchema = {operandDigits: MeasurementWordProblemsGeneratorSchema.operandDigits};
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

    it('resolves all measurement and number fields with complete supported operation bindings', () => {
        for (const [measurementLabels, resolvedMeasurementLabels, measurementKind] of measurementCases) {
            for (const [numberLabel, numberKind] of numberCases) {
                for (const [operationLabel, operation] of operationCases) {
                    const operandDigitBindings = numberKind === 'integer'
                        && (operationLabel === Area.Addition || operationLabel === Area.Subtraction)
                        ? [[Scope.SingleDigitLargestOperand], [Scope.TwoDigitLargestOperand]]
                        : operationLabel === Area.Multiplication
                            ? [[numberKind === 'integer'
                                ? Scope.SingleDigitSmallestOperand : Scope.SingleDigitLargestOperand]]
                            : operationLabel === Area.Division ? [[Scope.SingleDigitDivisor]] : [[]];
                    for (const operandDigitBinding of operandDigitBindings) {
                        const labels = [
                            Scope.SingleStep,
                            Scope.TwoOperands,
                            Ability.TextualReception,
                            ...measurementLabels,
                            numberLabel,
                            operationLabel
                        ];
                        setSeed(`${measurementKind}-${numberKind}-${operation}`);
                        const resolved = resolveSchemaChoices(MeasurementWordProblemsGeneratorSchema, labels, {
                            measurementKind: [...resolvedMeasurementLabels],
                            numberKind: numberKind === 'fraction' ? fractionLabels : [numberLabel],
                            operation: [operationLabel],
                            operandDigits: operandDigitBinding,
                            range: numberKind === 'integer' ? [operandDigitBinding.includes(Scope.TwoDigitLargestOperand)
                                ? Scope.NumbersSmaller20 : Scope.NumbersSmaller5]
                                : numberKind === 'decimal' && operation === 'addition' ? [] : [Scope.NumbersSmaller5]
                        });
                        const stub = generator.generate(resolved.config as MeasurementWordProblemsGeneratorConfig);
                        expect(stub.data).toMatchObject({measurementKind, numberKind, operation});
                        expect(resolved.resolvedLabels).toEqual(expect.arrayContaining([
                            ...resolvedMeasurementLabels,
                            numberLabel,
                            operationLabel
                        ]));
                        expect(resolved.resolvedLabels).not.toContain(Area.MeasuringWithUnits);
                        expect(resolved.resolvedLabels).not.toContain(Ability.TextualReception);
                        expect(resolved.resolvedLabels.includes(Scope.ProperFractions)).toBe(numberKind === 'fraction');
                        expect(resolved.resolvedLabels.includes(Scope.SingleDigitDivisor)).toBe(operation === 'division');
                    }
                }
            }
        }
    });

    it('declares operand-digit profiles independently of the four operations for joint planning', () => {
        for (const label of [Scope.SingleDigitDivisor, Scope.SingleDigitSmallestOperand,
            Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand]) {
            expect(spec.generalLabels).not.toContain(label);
        }
        expect(findSchemaFallbackContractIssues(operationSchema)).toEqual([]);
        expect(findSchemaFallbackContractIssues(operandDigitSchema)).toEqual([]);
        const [domain] = normalizeSchemaChoices(operationSchema, [], 'generator');
        expect(domain.alternatives).toHaveLength(4);
        const configurations = domain.alternatives.map(alternative =>
            resolveSchemaChoices(operationSchema, [], {operation: alternative.labels}));
        expect(configurations).toEqual([
            {config: {operation: Area.Addition}, resolvedLabels: [Area.Addition]},
            {config: {operation: Area.Division}, resolvedLabels: [Area.Division]},
            {config: {operation: Area.Multiplication}, resolvedLabels: [Area.Multiplication]},
            {config: {operation: Area.Subtraction}, resolvedLabels: [Area.Subtraction]}
        ]);
        const [digitDomain] = normalizeSchemaChoices(operandDigitSchema, [], 'generator');
        expect(digitDomain.alternatives).toHaveLength(5);
        expect(digitDomain.alternatives.map(alternative =>
            resolveSchemaChoices(operandDigitSchema, [], {operandDigits: alternative.labels})))
            .toEqual([
                {config: {operandDigits: {role: 'divisor', digits: 1}}, resolvedLabels: [Scope.SingleDigitDivisor]},
                {config: {operandDigits: {role: 'largest', digits: 1}}, resolvedLabels: [Scope.SingleDigitLargestOperand]},
                {config: {operandDigits: {role: 'smallest', digits: 1}}, resolvedLabels: [Scope.SingleDigitSmallestOperand]},
                {config: {operandDigits: {role: 'largest', digits: 2}}, resolvedLabels: [Scope.TwoDigitLargestOperand]},
                {config: {operandDigits: false}, resolvedLabels: []}
            ]);
    });

    it.each([
        [Scope.SingleDigitDivisor, {role: 'divisor', digits: 1}],
        [Scope.SingleDigitLargestOperand, {role: 'largest', digits: 1}],
        [Scope.TwoDigitLargestOperand, {role: 'largest', digits: 2}]
    ])('resolves an explicit %s descriptor to its profile', (label, profile) => {
        const requestedLabels = [label];
        const labels = requestedLabels as string[];
        const [domain] = normalizeSchemaChoices(operandDigitSchema, labels, 'generator');
        expect(domain.alternatives).toHaveLength(1);
        expect(resolveSchemaChoices(operandDigitSchema, labels, {operandDigits: domain.alternatives[0].labels}))
            .toEqual({config: {operandDigits: profile}, resolvedLabels: labels});
    });

    it('defaults unspecified number kind to integer and retains every explicit number choice', () => {
        expect(spec.generalLabels).not.toContain(Scope.ProperFractions);
        expect(findSchemaFallbackContractIssues(numberSchema)).toEqual([]);
        const [domain] = normalizeSchemaChoices(numberSchema, [], 'generator');
        expect(domain.alternatives.map(alternative => alternative.labels)).toEqual([[Scope.IntegerNumbers]]);
        const configurations = numberCases.map(([label]) => {
            const [explicit] = normalizeSchemaChoices(numberSchema, [label], 'generator');
            const resolved = resolveSchemaChoices(numberSchema, [label], {numberKind: explicit.alternatives[0].labels});
            return {value: resolved.config.numberKind, labels: resolved.resolvedLabels};
        });
        expect(configurations).toEqual([
            {value: 'integer', labels: [Scope.IntegerNumbers]},
            {value: 'fraction', labels: fractionLabels},
            {value: 'decimal', labels: [Scope.DecimalNumbers]}
        ]);
        expect(MeasurementWordProblemsGeneratorSchema.numberKind[1]([])).toBe('integer');
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
        const generateFraction = (requested: string[]) => {
            const resolved = resolveSchemaChoices(MeasurementWordProblemsGeneratorSchema, [...fixedLabels, ...requested], {
                measurementKind: [Scope.MeterScale], numberKind: fractionLabels,
                operation: [Area.Multiplication], operandDigits: [Scope.SingleDigitLargestOperand], range: [Scope.NumbersSmaller5]
            });
            return {data: generator.generate(resolved.config as MeasurementWordProblemsGeneratorConfig).data,
                labels: resolved.resolvedLabels};
        };
        setSeed('proper-fraction-declaration');
        const original = generateFraction([Scope.FractionNumbers]);
        setSeed('proper-fraction-declaration');
        const explicit = generateFraction(labels);
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

    it('keeps the implicit integer completion stable across direct and planned resolution', () => {
        for (let index = 0; index < 60; index++) {
            setSeed(`number-kind-fallback-${index}`);
            const direct = extractConfig(numberSchema, []);
            const continuation = getRandomState();
            setSeed(`number-kind-fallback-${index}`);
            const planned = resolveSchemaChoices(numberSchema, [], {numberKind: [Scope.IntegerNumbers]});
            expect(direct).toEqual(planned);
            expect(direct.config.numberKind).toBe('integer');
            expect(getRandomState()).toEqual(continuation);
        }
    });

    it('resolves Dollar as a unit-measurement Scope', () => {
        setSeed('money-only');
        const stub = generateWithLabels(generator, [
            Scope.SingleStep,
            Scope.TwoOperands,
            Scope.Dollar,
            Scope.FractionNumbers,
            Area.Division,
            Scope.SingleDigitDivisor,
            Ability.TextualReception
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.measurementKind).toBe('money');
        expect(stub!.labels).toContain(Scope.Dollar);
        expect(stub!.labels).not.toContain(Area.MeasuringWithUnits);
    });
});
