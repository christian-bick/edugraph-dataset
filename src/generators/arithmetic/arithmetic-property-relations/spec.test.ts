import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {sampleGenerationPlan} from '../../../lib/compatibility.ts';
import {planModelCompatibility, type ViewChoiceModel} from '../../../lib/model-compatibility.ts';
import {bindingsForSelection} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {isFeasibleArithmeticProperty} from '../arithmetic-property-domain.ts';
import {ArithmeticPropertyRelationsGenerator} from './generator.ts';
import {ArithmeticPropertyRelationsGeneratorSchema, spec} from './spec.ts';

const neutralView: ViewChoiceModel = {
    viewId: 'property-math-test', generalLabels: [], schema: {},
    spec: {viewId: 'property-math-test', generalLabels: []}
};
const generator = new ArithmeticPropertyRelationsGenerator();
const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
    schema: ArithmeticPropertyRelationsGeneratorSchema, spec};
const plan = (labels: readonly string[]) => planModelCompatibility({id: 'property-test', labels: [...labels]}, model, neutralView);
const profiles = [
    [[Area.Addition, Area.CommutativeLaw], 'commutative'],
    [[Area.Addition, Area.AssociativeLaw], 'associative'],
    [[Area.Multiplication, Area.CommutativeLaw], 'commutative'],
    [[Area.Multiplication, Area.AssociativeLaw], 'associative'],
    [[Area.Addition, Area.Multiplication, Area.DistributiveLaw], 'distributive']
] as const;

