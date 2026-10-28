import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticOpsTriplesGenerator} from './generator.ts';
import {ArithmeticOpsTriplesGeneratorSchema, spec} from './spec.ts';

describe('ArithmeticOpsTriplesGenerator Spec Integration', () => {
    const generator = new ArithmeticOpsTriplesGenerator();

    it('advertises exactly three operands as an invariant capability', () => {
        expect(spec.generalLabels).toContain(Scope.ThreeOperands);
        expect(generator.schema).not.toHaveProperty('operandCardinality');
    });

    it('resolves Sum into a three-addend addition payload', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Area.Sum,
            Scope.ThreeOperands,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller20
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.num1 + stub!.data.num2 + stub!.data.num3).toBe(stub!.data.answer);
        expect(stub!.data.answer).toBeLessThanOrEqual(20);
        expect(stub!.labels).toContain(Area.Addition);
    });

    it('does not add Sum to a generic three-addend addition target', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Scope.ThreeOperands,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller20
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.labels).toContain(Area.Addition);
        expect(stub!.labels).not.toContain(Area.Sum);
    });

    it.each([
        [Area.CommutativeLaw, 'commutative'],
        [Area.AssociativeLaw, 'associative']
    ] as const)('resolves %s into its triple property payload', (law, propertyLaw) => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            law,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller20
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.propertyLaw).toBe(propertyLaw);
        expect(stub!.labels).toContain(law);
    });

    it('does not expose negative or procedure-inversion configuration', () => {
        expect(generator.schema).not.toHaveProperty('requireNegative');
        expect(generator.schema).not.toHaveProperty('invertProcedure');
        expect(generator.schema).not.toHaveProperty('useThreeAddends');
    });

    it('resolves a distributive target to multiplication with two partial products', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Area.Multiplication,
            Area.DistributiveLaw,
            Scope.ThreeOperands,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller100
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe('multiplication');
        expect(stub!.data.propertyLaw).toBe('distributive');
        expect(stub!.data.partialProducts).toHaveLength(2);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Area.Addition,
            Area.Multiplication,
            Area.DistributiveLaw
        ]));
    });

    it('does not attach a distributive width to an ordinary addition configuration', () => {
        const labels = [Area.Addition, Scope.SingleDigitSmallestOperand, Scope.NumbersSmaller1000];
        const result = planModelCompatibility({id: 'ordinary-addition-width', labels},
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
                schema: generator.schema, spec},
            {viewId: 'neutral', generalLabels: [], schema: {}, spec: {viewId: 'neutral', generalLabels: []}});
        expect(result).toMatchObject({supported: false, reason: 'incompatible-rules'});
        setSeed(2);
        expect(generateWithLabels(generator, labels)).toBeNull();
    });

    it.each([
        [Area.Addition], [Area.Subtraction], [Area.Multiplication], [Area.Division],
        [Area.Addition, Area.CommutativeLaw], [Area.Addition, Area.AssociativeLaw],
        [Area.Addition, Area.Multiplication, Area.DistributiveLaw]
    ].map(operationLabels => ({operationLabels})))('preserves the old configuration, entropy and choice counts for $operationLabels', ({operationLabels}) => {
        const labels = [...operationLabels, Scope.NumbersSmaller100];
        const legacySchema = {...ArithmeticOpsTriplesGeneratorSchema,
            useDistributiveLaw: [[Area.DistributiveLaw], hasLabel(Area.DistributiveLaw)]} as const;
        const domains = [legacySchema, generator.schema].map(schema => {
            setSeed(71);
            const choices = normalizeSchemaChoices(schema, labels, 'generator');
            const result = planModelCompatibility({id: 'legacy-triple', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: 'neutral', generalLabels: [], schema: {}, spec: {viewId: 'neutral', generalLabels: []}});
            expect(getRandomState()).toBe(71);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Expected the original triple profile to remain admitted.');
            return {
                choices: choices.map(domain => [domain.field, domain.alternatives.length]),
                admitted: result.plan.domains.map(domain => [domain.field, domain.alternatives.length]),
                groups: result.plan.groups.map(group => ({fields: group.fields, count: group.assignments.length}))
            };
        });
        expect(domains[1]).toEqual(domains[0]);
        for (const seed of [0, 2, 42]) {
            const draws = [legacySchema, generator.schema].map(schema => {
                setSeed(seed);
                const {config} = extractConfig(schema, labels);
                const configurationState = getRandomState();
                const stub = generator.generate(config);
                return {config, configurationState, stub, state: getRandomState()};
            });
            expect(draws[1]).toEqual(draws[0]);
        }
    });
});
