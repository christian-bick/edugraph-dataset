import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {ArithmeticOpsPairsGenerator} from './generator.ts';
import {type ArithmeticOpsPairsGeneratorConfig, ArithmeticOpsPairsGeneratorSchema, spec} from './spec.ts';

const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const;
const makeWidthPlan = (labels: string[]) => planModelCompatibility({id: 'width', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
        schema: ArithmeticOpsPairsGeneratorSchema, spec},
    {viewId: 'width-test', generalLabels: [], schema: {},
        spec: {viewId: 'width-test', generalLabels: []}});

describe('ArithmeticOpsPairsGenerator Spec Integration', () => {
    const generator = new ArithmeticOpsPairsGenerator();

    it('declares its invariant binary operand cardinality and single-step complexity', () => {
        expect(spec.generalLabels).toContain(Scope.TwoOperands);
        expect(spec.generalLabels).toContain(Scope.SingleStep);
    });

    it.each([Area.Addition, Area.Subtraction])('exposes both largest-width profiles to matching for ordinary %s within twenty', operation => {
        const labels = [operation, Scope.NumbersSmaller20,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero];
        const result = makeWidthPlan(labels);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        const width = result.plan.domains.find(domain => domain.field === 'largestOperandDigits');
        expect(width?.alternatives.map(alternative => alternative.labels)).toEqual([
            [Scope.SingleDigitLargestOperand], [Scope.TwoDigitLargestOperand]
        ]);
        for (const label of [Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand]) {
            expect(makeWidthPlan([...labels, label]).supported).toBe(true);
        }
        expect(makeWidthPlan([...labels, Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand]).supported)
            .toBe(false);
    });

    it('preserves every operation fallback when a broad request omits the operation', () => {
        const result = makeWidthPlan([Scope.NumbersSmaller20]);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        expect(result.plan.domains.find(domain => domain.field === 'operation')?.alternatives
            .flatMap(alternative => alternative.labels).sort()).toEqual([...operations].sort());
        const resolvedOperations = new Set<string>();
        for (let seed = 0; seed < 64; seed++) {
            const {generatorConfig} = resolvePlannedConfigurations({
                generatorSchema: ArithmeticOpsPairsGeneratorSchema, viewSchema: {}, plan: result.plan,
                sampleKey: 'width#arithmetic-ops-pairs#width-test#train#question#inst:0', seed, attempt: 1
            });
            const config = generatorConfig as ArithmeticOpsPairsGeneratorConfig;
            const operation = config.operation;
            if (operation === undefined) throw new Error('Expected a resolved operation.');
            resolvedOperations.add(operation);
            expect(config.largestOperandDigits === 0)
                .toBe(operation !== Area.Addition && operation !== Area.Subtraction);
        }
        expect(resolvedOperations).toEqual(new Set(operations));
    });

    it('keeps unspecified and wider bounds outside the width profiles', () => {
        for (const bounds of [[], [Scope.NumbersSmaller100]]) {
            const result = makeWidthPlan([Area.Addition, ...bounds]);
            expect(result.supported).toBe(true);
            if (!result.supported) continue;
            expect(result.plan.domains.find(domain => domain.field === 'largestOperandDigits')?.alternatives
                .map(alternative => alternative.labels)).toEqual([[]]);
            expect(extractConfig(ArithmeticOpsPairsGeneratorSchema, [Area.Addition, ...bounds])
                .config.largestOperandDigits).toBe(0);
        }
    });

    it.each([Area.Addition, Area.Subtraction])('selects and emits a largest-width profile through direct %s resolution too', operation => {
        const widths = new Set<number>();
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const labels = [operation, Scope.NumbersSmaller20,
                Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero];
            const resolved = extractConfig(ArithmeticOpsPairsGeneratorSchema, labels);
            widths.add(resolved.config.largestOperandDigits!);
            const expectedLabel = resolved.config.largestOperandDigits === 1
                ? Scope.SingleDigitLargestOperand : Scope.TwoDigitLargestOperand;
            expect(resolved.resolvedLabels).toContain(expectedLabel);
            const stub = generator.generate(resolved.config);
            expect(stub).not.toBeNull();
            expect(Math.max(stub!.data.num1, stub!.data.num2) < 10)
                .toBe(resolved.config.largestOperandDigits === 1);
        }
        expect(widths).toEqual(new Set([1, 2]));
    });

    it('keeps the legacy within-five default and explicit largest-width request', () => {
        const labels = [Area.Subtraction, Scope.NumbersSmaller5];
        const choices = normalizeSchemaChoices(ArithmeticOpsPairsGeneratorSchema, labels, 'generator');
        expect(choices.find(domain => domain.field === 'largestOperandDigits')?.alternatives
            .map(alternative => alternative.labels)).toEqual([[Scope.SingleDigitLargestOperand]]);
        expect(choices.find(domain => domain.field === 'requireMultipleOf10')?.alternatives
            .map(alternative => alternative.labels)).toEqual([[]]);
        expect(extractConfig(ArithmeticOpsPairsGeneratorSchema, labels).config.largestOperandDigits).toBe(0);
        const explicit = extractConfig(ArithmeticOpsPairsGeneratorSchema,
            [...labels, Scope.SingleDigitLargestOperand]);
        expect(explicit.config.largestOperandDigits).toBe(1);
        expect(explicit.resolvedLabels).toContain(Scope.SingleDigitLargestOperand);
    });

    it('preserves the legacy default priority when within-five targets also name a broader bound', () => {
        const labels = [Area.Addition, Scope.NumbersSmaller5, Scope.NumbersSmaller10];
        const choices = normalizeSchemaChoices(ArithmeticOpsPairsGeneratorSchema, labels, 'generator');
        expect(choices.find(domain => domain.field === 'requireMultipleOf10')?.alternatives
            .map(alternative => alternative.labels)).toEqual([[]]);
        expect(choices.find(domain => domain.field === 'largestOperandDigits')?.alternatives
            .map(alternative => alternative.labels)).toEqual([[Scope.SingleDigitLargestOperand]]);
        const explicitSmallest = normalizeSchemaChoices(ArithmeticOpsPairsGeneratorSchema,
            [...labels, Scope.SingleDigitSmallestOperand], 'generator');
        expect(explicitSmallest.find(domain => domain.field === 'largestOperandDigits')?.alternatives
            .map(alternative => alternative.labels)).toEqual([[]]);
    });

    it.each(operations)('keeps an absent zero claim unannotated without changing %s samples', operation => {
        const labels = [operation, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller20];
        const zeroDomain = normalizeSchemaChoices(ArithmeticOpsPairsGeneratorSchema, labels, 'generator')
            .find(domain => domain.field === 'requireZero');
        expect(zeroDomain?.alternatives.map(alternative => alternative.labels)).toEqual([[]]);

        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const before = extractConfig(ArithmeticOpsPairsGeneratorSchema, [...labels, Scope.NumbersWithoutZero]);
            const original = generator.generate(before.config);
            setSeed(seed);
            const after = extractConfig(ArithmeticOpsPairsGeneratorSchema, labels);
            const updated = generator.generate(after.config);

            expect(after.config.requireZero).toBe(false);
            expect(after.config).toEqual(before.config);
            expect(before.resolvedLabels).toContain(Scope.NumbersWithoutZero);
            expect(after.resolvedLabels).not.toContain(Scope.NumbersWithoutZero);
            expect(after.resolvedLabels).not.toContain(Scope.NumbersWithZero);
            expect(updated).not.toBeNull();
            expect(updated?.data).toEqual(original?.data);
            expect([updated!.data.num1, updated!.data.num2, updated!.data.answer]).not.toContain(0);
        }
    });

    it.each(operations)('preserves the explicitly requested zero branch for %s', operation => {
        const labels = [operation, Scope.NumbersWithZero, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller20];
        const zeroDomain = normalizeSchemaChoices(ArithmeticOpsPairsGeneratorSchema, labels, 'generator')
            .find(domain => domain.field === 'requireZero');
        expect(zeroDomain?.alternatives.map(alternative => alternative.labels)).toEqual([[Scope.NumbersWithZero]]);

        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, labels);
            expect(stub).not.toBeNull();
            expect(stub!.labels).toContain(Scope.NumbersWithZero);
            expect(stub!.labels).not.toContain(Scope.NumbersWithoutZero);
            expect([stub!.data.num1, stub!.data.num2, stub!.data.answer]).toContain(0);
        }
    });

    it('resolves nonzero and nonnegative labels into universally valid samples', () => {
        for (const operation of operations) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [
                    operation,
                    Scope.NumbersWithoutNegatives,
                    Scope.NumbersWithoutZero,
                    Scope.NumbersSmaller10
                ]);
                expect(stub).not.toBeNull();
                const values = [stub!.data.num1, stub!.data.num2, stub!.data.answer];
                expect(values.includes(0)).toBe(false);
                expect(values.some(value => value < 0)).toBe(false);
                expect(stub!.labels).toEqual(expect.arrayContaining([
                    operation,
                    Scope.NumbersWithoutNegatives,
                    Scope.NumbersWithoutZero
                ]));
            }
        }
    });

    it('resolves zero and negative labels into witnesses for every operation', () => {
        for (const operation of operations) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [
                    operation,
                    Scope.NumbersWithNegatives,
                    Scope.NumbersWithZero,
                    Scope.NumbersSmaller10
                ]);
                expect(stub).not.toBeNull();
                const values = [stub!.data.num1, stub!.data.num2, stub!.data.answer];
                expect(values).toContain(0);
                expect(values.some(value => value < 0)).toBe(true);
            }
        }
    });

    it('resolves multiples of ten into operation-appropriate witnesses', () => {
        for (const operation of operations) {
            const stub = generateWithLabels(generator, [
                operation,
                Scope.MultiplesOf10,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller1000
            ]);
            expect(stub).not.toBeNull();
            if (operation === Area.Multiplication) {
                const factors = [stub!.data.num1, stub!.data.num2];
                expect(factors.filter(value => value >= 1 && value <= 9)).toHaveLength(1);
                expect(factors.filter(value => value >= 10 && value <= 90 && value % 10 === 0)).toHaveLength(1);
                expect(stub!.data.answer % 10).toBe(0);
            } else {
                expect([stub!.data.num1, stub!.data.num2, stub!.data.answer]
                    .every(value => value % 10 === 0)).toBe(true);
            }
            expect(stub!.labels).toContain(Scope.MultiplesOf10);
        }
    });

    it('leaves ProcedureInversion unconsumed for the matching view', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Ability.ProcedureInversion,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.NumbersSmaller10
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data).not.toHaveProperty('blankPart');
        expect(stub!.labels).not.toContain(Ability.ProcedureInversion);
        expect(extractSchemaLabels(ArithmeticOpsPairsGeneratorSchema))
            .not.toContain(Ability.ProcedureInversion);
    });

    it('resolves iterated addition into equal addend values and an even result', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.Addition,
                Area.IteratedOperation,
                Scope.EvenNumbers,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBe(stub!.data.num2);
            expect(stub!.data.answer % 2).toBe(0);
            expect(stub!.data.answer).toBeLessThanOrEqual(20);
            expect(stub!.labels).not.toContain(Scope.NumbersWithoutZero);
            expect([stub!.data.num1, stub!.data.num2, stub!.data.answer]).not.toContain(0);
        }
    });

    it('does not infer an arithmetic operation from Difference alone', () => {
        const stub = generateWithLabels(generator, [
            Area.Difference,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller20
        ]);
        expect(stub).toBeNull();
    });
});
