import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {canonicalRangeLabels, resolveCanonicalRangeFromLabels} from '../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
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
        claim: undefined},
    {name: 'subtraction within 10', operation: Area.Subtraction, bounds: [Scope.NumbersSmaller10],
        claim: undefined},
    {name: 'addition from 10 within 100', operation: Area.Addition,
        bounds: [Scope.NumbersLarger10, Scope.NumbersSmaller100], claim: Scope.TwoDigitLargestOperand},
    {name: 'addition within 5', operation: Area.Addition, bounds: [Scope.NumbersSmaller5],
        claim: Scope.SingleDigitLargestOperand},
    {name: 'subtraction within 5', operation: Area.Subtraction, bounds: [Scope.NumbersSmaller5],
        claim: Scope.SingleDigitLargestOperand}
];
const cases: {name: string; generator: ProblemGenerator; spec: GeneratorSpec; labels: string[]; claim?: string}[] = [
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

const assertClaims = (data: Record<string, unknown>, labels: string[]) => {
    const operands = [data.num1, data.num2, data.num3]
        .filter((value): value is number => typeof value === 'number').map(Math.abs);
    const width = (value: number) => Math.max(1, Math.floor(Math.log10(Math.max(1, value))) + 1);
    const smallest = width(Math.min(...operands)), largest = width(Math.max(...operands));
    for (const [label, value, expected] of [
        [Scope.SingleDigitSmallestOperand, smallest, 1], [Scope.TwoDigitSmallestOperand, smallest, 2],
        [Scope.SingleDigitLargestOperand, largest, 1], [Scope.TwoDigitLargestOperand, largest, 2],
        [Scope.ThreeDigitLargestOperand, largest, 3], [Scope.FourDigitLargestOperand, largest, 4]
    ] as const) if (labels.includes(label)) expect(value).toBe(expected);
    if (labels.includes(Scope.MultipleDigitLargestOperand)) expect(largest).toBeGreaterThan(1);
    const range = resolveCanonicalRangeFromLabels(labels.filter(label => canonicalRangeLabels.includes(label)));
    expect(range).toBeDefined();
    expect(hasCanonicalRangeWitness([...operands, data.answer as number], range!)).toBe(true);
};

describe('Canonical arithmetic operand-width declarations', () => {
    it.each(cases)('constructs truthful direct and planned profiles and replays each path for $name', ({generator, spec, labels, claim}) => {
        const result = plan(generator, spec, labels);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const direct = extractConfig(generator.schema, labels);
            const directStub = generator.generate(direct.config);
            const continuation = getRandomState();
            expect(directStub).not.toBeNull();
            assertClaims(directStub!.data, direct.resolvedLabels);
            setSeed(seed);
            const directReplay = extractConfig(generator.schema, labels);
            expect(generator.generate(directReplay.config)).toEqual(directStub);
            expect(getRandomState()).toBe(continuation);
            const input = {generator, viewSchema: {}, plan: result.plan,
                sampleKey: `width-test#${spec.generatorId}#width-proof#train#question#inst:0`, seed, attempt: 1};
            const draw = generatePlannedDraw(input), plannedContinuation = getRandomState();
            expect(draw.stub).not.toBeNull();
            if (claim) expect(draw.labels).toContain(claim);
            assertClaims(draw.stub!.data, draw.labels);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            expect(getRandomState()).toBe(plannedContinuation);
        }
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

    it('completes a feasible stronger lower for an explicit triple smallest-width request', () => {
        const generator = new ArithmeticOpsTriplesGenerator();
        const result = plan(generator, tripleSpec,
            [Area.Addition, Scope.NumbersSmaller100, Scope.TwoDigitSmallestOperand]);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        const draw = generatePlannedDraw({generator, viewSchema: {}, plan: result.plan,
            sampleKey: 'width-test#arithmetic-ops-triples#width-proof#train#question#inst:0', seed: 7, attempt: 1});
        expect(draw.labels).toContain(Scope.NumbersLarger10);
        expect(draw.labels).toContain(Scope.TwoDigitSmallestOperand);
        expect(draw.stub).not.toBeNull();
        assertClaims(draw.stub!.data, draw.labels);
    });
});
