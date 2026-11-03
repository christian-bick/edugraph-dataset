import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {ArithmeticNumericalExpressionCalculationsGenerator} from './generator.ts';
import {ArithmeticNumericalExpressionCalculationsGeneratorSchema, spec} from './spec.ts';

const generator = new ArithmeticNumericalExpressionCalculationsGenerator();
const schema = ArithmeticNumericalExpressionCalculationsGeneratorSchema;

describe('ArithmeticNumericalExpressionCalculationsGenerator schema', () => {
    it('declares fourteen feasible calculation profiles, retaining both original mathematical structures', () => {
        expect(spec.generalLabels).toEqual([Area.ArithmeticExpression, Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(schema.profile[2]).toHaveLength(14);
        expect(normalizeSchemaChoices(schema, [Area.ArithmeticExpression], 'generator')[0].alternatives).toHaveLength(14);
        expect(normalizeSchemaChoices(schema, [Area.GroupingSymbol], 'generator')[0].alternatives).toHaveLength(7);
    });

    it('resolves every complete direct/planned profile without changing config, labels or random continuation', () => {
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

    it('completes only feasible required-value profiles, including the ungrouped future evaluation domain', () => {
        for (const labels of [[Area.ArithmeticExpression], [Area.GroupingSymbol, Scope.NumbersSmaller1000],
            [Scope.NumbersSmaller10], [Scope.NumbersSmaller1000, Scope.NumbersLarger10]]) {
            expect(generateWithLabels(generator, labels)).not.toBeNull();
        }
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const consumer = {viewId: 'calculation-only', generalLabels: [], schema: {}, spec: {viewId: 'calculation-only', generalLabels: []}};
        expect(planModelCompatibility({id: 'unsupported-calculation-range', labels: [Scope.NumbersSmaller5]}, model, consumer).supported).toBe(false);
        expect(() => extractConfig(schema, [Area.GroupingSymbol, Scope.NumbersLarger10])).toThrow();
    });

    it('records and replays all calculation receipts with identical native mathematics and continuation', () => {
        const viewSpec = {viewId: 'numerical-expression-calculation-contract', generalLabels: [Ability.ProcedureExecution]};
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const consumer = {...viewSpec, schema: {}, spec: viewSpec};
        for (const [index, profileLabels] of schema.profile[2].entries()) {
            const target = {id: `calculation-${index}`, labels: [Area.ArithmeticExpression, ...profileLabels, Ability.ProcedureExecution]};
            const result = planModelCompatibility(target, model, consumer);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('A declared calculation profile must plan.');
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
