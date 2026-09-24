import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import type {ConfigSchema, ResolverFn} from '../types/schema.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from './model-catalog.ts';
import {normalizeSchemaChoices, resolveSchemaChoices, validateSchemaChoiceContracts} from './schema-choices.ts';
import {random, setSeed} from './random.ts';
import {resolveDistanceScale, resolveRangeFromLabels} from './ontology.ts';
import {resolveDeclaredOperation, resolvePropertyAwareOperation, resolveTwoStepOperations} from '../generators/arithmetic/helpers.ts';
import {resolveParityConstraint} from '../generators/counting/helpers.ts';
import {resolveComparisonRelation} from '../generators/comparison/helpers.ts';
import {MeasurementDataGeneratorSchema} from '../generators/statistics/measurement-data/spec.ts';
import {MeasurementLengthGeneratorSchema} from '../generators/measurement/measurement-length/spec.ts';
import {FractionArithmeticGeneratorSchema} from '../generators/fraction/fraction-arithmetic/spec.ts';
import {MultiDigitDivisionGeneratorSchema} from '../generators/arithmetic/multi-digit-division/spec.ts';

/** Keep only declarative metadata; any accidental value resolution fails the test. */
function withoutValueResolvers(schema: ConfigSchema): ConfigSchema {
    const forbidden = () => { throw new Error('Matching executed a value resolver.'); };
    return Object.fromEntries(Object.entries(schema).map(([field, value]) => {
        if (typeof value === 'function') {
            return [field, Object.assign(forbidden.bind(null), {ontologyNeutral: true as const})];
        }
        if (Array.isArray(value[0]) && typeof value[1] === 'function') {
            const resolver = value[1] as ResolverFn<unknown>;
            return [field, [value[0], Object.assign(forbidden.bind(null), {
                labelResolution: resolver.labelResolution,
                labelChoices: resolver.labelChoices
            }), ...value.slice(2)]];
        }
        return [field, value];
    })) as ConfigSchema;
}

function choices(schema: ConfigSchema, target: readonly string[]) {
    return normalizeSchemaChoices(schema, target, 'generator');
}

