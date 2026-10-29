import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {extractConfig} from '../../lib/utils.ts';
import type {GeneratorSpec} from '../../types/generator-spec.ts';
import type {ProblemGenerator} from '../../types/ml-engine.ts';
import {ArithmeticOpsPairsGenerator} from './arithmetic-ops-pairs/generator.ts';
import {spec as pairSpec} from './arithmetic-ops-pairs/spec.ts';
import {ArithmeticOpsTriplesGenerator} from './arithmetic-ops-triples/generator.ts';
import {spec as tripleSpec} from './arithmetic-ops-triples/spec.ts';
import {ArithmeticPropertyRelationsGenerator} from './arithmetic-property-relations/generator.ts';
import {spec as propertySpec} from './arithmetic-property-relations/spec.ts';

const view = {viewId: 'width-proof', generalLabels: [], schema: {},
    spec: {viewId: 'width-proof', generalLabels: []}};
const plan = (generator: ProblemGenerator, spec: GeneratorSpec, labels: string[]) =>
    planModelCompatibility({id: 'width-test', labels}, {generatorId: spec.generatorId,
        generalLabels: spec.generalLabels, schema: generator.schema, spec}, view);

const pairCases = [
    {name: 'addition within 10', operation: Area.Addition, bounds: [Scope.NumbersSmaller10],
        claim: Scope.SingleDigitSmallestOperand},
    {name: 'subtraction within 10', operation: Area.Subtraction, bounds: [Scope.NumbersSmaller10],
        claim: Scope.SingleDigitSmallestOperand},
    {name: 'addition from 10 within 100', operation: Area.Addition,
        bounds: [Scope.NumbersLarger10, Scope.NumbersSmaller100], claim: Scope.TwoDigitSmallestOperand},
    {name: 'addition within 5', operation: Area.Addition, bounds: [Scope.NumbersSmaller5],
        claim: Scope.SingleDigitLargestOperand},
    {name: 'subtraction within 5', operation: Area.Subtraction, bounds: [Scope.NumbersSmaller5],
        claim: Scope.SingleDigitLargestOperand}
];
const cases = [
    ...pairCases.map(example => ({name: `pair ${example.name}`, generator: new ArithmeticOpsPairsGenerator(),
        spec: pairSpec, labels: [example.operation, ...example.bounds, Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero], claim: example.claim})),
    ...[
        {generator: new ArithmeticOpsTriplesGenerator(), spec: tripleSpec},
        {generator: new ArithmeticPropertyRelationsGenerator(), spec: propertySpec}
    ].flatMap(owner => [
        {name: `${owner.spec.generatorId} addition within 20`, ...owner,
            labels: [Area.Addition, Area.CommutativeLaw, Scope.NumbersSmaller20],
            claim: Scope.SingleDigitSmallestOperand},
        {name: `${owner.spec.generatorId} addition from 10 within 100`, ...owner,
            labels: [Area.Addition, Area.CommutativeLaw, Scope.NumbersLarger10, Scope.NumbersSmaller100],
            claim: Scope.TwoDigitSmallestOperand}
    ])
];

describe('Arithmetic operand-width declaration preservation', () => {
    it.each(cases)('keeps the original mathematics and entropy for $name', ({generator, spec, labels, claim}) => {
        const result = plan(generator, spec, labels);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        // This is the predicate used before contextual width declarations; concrete sampling is unchanged.
        const originalGenerator: ProblemGenerator = generator;
        const originalSchema = {...originalGenerator.schema,
            requireMultipleOf10: [[Scope.MultiplesOf10], hasLabel(Scope.MultiplesOf10)] as const};
        let successes = 0;
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const originalConfig = extractConfig(originalSchema, labels).config;
            const original = originalGenerator.generate(originalConfig);
            const continuation = getRandomState();
            const draw = generatePlannedDraw({generator, viewSchema: {}, plan: result.plan,
                sampleKey: `width-test#${spec.generatorId}#width-proof#train#question#inst:0`, seed, attempt: 1});
            expect(draw.stub?.data ?? null).toEqual(original?.data ?? null);
            expect(getRandomState()).toBe(continuation);
            expect(draw.labels).toContain(claim);
            if (!draw.stub) continue;
            successes++;
            const values = [draw.stub.data.num1, draw.stub.data.num2, draw.stub.data.num3]
                .filter((value): value is number => typeof value === 'number').map(Math.abs);
            if (claim === Scope.SingleDigitLargestOperand) expect(Math.max(...values)).toBeLessThan(10);
            else if (claim === Scope.SingleDigitSmallestOperand) expect(Math.min(...values)).toBeLessThan(10);
            else {
                expect(Math.min(...values)).toBeGreaterThanOrEqual(10);
                expect(Math.min(...values)).toBeLessThan(100);
            }
        }
        expect(successes).toBeGreaterThan(0);
    });

    it.each([
        [Area.Division, Scope.NumbersSmaller10, Scope.SingleDigitSmallestOperand],
        [Area.Addition, Scope.NumbersSmaller100, Scope.SingleDigitSmallestOperand],
        [Area.Addition, Scope.NumbersSmaller5, Scope.TwoDigitLargestOperand],
        [Area.Subtraction, Scope.NumbersSmaller100, Scope.TwoDigitSmallestOperand]
    ])('rejects an unsupported explicit pair width for %s', (operation, range, width) => {
        expect(plan(new ArithmeticOpsPairsGenerator(), pairSpec,
            [operation, range, width, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]).supported).toBe(false);
    });

    it('keeps wider non-distributive triples outside the new width claim', () => {
        const result = plan(new ArithmeticOpsTriplesGenerator(), tripleSpec,
            [Area.Addition, Scope.NumbersSmaller100, Scope.TwoDigitSmallestOperand]);
        expect(result.supported).toBe(false);
    });
});