describe('arithmetic-property-relations specification', () => {
    it('declares property mathematics without ordinary triple operations or presentation configuration', () => {
        const labels = extractSchemaLabels(generator.schema);
        expect(labels).toEqual(expect.arrayContaining([Area.Addition, Area.Multiplication,
            Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw]));
        for (const label of [Area.Subtraction, Area.Division, Area.Sum]) expect(labels).not.toContain(label);
        expect(Object.keys(generator.schema).sort()).toEqual([
            'operation', 'range', 'requireMultipleOf10', 'requireZero',
            'useAssociativeLaw', 'useCommutativeLaw', 'useDistributiveLaw'
        ]);
        expect(spec.generalLabels).toContain(Scope.ThreeOperands);
    });

    it.each(profiles)('resolves the complete %j law witness', (labels, propertyLaw) => {
        setSeed(42);
        const stub = generateWithLabels(generator, [...labels, Scope.NumbersSmaller100]);
        expect(stub).not.toBeNull();
        expect(stub!.data.propertyLaw).toBe(propertyLaw);
        expect(stub!.labels).toEqual(expect.arrayContaining([...labels]));
        expect(plan([...labels, Scope.NumbersSmaller100]).supported).toBe(true);
    });

    it.each([
        [Area.Addition, Scope.NumbersSmaller100],
        [Area.Multiplication, Area.CommutativeLaw, Area.AssociativeLaw, Scope.NumbersSmaller100],
        [Area.Addition, Area.Multiplication, Area.CommutativeLaw, Scope.NumbersSmaller100],
        [Area.Multiplication, Area.DistributiveLaw, Scope.NumbersSmaller100],
        [Area.Addition, Area.DistributiveLaw, Scope.NumbersSmaller100],
        [Area.Addition, Area.AssociativeLaw, Scope.NumbersWithZero, Scope.NumbersWithoutZero, Scope.NumbersSmaller100],
        [Area.Addition, Area.Multiplication, Area.DistributiveLaw, Scope.NumbersWithZero, Scope.NumbersSmaller100],
        [Area.Addition, Area.Multiplication, Area.DistributiveLaw, Scope.MultiplesOf10, Scope.NumbersSmaller100]
    ].map(labels => ({labels})))('rejects a semantically infeasible label selection before generation: $labels', ({labels}) => {
        const result = plan(labels);
        expect(result).toMatchObject({supported: false, reason: 'incompatible-rules'});
    });

    it.each([
        [Area.Addition, Area.AssociativeLaw, Scope.NumbersWithZero, Scope.NumbersLarger5, Scope.NumbersSmaller100],
        [Area.Addition, Area.AssociativeLaw, Scope.MultiplesOf10, Scope.NumbersSmaller20],
        [Area.Multiplication, Area.AssociativeLaw, Scope.NumbersLarger5, Scope.NumbersSmaller100],
        [Area.Addition, Area.Multiplication, Area.DistributiveLaw, Scope.NumbersLarger10, Scope.NumbersSmaller1000],
        [Area.Addition, Area.AssociativeLaw, Scope.NumbersLarger100, Scope.NumbersSmaller20],
        [Area.Addition, Area.CommutativeLaw]
    ].map(labels => ({labels})))('leaves numeric feasibility to generation: $labels', ({labels}) => {
        const result = plan(labels);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        const selected = bindingsForSelection(result.plan, sampleGenerationPlan(result.plan, () => 0));
        const resolved = resolveSchemaChoices(generator.schema, labels, selected.generator);
        setSeed(73);
        expect(generator.generate(resolved.config)).toBeNull();
        expect(getRandomState()).toBe(73);
    });

    it('keeps numeric-bound scopes out of matching rules', () => {
        const dependencies = spec.compatibility!.flatMap(rule => rule.dependencies ?? []);
        for (const rangeLabel of generator.schema.range[0]) {
            expect(dependencies.some(dependency => dependency.label === rangeLabel)).toBe(false);
        }
        expect(spec.compatibility!.map(rule => rule.id)).toEqual([
            'exactly-one-property-law', 'property-operation', 'property-value-profile'
        ]);
    });

    it('does not invent a law for an ordinary three-addend task', () => {
        const result = plan([Area.Addition, Scope.ThreeOperands, Scope.NumbersSmaller100]);
        expect(result).toMatchObject({supported: false, reason: 'incompatible-rules'});
        if (!result.supported) expect(result.ruleIds?.some(id => id.endsWith('exactly-one-property-law'))).toBe(true);
    });

    it.each([Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw])(
        'constrains an unspecified operation to valid %s alternatives without consuming entropy', law => {
            setSeed(81);
            const result = plan([law, Scope.NumbersSmaller100]);
            expect(getRandomState()).toBe(81);
            expect(result.supported).toBe(true);
            expect(result.work.assignmentsVisited).toBeLessThanOrEqual(3);
            if (!result.supported) return;
            const observed = new Set<string>();
            for (const fraction of [0, 0.999]) {
                const selected = bindingsForSelection(result.plan, sampleGenerationPlan(result.plan, () => fraction));
                const resolved = resolveSchemaChoices(generator.schema, result.plan.targetLabels, selected.generator);
                const stub = generator.generate(resolved.config);
                expect(stub).not.toBeNull();
                observed.add(stub!.data.operation);
                if (law === Area.DistributiveLaw) expect(resolved.resolvedLabels)
                    .toEqual(expect.arrayContaining([Area.Addition, Area.Multiplication]));
            }
            expect([...observed].sort()).toEqual(law === Area.DistributiveLaw
                ? ['multiplication'] : ['addition', 'multiplication']);
        });

    it('separates semantic admission from numeric generation across all bound, zero, tens and law profiles', () => {
        const lower = [
            [undefined, 0], [Scope.NumbersLarger5, 5], [Scope.NumbersLarger10, 10], [Scope.NumbersLarger20, 20],
            [Scope.NumbersLarger100, 100], [Scope.NumbersLarger120, 120], [Scope.NumbersLarger1000, 1000],
            [Scope.NumbersLarger10000, 10000], [Scope.NumbersLarger100000, 100000], [Scope.NumbersLarger1000000, 1000000]
        ] as const;
        const upper = [
            [Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20],
            [Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000],
            [Scope.NumbersSmaller10000, 10000], [Scope.NumbersSmaller100000, 100000], [Scope.NumbersSmaller1000000, 1000000]
        ] as const;
        let admitted = 0;
        let feasible = 0;
        for (const [lawLabels, propertyLaw] of profiles) for (const [lowerLabel, min] of lower) for (const [upperLabel, max] of upper) {
            for (const zero of [undefined, Scope.NumbersWithZero, Scope.NumbersWithoutZero]) for (const tens of [false, true]) {
                const labels: string[] = [...lawLabels, upperLabel];
                if (lowerLabel) labels.push(lowerLabel);
                if (zero) labels.push(zero);
                if (tens) labels.push(Scope.MultiplesOf10);
                const result = plan(labels);
                expect(result.work.assignmentsVisited).toBeLessThanOrEqual(3);
                const declaredRange = !lowerLabel || generator.schema.range[0].includes(lowerLabel);
                expect(result.supported, labels.join(',')).toBe(declaredRange
                    && (propertyLaw !== 'distributive' || zero !== Scope.NumbersWithZero && !tens));
                if (!result.supported) continue;
                admitted++;
                const selected = bindingsForSelection(result.plan, sampleGenerationPlan(result.plan, () => 0));
                const resolved = resolveSchemaChoices(generator.schema, labels, selected.generator);
                expect(resolved.config.range).toEqual({min, max});
                const numericallyFeasible = isFeasibleArithmeticProperty(resolved.config);
                if (numericallyFeasible) feasible++;
                let generated = 0;
                for (const seed of [0, 42, 2026]) {
                    setSeed(seed);
                    const stub = generator.generate(resolved.config);
                    if (!numericallyFeasible) {
                        expect(stub).toBeNull();
                        continue;
                    }
                    if (!stub) {
                        expect(resolved.config.useCommutativeLaw).toBe(true);
                        continue;
                    }
                    generated++;
                    const data = stub.data;
                    const values = [data.num1, data.num2, data.num3, data.answer,
                        ...(data.propertyLaw === 'distributive' ? [data.combinedFactor, ...data.partialProducts] : [])];
                    expect(values.every(value => Number.isSafeInteger(value) && value >= min && value <= max)).toBe(true);
                    expect(values.includes(0)).toBe(zero === Scope.NumbersWithZero);
                    if (tens) expect(values.every(value => value % 10 === 0)).toBe(true);
                    if (data.propertyLaw === 'commutative') expect(data.num1).not.toBe(data.num3);
                    if (data.propertyLaw === 'associative' && data.operation === 'multiplication') {
                        expect(data.num1 * data.num2).toBeLessThanOrEqual(max);
                        expect(data.num2 * data.num3).toBeLessThanOrEqual(max);
                    }
                }
                if (numericallyFeasible) expect(generated, labels.join(',')).toBeGreaterThan(0);
            }
        }
        expect(admitted).toBe(2106);
        expect(feasible).toBeGreaterThan(100);
        expect(feasible).toBeLessThan(admitted);
    }, 30_000);
});
