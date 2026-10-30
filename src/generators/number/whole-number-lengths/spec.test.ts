import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {matchTarget} from '../../../lib/matching.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {getRandomState} from '../../../lib/random.ts';
import {spec as targets} from '../../../spec/ccss/grade-02.ts';
import {spec as viewSpec, OperationsNumberLineRepresentationViewSchema} from '../../../visuals/views/operations/operations-number-line-representation/spec.ts';
import {WholeNumberLengthsGenerator} from './generator.ts';
import {WholeNumberLengthsGeneratorSchema, spec} from './spec.ts';

const generator = new WholeNumberLengthsGenerator();
const producer = {generatorId: spec.generatorId, problemType: 'WholeNumberLengthProblem',
    labels: [...spec.generalLabels!, ...extractSchemaLabels(generator.schema)],
    generalLabels: spec.generalLabels, schema: generator.schema, spec};
const view = {viewId: viewSpec.viewId, problemType: 'WholeNumberLengthProblem',
    supportedLabels: [...viewSpec.generalLabels], generalLabels: viewSpec.generalLabels,
    schema: OperationsNumberLineRepresentationViewSchema, spec: viewSpec};

describe('whole-number-lengths capabilities', () => {
    it('owns the mathematical rooted relation without a learner action or redundant zero selector', () => {
        expect(spec.generalLabels).toEqual([Area.NumerationWithIntegers, Scope.IntegerNumbers, Scope.Base10,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithZero]);
        expect(Object.keys(WholeNumberLengthsGeneratorSchema)).toEqual(['range']);
        const supported = extractSchemaLabels(generator.schema);
        expect(supported).toContain(Scope.NumbersSmaller100);
        expect(supported).not.toContain(Scope.NumbersLarger5);
        expect(supported).not.toContain(Scope.NumbersWithoutZero);
        const stub = generateWithLabels(generator, [Area.NumerationWithIntegers, Scope.NumbersSmaller100]);
        expect(stub!.labels).toContain(Scope.NumbersSmaller100);
        expect(stub!.data.origin).toBe(0);
        expect(stub!.data.endpoint).toBeGreaterThan(0);
    });

    it('supports the unchanged Grade-2 marking target with complete annotations and replay', () => {
        const target = targets.find(target => target.id === '2.MD.B.6-number-line-representation~5cfb1e4b')!;
        const result = matchTarget(target, producer, view);
        expect(result.matched).toBe(true);
        if (!result.matched) throw new Error('The rooted marking target must have a successor.');
        const input = {generator, generatorSpec: spec, viewSpec, viewSchema: OperationsNumberLineRepresentationViewSchema,
            plan: result.plan, sampleKey: `${target.id}#whole-number-lengths#${viewSpec.viewId}#train#question#inst:0`,
            attempt: 1, seed: 31};
        const draw = generatePlannedDraw(input);
        const continuation = getRandomState();
        expect(draw.labels).toContain(Scope.NumbersWithZero);
        expect(draw.labels).not.toContain(Scope.NumbersWithoutZero);
        expect(draw.stub!.data).toMatchObject({kind: 'whole-number-length', origin: 0, unit: 1});
        const evaluation = createLabelDependencyEvaluator().evaluate(draw.labels);
        expect(evaluation.conflicts).toEqual([]);
        expect(evaluation.assessments.filter(item => item.status === 'missing' && item.facet !== 'range')).toEqual([]);
        expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
        expect(getRandomState()).toBe(continuation);
    });

    it('cannot promise zero absence or a lower bound above its mathematical origin', () => {
        const target = {id: 'invalid-rooted-domain', labels: [Area.NumerationWithIntegers,
            Ability.VisualArticulation, Scope.Numberline, Scope.NumbersSmaller100]};
        for (const extra of [Scope.NumbersWithoutZero, Scope.NumbersLarger5, Scope.NumbersWithNegatives]) {
            expect(matchTarget({...target, labels: [...target.labels, extra]}, producer, view).matched).toBe(false);
        }
    });
});
