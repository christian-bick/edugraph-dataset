import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticPatternsGenerator} from './generator.ts';
import {ArithmeticPatternsGeneratorSchema, spec} from './spec.ts';

describe('ArithmeticPatternsGenerator spec integration', () => {
    const generator = new ArithmeticPatternsGenerator();

    it('keeps only invariant numeric scopes in general capabilities', () => {
        expect(spec.generalLabels).toEqual([
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]);
    });

    it.each([
        [[Area.PatternGeneration], 'recurrence'],
        [[Area.EmergentFeatureRecognition], 'recurrence'],
        [[Area.PatternGeneration, Area.EmergentFeatureRecognition], 'recurrence']
    ] as const)('resolves %j to the %s canonical model', (patternAreas, model) => {
        setSeed(17);
        const stub = generateWithLabels(generator, [
            Area.Addition,
            ...patternAreas,
            Ability.ProcedureExecution,
            Ability.ConceptClassification
        ])!;

        expect(stub.data.kind).toBe(model);
        expect(stub.labels).toContain(Area.Addition);
        expect(stub.labels).not.toContain(Area.PatternGeneration);
        expect(stub.labels).not.toContain(Area.EmergentFeatureRecognition);
        expect(stub.labels).not.toContain(Ability.ProcedureExecution);
        expect(stub.labels).not.toContain(Ability.ConceptClassification);
    });

    it.each([
        [Area.Addition, Area.CommutativeLaw, 'commutative'],
        [Area.Addition, Area.AssociativeLaw, 'associative'],
        [Area.Multiplication, Area.CommutativeLaw, 'commutative'],
        [Area.Multiplication, Area.AssociativeLaw, 'associative'],
        [Area.Multiplication, Area.DistributiveLaw, 'distributive']
    ] as const)('preserves the %s %s mathematical witness', (operation, law, propertyLaw) => {
        setSeed(29);
        const stub = generateWithLabels(generator, [
            operation,
            law,
            Area.EmergentFeatureRecognition,
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ])!;

        expect(stub.data.kind).toBe('recurrence');
        if (stub.data.kind !== 'recurrence') throw new Error('Expected a recurrence.');
        expect(stub.data.lawWitness?.law).toBe(propertyLaw);
        expect(stub.data.lawWitness?.result).toBeTypeOf('number');
        expect(stub.labels).toEqual(expect.arrayContaining([
            operation,
            law
        ]));
        expect(stub.labels).not.toContain(Ability.ProcedureUnderstanding);
        expect(stub.labels).not.toContain(Ability.TextualArticulation);
    });

    it('rejects zero absence on the zero-bearing distributive profile', () => {
        const labels = [Area.Multiplication, Area.DistributiveLaw, Scope.NumbersWithoutZero];
        const result = planModelCompatibility({id: 'distributive-without-zero', labels},
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
                schema: generator.schema, spec},
            {viewId: 'neutral', generalLabels: [], schema: {}, spec: {viewId: 'neutral', generalLabels: []}});
        expect(result).toMatchObject({supported: false, reason: 'empty-domain'});
        expect(() => generateWithLabels(generator, labels)).toThrow('Unsupported exact label combination');
    });

    it('completes a zero request with the actual zero-bearing profile', () => {
        setSeed(0);
        const stub = generateWithLabels(generator, [Area.Multiplication, Scope.NumbersWithZero])!;
        expect(stub.data.terms).toContain(0);
        expect(stub.data.lawWitness?.law).toBe('distributive');
        expect(stub.labels).toEqual(expect.arrayContaining([Area.DistributiveLaw, Scope.NumbersWithZero]));
        expect(stub.labels).not.toContain(Scope.NumbersWithoutZero);
    });

    it.each([
        [], [Area.Addition], [Area.Multiplication],
        [Area.Addition, Area.CommutativeLaw], [Area.Addition, Area.AssociativeLaw],
        [Area.Multiplication, Area.CommutativeLaw], [Area.Multiplication, Area.AssociativeLaw],
        [Area.Multiplication, Area.DistributiveLaw]
    ].map(labels => ({labels})))('preserves the old configuration, entropy and choice counts for $labels', ({labels}) => {
        const legacySchema = {...ArithmeticPatternsGeneratorSchema,
            useDistributiveLaw: [[Area.DistributiveLaw], hasLabel(Area.DistributiveLaw)]} as const;
        const domains = [legacySchema, generator.schema].map(schema => {
            setSeed(71);
            const choices = normalizeSchemaChoices(schema, labels, 'generator');
            const result = planModelCompatibility({id: 'legacy-pattern', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: 'neutral', generalLabels: [], schema: {}, spec: {viewId: 'neutral', generalLabels: []}});
            expect(getRandomState()).toBe(71);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Expected the original pattern profile to remain admitted.');
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
