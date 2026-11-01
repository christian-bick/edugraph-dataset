import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {patternDomain, patternProperty} from './domain.ts';
import {ArithmeticPatternsGenerator} from './generator.ts';
import {ArithmeticPatternsGeneratorSchema, spec} from './spec.ts';

describe('ArithmeticPatternsGenerator spec integration', () => {
    const generator = new ArithmeticPatternsGenerator();

    it('validates context-free fallbacks and conditions every direct/planned band on its resolved pattern', () => {
        const schema = ArithmeticPatternsGeneratorSchema;
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(schema.range[1]([Scope.NumbersSmaller20, Area.AssociativeLaw])).toBeUndefined();
        let feasible = 0;
        for (const operation of [Area.Addition, Area.Multiplication]) {
            for (const law of [undefined, Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw]) {
                for (const labels of schema.range[2]) {
                    const context = [operation, ...(law ? [law] : []),
                        law === Area.DistributiveLaw ? Scope.NumbersWithZero : Scope.NumbersWithoutZero];
                    const range = resolveCanonicalRangeFromLabels(labels)!;
                    const property = patternProperty(law === Area.CommutativeLaw, law === Area.AssociativeLaw, law === Area.DistributiveLaw)!;
                    const target = [...context, ...labels];
                    if (!patternDomain(operation === Area.Addition ? 'addition' : 'multiplication', property, range).length) {
                        expect(() => extractConfig(schema, target)).toThrow();
                        continue;
                    }
                    const direct = extractConfig(schema, target);
                    const bindings = Object.fromEntries(normalizeSchemaChoices(schema, target, 'generator')
                        .map(field => [field.field, field.alternatives[0]!.labels]));
                    bindings.range = labels;
                    const planned = resolveSchemaChoices(schema, target, bindings);
                    expect(planned.config).toEqual(direct.config);
                    expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
                    feasible++;
                }
            }
        }
        expect(feasible).toBe(20);
    });

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

});
