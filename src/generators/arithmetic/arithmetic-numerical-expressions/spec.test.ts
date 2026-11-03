import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {ArithmeticNumericalExpressionsGenerator} from './generator.ts';
import {ArithmeticNumericalExpressionsGeneratorSchema, spec} from './spec.ts';

const generator = new ArithmeticNumericalExpressionsGenerator();
const schema = ArithmeticNumericalExpressionsGeneratorSchema;

describe('ArithmeticNumericalExpressionsGenerator schema', () => {
    it('keeps integer syntax mathematics invariant and declares exactly seven correlated grouping/range profiles', () => {
        expect(spec.generalLabels).toEqual([Area.ArithmeticExpression, Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(schema.profile[2]).toHaveLength(7);
        const broad = normalizeSchemaChoices(schema, [Area.ArithmeticExpression], 'generator');
        expect(broad[0].alternatives).toHaveLength(7);
        const grouped = normalizeSchemaChoices(schema, [Area.ArithmeticExpression, Area.GroupingSymbol], 'generator');
        expect(grouped[0].alternatives).toHaveLength(4);
        expect(grouped[0].alternatives.every(choice => choice.labels.includes(Area.OrderOfOperations))).toBe(true);
    });

    it('resolves every exact direct/planned binding without changing config, annotations or random continuation', () => {
        for (const labels of schema.profile[2]) {
            setSeed(17);
            const direct = extractConfig(schema, [...labels]);
            const state = getRandomState();
            setSeed(17);
            const planned = resolveSchemaChoices(schema, labels, {profile: labels});
            expect(planned.config).toEqual(direct.config);
            expect([...planned.resolvedLabels].sort()).toEqual([...direct.resolvedLabels].sort());
            expect(getRandomState()).toBe(state);
        }
    });

    it('completes partial source requests only to feasible syntax, never a hidden result range', () => {
        for (const labels of [[Area.ArithmeticExpression], [Area.GroupingSymbol, Area.OrderOfOperations],
            [Scope.NumbersSmaller5], [Scope.NumbersSmaller100, Scope.NumbersLarger5]]) {
            expect(generateWithLabels(generator, labels)).not.toBeNull();
        }
        expect(() => extractConfig(schema, [Area.GroupingSymbol, Scope.NumbersSmaller5])).toThrow();
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const consumer = {viewId: 'syntax-only', generalLabels: [], schema: {}, spec: {viewId: 'syntax-only', generalLabels: []}};
        expect(planModelCompatibility({id: 'unsupported-syntax-range', labels: [Scope.NumbersSmaller1000]}, model, consumer).supported).toBe(false);
    });

    it('records and replays every syntax receipt with the same native draw and PRNG continuation', () => {
        const viewSpec = {viewId: 'numerical-expression-structure-contract', generalLabels: [Ability.Interpretation]};
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const consumer = {...viewSpec, schema: {}, spec: viewSpec};
        for (const [index, profileLabels] of schema.profile[2].entries()) {
            const target = {id: `syntax-${index}`, labels: [Area.ArithmeticExpression, ...profileLabels, Ability.Interpretation]};
            const result = planModelCompatibility(target, model, consumer);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('A declared syntax profile must plan.');
            setSeed(42);
            const direct = extractConfig(schema, target.labels);
            const expected = generator.generate(direct.config);
            const state = getRandomState();
            const input = {generator, generatorSpec: spec, viewSpec, viewSchema: {}, plan: result.plan,
                sampleKey: `${target.id}#${spec.generatorId}#${viewSpec.viewId}#train#question#inst:0`, attempt: 1, seed: 42};
            const draw = generatePlannedDraw(input);
            expect(draw.stub?.data).toEqual(expected?.data);
            expect(getRandomState()).toBe(state);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            expect(getRandomState()).toBe(state);
        }
    });
});
