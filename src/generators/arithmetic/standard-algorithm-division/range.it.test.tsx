import {renderToStaticMarkup} from 'react-dom/server';
import {Ability, Area, Scope} from 'edugraph-ts';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {OperationsDivisionStandardAlgorithmViewSchema, spec as viewSpec} from '../../../visuals/views/operations/operations-division-standard-algorithm/spec.ts';
import {buildStandardDivisionProblem, StandardAlgorithmDivisionGenerator} from './generator.ts';
import {standardDivisionDomain, standardDivisionFrame, standardDivisionProfileCount, standardDivisionQuantities} from './domain.ts';
import {StandardAlgorithmDivisionGeneratorSchema, spec} from './spec.ts';
import {standardDivisionHasZero} from './zero-profile.ts';

const generator = new StandardAlgorithmDivisionGenerator();
const widths = [Scope.SingleDigitDivisor, Scope.TwoDigitDivisor, Scope.ThreeDigitDivisor];
const profiles = canonicalRangeProfiles.filter(({range}) => range.max <= 100000 && [0, 5].includes(range.min))
    .flatMap(profile => [1, 2, 3].flatMap(width => [false, true].flatMap(zero =>
        standardDivisionProfileCount(width, zero, profile.range) > 0 ? [{...profile, width, zero}] : [])));
const plan = (labels: string[]) => planModelCompatibility({id: 'canonical-division', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
    {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: OperationsDivisionStandardAlgorithmViewSchema, spec: viewSpec});
let Core: typeof import('../../../visuals/views/operations/operations-division-standard-algorithm/view.tsx').OperationsDivisionStandardAlgorithmCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('../../../visuals/views/operations/operations-division-standard-algorithm/view.tsx')).OperationsDivisionStandardAlgorithmCore;
});
afterAll(() => vi.unstubAllGlobals());

describe('standard-division canonical configuration and projections', () => {
    it('executes every feasible cell directly and through actual-view plans with exact replay', () => {
        let replays = 0;
        for (const profile of profiles) {
            const labels = [Area.DivisionStandardAlgorithm, Scope.IntegerNumbers, Ability.ProcedureExecution,
                widths[profile.width - 1]!, profile.zero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero, ...profile.labels];
            const result = plan(labels);
            expect(result.supported, JSON.stringify(profile)).toBe(true);
            if (!result.supported) continue;
            for (const seed of [0, 17, 77]) {
                setSeed(seed);
                const direct = extractConfig(StandardAlgorithmDivisionGeneratorSchema, labels);
                const data = generator.generate(direct.config)!.data;
                expect(hasCanonicalRangeWitness(standardDivisionQuantities(data), profile.range)).toBe(true);
                expect(standardDivisionHasZero(data)).toBe(profile.zero);
                const input = {generator, generatorSpec: spec, viewSpec, viewSchema: OperationsDivisionStandardAlgorithmViewSchema,
                    plan: result.plan, sampleKey: `canonical-division#${spec.generatorId}#${viewSpec.viewId}#train#question#inst:0`, seed, attempt: 1};
                const first = generatePlannedDraw(input);
                expect(generatePlannedDraw({...input, replay: first.replay})).toEqual(first);
                const realizedRange = resolveCanonicalRangeFromLabels(first.labels)!;
                expect(hasCanonicalRangeWitness(standardDivisionQuantities(first.stub!.data), realizedRange)).toBe(true);
                expect(realizedRange.max).toBe(profile.range.max);
                expect(realizedRange.min).toBeGreaterThanOrEqual(profile.range.min);
                replays++;
            }
        }
        expect(replays).toBe(144);
    });

    it('filters early direct-provider fallback by later range and zero requests', () => {
        for (const additional of [[], [Scope.NumbersSmaller10], [Scope.NumbersSmaller120, Scope.NumbersLarger5],
            [Scope.NumbersWithoutZero, Scope.NumbersSmaller20], [Scope.NumbersWithZero, Scope.NumbersSmaller10]]) {
            const labels = [Area.DivisionStandardAlgorithm, Scope.IntegerNumbers, Ability.ProcedureExecution, ...additional];
            expect(plan(labels).supported).toBe(true);
            for (let seed = 0; seed < 32; seed++) {
                setSeed(seed);
                const resolved = extractConfig(StandardAlgorithmDivisionGeneratorSchema, labels);
                const data = generator.generate(resolved.config)!.data;
                expect(hasCanonicalRangeWitness(standardDivisionQuantities(data), resolved.config.range!)).toBe(true);
                for (const label of additional) expect(resolved.resolvedLabels).toContain(label);
            }
        }
        for (const additional of [[Scope.SingleDigitDivisor, Scope.NumbersSmaller120, Scope.NumbersLarger5],
            [Scope.ThreeDigitDivisor, Scope.NumbersSmaller20], [Scope.NumbersWithZero, Scope.NumbersLarger5],
            [Scope.NumbersWithZero, Scope.NumbersWithoutZero]]) expect(plan(additional).supported).toBe(false);
    });

    it('preserves same-value Question/Solution markup for both boundaries of all 48 cells', () => {
        let renders = 0;
        for (const profile of profiles) {
            const domain = standardDivisionDomain(profile.width, profile.zero, profile.range);
            for (const position of [0, domain.weight * (1 - Number.EPSILON)]) {
                const frame = standardDivisionFrame(domain, position);
                const data = buildStandardDivisionProblem(frame.dividend, frame.divisor);
                for (const isSolutionView of [false, true]) {
                    const render = (labels: string[]) => renderToStaticMarkup(<Core config={{}} payload={{
                        problem: {type: 'arithmetic', data, labels}, viewId: viewSpec.viewId,
                        targetLabels: [], isSolutionView, seed: 13
                    }} />);
                    const markup = render(profile.labels);
                    expect(markup).toBe(render([]));
                    expect(markup).toContain(isSolutionView ? 'data-role="division-step"' : 'data-role="blank-work"');
                    renders++;
                }
            }
        }
        expect(renders).toBe(192);
    });
});