describe('catalog label choice contracts', () => {
    it('normalizes every catalog schema using metadata without executing value resolvers', async () => {
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(), loadViewModelCatalog()
        ]);
        expect(generators.length).toBeGreaterThan(0);
        expect(views.length).toBeGreaterThan(0);
        for (const module of [...generators, ...views]) {
            const schema = withoutValueResolvers(module.schema ?? {});
            expect(() => validateSchemaChoiceContracts(schema), module.module.id).not.toThrow();
            expect(() => choices(schema, []), module.module.id).not.toThrow();
        }
    }, 30_000);

    it('does not consume historical arithmetic resolver entropy during planning', () => {
        const schema = {operation: [[Area.Addition, Area.Subtraction], resolveDeclaredOperation]} as const;
        setSeed(123);
        const expected = random();
        setSeed(123);
        choices(schema, [Area.Addition]);
        expect(random()).toBe(expected);
        expect(resolveSchemaChoices(schema, [Area.Addition], {operation: [Area.Addition]}).config.operation)
            .toBe(Area.Addition);
    });

    it('preserves explicitly declared arithmetic conjunctions and contextual distributivity', () => {
        const schema = {operation: [[Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division, Area.Sum],
            resolvePropertyAwareOperation]} as const;
        const labels = [Area.Addition, Area.Multiplication, Area.DistributiveLaw];
        expect(choices(schema, labels)[0].alternatives).toHaveLength(1);
        expect(resolveSchemaChoices(schema, labels, {operation: [Area.Addition, Area.Multiplication]}).config.operation)
            .toBe(Area.Multiplication);
        const twoStep = {operations: [[Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division],
            resolveTwoStepOperations]} as const;
        expect(resolveSchemaChoices(twoStep, labels, {operations: [Area.Addition, Area.Multiplication]}).config.operations)
            .toEqual([Area.Multiplication, Area.Addition]);
    });

    it('keeps unspecified parity neutral and completes declared relation bundles', () => {
        const parity = {parity: [[Area.EvenDivisibility, Area.UnevenDivisibility, Scope.EvenNumbers, Scope.OddNumbers],
            resolveParityConstraint]} as const;
        expect(choices(parity, [])[0].alternatives.map(choice => choice.labels)).toEqual([[]]);
        expect(resolveSchemaChoices(parity, [], {parity: []}).config.parity).toBe('any');
        const relation = {relation: [[Area.NumericEquality, Area.NumericInequality, Scope.Equal, Scope.Less, Scope.Greater],
            resolveComparisonRelation]} as const;
        expect(choices(relation, [Area.NumericEquality])[0].alternatives.map(choice => choice.labels))
            .toEqual([[Area.NumericEquality, Scope.Equal].sort()]);
        expect(choices(relation, [Area.NumericEquality, Scope.Greater])[0].alternatives).toEqual([]);
    });

    it('retains range context outside the local supported labels and resolves scale families', () => {
        const range = {range: [[Scope.NumbersSmaller100], resolveRangeFromLabels]} as const;
        expect(resolveSchemaChoices(range, [Scope.NumbersSmaller10], {range: []}).config.range)
            .toEqual({min: 0, max: 10});
        const scale = {scale: [[Scope.CentimeterScale, Scope.InchScale], resolveDistanceScale]} as const;
        expect(resolveSchemaChoices(scale, [Scope.InchScale], {scale: [Scope.InchScale]}).config.scale)
            .toEqual({label: Scope.InchScale, family: 'imperial'});
    });

    it('preserves original-request unit defaults, independently of deferred number selection', () => {
        const schema = {unitScale: MeasurementDataGeneratorSchema.unitScale};
        expect(choices(schema, [])[0].alternatives.map(choice => choice.labels)).toEqual([[Scope.CentimeterScale]]);
        expect(choices(schema, [Scope.FractionNumbers])[0].alternatives.map(choice => choice.labels))
            .toEqual([[Scope.InchScale]]);
        expect(choices(schema, [Scope.FractionNumbers, Scope.CentimeterScale])[0].alternatives.map(choice => choice.labels))
            .toEqual([[Scope.CentimeterScale]]);
    });

    it('declares fraction task conjunctions beyond the fallback and retains operation context', () => {
        const schema = {task: FractionArithmeticGeneratorSchema.task};
        const labels = [Scope.TenthFractions, Area.Addition, Area.Multiplication];
        expect(choices(schema, labels)[0].alternatives.map(choice => choice.labels)).toEqual([[Scope.TenthFractions]]);
        expect(resolveSchemaChoices(schema, labels, {task: [Scope.TenthFractions]}).config.task)
            .toBe('tenths-hundredths-addition');
        const mixed = [Scope.ImproperFractions, Scope.MixedNumbers];
        expect(resolveSchemaChoices(schema, mixed, {task: mixed}).config.task).toBe('decompose-mixed');
    });

    it('includes custom singleton and tool choices without resolver probing', () => {
        const divisor = {divisorDigits: MultiDigitDivisionGeneratorSchema.divisorDigits};
        expect(choices(divisor, [])[0].alternatives.map(choice => choice.labels)).toEqual([[Scope.SingleDigitDivisor]]);
        expect(resolveSchemaChoices(divisor, [], {divisorDigits: [Scope.SingleDigitDivisor]}).config.divisorDigits).toBe(1);
        const tool = {tool: MeasurementLengthGeneratorSchema.tool};
        expect(resolveSchemaChoices(tool, [Scope.PhysicalRuler], {tool: [Scope.PhysicalRuler]}).config.tool)
            .toBe(Scope.PhysicalRuler);
        expect(MeasurementLengthGeneratorSchema.tool[1].labelChoices?.contextLabels)
            .toEqual([Scope.CentimeterScale, Scope.MeterScale]);
    });
});
