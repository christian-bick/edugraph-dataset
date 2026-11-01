import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed, withoutRandomness} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {MeasurementWordProblemsGenerator} from './generator.ts';
import {measurementIntegerDomain, measurementIntegerTuples} from './integer-domain.ts';
import {measurementWordProblemOperandDigitChoices, resolveMeasurementWordProblemOperandDigits} from './operation-labels.ts';
import {measurementRangeChoices, permitsMeasurementRange, resolveMeasurementOperandDigits, resolveMeasurementRange} from './range-profile.ts';
import {MeasurementWordProblemsGeneratorSchema as schema, spec} from './spec.ts';

const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division];
const supportedProfiles = canonicalRangeProfiles.filter(({range}) => range.max <= 100);
const passes = (selected: readonly string[]) => spec.compatibility!.every(rule => rule.predicate({
    has: (_, label) => selected.includes(label), exact: (_, label) => selected.includes(label)
}));
const numberChoices = [[Scope.IntegerNumbers], [Scope.FractionNumbers, Scope.ProperFractions], [Scope.DecimalNumbers]];
const generator = new MeasurementWordProblemsGenerator();

describe('measurement canonical range profiles', () => {
    it('keeps every stronger lower choice available without substituting the target upper band', () => {
        expect(findSchemaFallbackContractIssues({range: schema.range})).toEqual([]);
        const [domain] = normalizeSchemaChoices({range: schema.range}, [Scope.IntegerNumbers, Scope.NumbersSmaller100], 'generator');
        expect(domain.alternatives.map(choice => choice.labels)).toEqual(expect.arrayContaining([
            [Scope.NumbersSmaller100],
            [Scope.NumbersLarger5, Scope.NumbersSmaller100].sort(),
            [Scope.NumbersLarger10, Scope.NumbersSmaller100].sort(),
            [Scope.NumbersLarger20, Scope.NumbersSmaller100].sort()
        ]));
        expect(domain.alternatives).toHaveLength(4);
        expect(measurementRangeChoices.flat()).not.toContain(Scope.NumbersLargerZero);
    });

    it('defaults fixed-bound noninteger tasks to upper5 and leaves decimal addition for its own profile checkpoint', () => {
        for (const numberLabel of [Scope.FractionNumbers, Scope.DecimalNumbers]) for (const operation of operations) {
            const labels = [numberLabel, operation];
            const [domain] = normalizeSchemaChoices({range: schema.range}, labels, 'generator');
            const unprofiled = numberLabel === Scope.DecimalNumbers && operation === Area.Addition;
            expect(domain.alternatives.map(choice => choice.labels)).toEqual(unprofiled ? [[]] : [[Scope.NumbersSmaller5]]);
            expect(resolveMeasurementRange([...labels, ...(unprofiled ? [] : [Scope.NumbersSmaller5])]))
                .toEqual(unprofiled ? false : createCanonicalNumericRange(5));
            expect(resolveMeasurementRange([...labels, Scope.NumbersSmaller10])).toBeUndefined();
        }
        expect(resolveMeasurementRange([Scope.IntegerNumbers])).toBeUndefined();
        expect(resolveMeasurementRange([])).toBe(false);
    });

    it('resolves every statically admitted joint profile before generation without consuming randomness', () => {
        for (const operation of operations) for (const numberKind of numberChoices) {
            let admitted = 0;
            for (const operandDigits of measurementWordProblemOperandDigitChoices) for (const range of measurementRangeChoices) {
                const labels = [operation, ...numberKind, ...operandDigits, ...range];
                const allowed = withoutRandomness(() => passes(labels));
                if (!allowed) continue;
                admitted++;
                setSeed(labels.join('|'));
                const resolved = resolveSchemaChoices(schema, labels, {
                    measurementKind: [Scope.MeterScale], operation: [operation], numberKind, operandDigits, range
                });
                const stub = generator.generate(resolved.config);
                if (resolved.config.range) {
                    const values = [...stub.data.operands.map(operand => operand.role === 'group-count'
                        ? operand.count : operand.value.numerator / operand.value.denominator),
                    stub.data.answer.numerator / stub.data.answer.denominator];
                    expect(hasCanonicalRangeWitness(values, resolved.config.range)).toBe(true);
                } else {
                    expect(stub.data.numberKind).toBe('decimal');
                    expect(stub.data.operation).toBe('addition');
                    expect(resolved.resolvedLabels.some(label => measurementRangeChoices.flat().includes(label))).toBe(false);
                }
            }
            expect(admitted).toBeGreaterThan(0);
            if (!numberKind.includes(Scope.IntegerNumbers)) expect(admitted).toBe(1);
        }
    });

    it.each([
        [Area.Addition, Scope.SingleDigitLargestOperand, Scope.NumbersSmaller100],
        [Area.Addition, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller10],
        [Area.Subtraction, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller5],
        [Area.Multiplication, Scope.SingleDigitSmallestOperand, Scope.NumbersSmaller20, Scope.NumbersLarger5],
        [Area.Division, Scope.SingleDigitDivisor, Scope.NumbersSmaller100, Scope.NumbersLarger10]
    ])('rejects impossible joint labels before sampling: %s', (...labels) => {
        expect(withoutRandomness(() => passes([Scope.IntegerNumbers, ...labels]))).toBe(false);
        expect(() => extractConfig(schema, [Scope.MeterScale, Scope.IntegerNumbers, ...labels])).toThrow();
    });

    it('resolves every operation and upper band through the direct path with a truthful width', () => {
        for (const operation of operations) for (const upper of [
            Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100
        ]) {
            setSeed(`${operation}-${upper}`);
            const resolved = extractConfig(schema, [Scope.MeterScale, Scope.IntegerNumbers, operation, upper]);
            expect(passes(resolved.resolvedLabels)).toBe(true);
            const stub = generator.generate(resolved.config);
            expect(stub.data.numberKind).toBe('integer');
            expect(resolved.resolvedLabels).toContain(upper);
        }
    });

    it('completes an omitted number kind with integer support when a canonical bound is requested', () => {
        for (const operation of operations) for (const upper of [
            Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100
        ]) for (const seed of [0, 77]) {
            setSeed(seed);
            const resolved = extractConfig(schema, [Scope.KilogramScale, operation, upper]);
            expect(resolved.config.numberKind).toBe('integer');
            expect(passes(resolved.resolvedLabels)).toBe(true);
            expect(generator.generate(resolved.config).data.numberKind).toBe('integer');
        }
    });

    it('completes noninteger multiplication with the single-digit largest operand only', () => {
        for (const number of [Scope.FractionNumbers, Scope.DecimalNumbers]) for (const seed of [0, 77]) {
            setSeed(seed);
            const resolved = extractConfig(schema, [Scope.MeterScale, number, Area.Multiplication]);
            expect(resolved.config.operandDigits).toEqual({role: 'largest', digits: 1});
            expect(resolved.config.range).toEqual(createCanonicalNumericRange(5));
            expect(passes(resolved.resolvedLabels)).toBe(true);
            expect(generator.generate(resolved.config).data.numberKind).not.toBe('integer');
        }
    });

    it('includes group counts and hidden answers in both bound witnesses', () => {
        // The answer, rather than either operand, establishes the upper addition band.
        expect(measurementIntegerTuples('addition', createCanonicalNumericRange(20, 5), 1))
            .toContainEqual([9, 9, 18]);
        // The answer prevents a lower-10 claim despite the two-digit operands.
        expect(measurementIntegerTuples('subtraction', createCanonicalNumericRange(20)))
            .toContainEqual([11, 10, 1]);
        expect(measurementIntegerTuples('subtraction', createCanonicalNumericRange(20, 10)))
            .not.toContainEqual([11, 10, 1]);
        expect(measurementIntegerTuples('division', createCanonicalNumericRange(100, 5)))
            .toContainEqual([60, 5, 12]);
        expect(measurementIntegerTuples('division', createCanonicalNumericRange(100, 10))).toEqual([]);
        expect(Object.values(measurementIntegerDomain).map(rows => rows.length)).toEqual([361, 135, 55, 60]);
        expect(supportedProfiles.some(({range}) => permitsMeasurementRange([Area.Addition], range))).toBe(true);
        expect(resolveMeasurementOperandDigits([Area.Addition])).toBe(false);
    });

    it('adds only the fixed range annotation without changing other resolved fields or entropy in either path', () => {
        const {range: _range, ...withoutRange} = schema;
        const precedingSchema = {...withoutRange, operandDigits: [schema.operandDigits[0],
            resolveMeasurementWordProblemOperandDigits, measurementWordProblemOperandDigitChoices] as const};
        const measurementChoices = schema.measurementKind[2];
        for (const measurementKind of measurementChoices) for (const numberKind of numberChoices.slice(1)) {
            for (const operation of operations) {
                const operandDigits = operation === Area.Multiplication ? [Scope.SingleDigitLargestOperand]
                    : operation === Area.Division ? [Scope.SingleDigitDivisor] : [];
                const labels = [...measurementKind, ...numberKind, operation, ...operandDigits];
                const rangeLabels = numberKind.includes(Scope.DecimalNumbers) && operation === Area.Addition
                    ? [] : [Scope.NumbersSmaller5];
                const range = rangeLabels.length ? createCanonicalNumericRange(5) : false;
                for (const planned of [false, true]) {
                    const binding = {measurementKind, numberKind, operation: [operation], operandDigits};
                    setSeed(`noninteger-${planned}-${labels.join('|')}`);
                    const preceding = planned ? resolveSchemaChoices(precedingSchema, labels, binding)
                        : extractConfig(precedingSchema, labels);
                    const precedingState = getRandomState();
                    const expected = generator.generate({...preceding.config, range});
                    const expectedContinuation = getRandomState();
                    setSeed(`noninteger-${planned}-${labels.join('|')}`);
                    const current = planned ? resolveSchemaChoices(schema, labels, {...binding, range: rangeLabels})
                        : extractConfig(schema, labels);
                    expect(current.config).toEqual({...preceding.config, range});
                    expect([...current.resolvedLabels].sort()).toEqual([...preceding.resolvedLabels, ...rangeLabels].sort());
                    expect(getRandomState()).toBe(precedingState);
                    expect(generator.generate(current.config)).toEqual(expected);
                    expect(getRandomState()).toBe(expectedContinuation);
                }
            }
        }
    });
});
