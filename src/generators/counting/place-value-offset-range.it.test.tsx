import {fileURLToPath} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {matchTargets} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import {extractConfig} from '../../lib/utils.ts';
import {spec as gradeOne} from '../../spec/ccss/grade-01.ts';
import {spec as gradeTwo} from '../../spec/ccss/grade-02.ts';
import {CountingPlaceValueOffsetView} from '../../visuals/views/counting/counting-place-value-offset-view.tsx';
import {buildCountingOffsetProblem, countingOffsetStarts} from './counting-offset.ts';
import {placeValueOffsetQuantities, placeValueOffsetStarts} from './place-value-offset-domain.ts';
import {CountingTenOffsetGenerator} from './counting-ten-offset/generator.ts';
import {CountingHundredOffsetGenerator} from './counting-hundred-offset/generator.ts';

const offsetProjectionContexts = [
    {step: 10, upper: 100, profile: 'two-digit', expectedFrames: 72},
    {step: 10, upper: 1000, profile: 'three-digit', expectedFrames: 648},
    {step: 100, upper: 1000, profile: 'three-digit', expectedFrames: 648}
] as const;
const offsetSourceContexts = offsetProjectionContexts.flatMap(context =>
    (['inc', 'dec'] as const).map(direction => ({...context, direction})));
const offsetProjectionCases = offsetSourceContexts.flatMap(context => {
    const hundreds = context.profile === 'two-digit' ? [0] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return hundreds.map(hundred => ({...context,
        minimum: hundred === 0 ? 10 : hundred * 100,
        maximum: hundred === 0 ? 99 : hundred * 100 + 99,
        expectedBandFrames: context.step === 10 ? 72
            : context.direction === 'inc' ? (hundred < 9 ? 81 : 0) : (hundred > 1 ? 81 : 0)
    }));
});

describe('place-value offset source correction', () => {
    it('retains the exact six-context,2736-frame and5472-render projection inventory', () => {
        expect(offsetSourceContexts).toHaveLength(6);
        expect(offsetProjectionCases).toHaveLength(38);
        const frames = offsetProjectionCases.reduce((sum, context) => sum + context.expectedBandFrames, 0);
        expect(frames).toBe(2736);
        expect(frames * 2).toBe(5472);
    });

    it.each(offsetSourceContexts)('retains the complete original $step/$upper/$profile/$direction source domain', ({step, upper, profile, direction, expectedFrames}) => {
        const old = countingOffsetStarts({range: {min: step, max: upper}, direction}, step, profile),
            current = placeValueOffsetStarts(step, createCanonicalNumericRange(upper), direction, profile, false);
        expect(current).toEqual(old);
        expect(current).toHaveLength(expectedFrames);
        const bands = offsetProjectionCases.filter(context => context.step === step && context.upper === upper
            && context.profile === profile && context.direction === direction);
        expect(current.every(start => bands.filter(band => start >= band.minimum && start <= band.maximum).length === 1)).toBe(true);
    }, 15000);

    it.each(offsetProjectionCases)('projects every $step/$upper/$profile/$direction source frame from $minimum to $maximum through actual Q/S consumers', ({step, upper, profile, direction, minimum, maximum, expectedBandFrames}) => {
        const current = placeValueOffsetStarts(step, createCanonicalNumericRange(upper), direction, profile, false)
            .filter(start => start >= minimum && start <= maximum);
        expect(current).toHaveLength(expectedBandFrames);
        let projections = 0;
        for (const start of current) {
            const data = buildCountingOffsetProblem(start, direction, step, upper);
            expect(hasCanonicalRangeWitness(placeValueOffsetQuantities(data), createCanonicalNumericRange(upper))).toBe(true);
            const viewId = step === 10 ? 'counting-ten-more-less' : 'counting-hundred-more-less';
            for (const isSolutionView of [false, true]) {
                const markup = renderToStaticMarkup(<CountingPlaceValueOffsetView expectedStepSize={step}
                    viewId={viewId} payload={{viewId, problem: {type: 'counting', data, labels: []},
                        targetLabels: [], seed: 7, isSolutionView}} />);
                expect(markup).toContain(`${direction === 'inc' ? '+' : '−'} 1 ${step === 10 ? 'ten' : 'hundred'}`);
                expect(markup).not.toMatch(/NaN|undefined|>0(?:\s|<)/);
                if (isSolutionView) expect(markup).toContain(`>${data.incDecAnswer}</div>`);
                projections++;
            }
        }
        expect(projections).toBe(expectedBandFrames * 2);
    }, 15000);
    it('keeps visible zero-count mathematics available without confusing zero digits with numerical zero', () => {
        for (const [step, start, upper, direction] of [[10, 1, 20, 'inc'], [10, 11, 20, 'dec'],
            [100, 11, 120, 'inc'], [100, 111, 120, 'dec']] as const) {
            expect(placeValueOffsetStarts(step, createCanonicalNumericRange(upper), direction,
                'unrestricted', true)).toContain(start);
            const data = buildCountingOffsetProblem(start, direction, step, upper),
                viewId = step === 10 ? 'counting-ten-more-less' : 'counting-hundred-more-less';
            const markup = renderToStaticMarkup(<CountingPlaceValueOffsetView expectedStepSize={step}
                viewId={viewId} payload={{viewId, problem: {type: 'counting', data, labels: []},
                    targetLabels: [], seed: 7, isSolutionView: true}} />);
            expect(markup).toMatch(/>0(?:\s|<)/);
            expect(placeValueOffsetQuantities(data)).toContain(0);
        }
    });
    it('retains all six source competencies with truthful zero absence and complete annotations', async () => {
        const prefixes = ['1.NBT.C.5-ten-more-less~', '2.NBT.B.8-place-value-offsets~'];
        const targets = [...gradeOne, ...gradeTwo].filter(target => prefixes.some(prefix => target.id.startsWith(prefix)));
        expect(targets).toHaveLength(6);
        expect(targets.map(target => target.id).sort()).toEqual([
            '1.NBT.C.5-ten-more-less~efc0f0d6', '1.NBT.C.5-ten-more-less~e20d23b2',
            '2.NBT.B.8-place-value-offsets~efd26cd6', '2.NBT.B.8-place-value-offsets~e1b8189a',
            '2.NBT.B.8-place-value-offsets~7bc1f058', '2.NBT.B.8-place-value-offsets~8b3f05b4'].sort());
        for (const target of targets) {
            expect(target.labels).toContain(Scope.NumbersWithoutZero);
            expect(target.labels).not.toContain(Scope.NumbersLarger10);
            expect(target.labels).not.toContain(Scope.NumbersLarger100);
        }
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map([
                ['counting-ten-offset', fileURLToPath(new URL('./counting-ten-offset/spec.ts', import.meta.url))],
                ['counting-hundred-offset', fileURLToPath(new URL('./counting-hundred-offset/spec.ts', import.meta.url))]
            ])), loadViewModelCatalog(undefined, undefined, new Map([
                ['counting-ten-more-less', fileURLToPath(new URL('../../visuals/views/counting/counting-ten-more-less/spec.ts', import.meta.url))],
                ['counting-hundred-more-less', fileURLToPath(new URL('../../visuals/views/counting/counting-hundred-more-less/spec.ts', import.meta.url))]
            ]))
        ]);
        const routes = matchTargets(targets, generators, views).tuples;
        expect(routes).toHaveLength(6);
        const evaluator = createLabelDependencyEvaluator();
        for (const route of routes) {
            const generator = route.generatorId === 'counting-ten-offset' ? new CountingTenOffsetGenerator() : new CountingHundredOffsetGenerator(),
                view = views.find(view => view.viewId === route.viewId)!;
            const enumeration = enumerateDependencyAuditSelections(route.plan);
            expect(enumeration.status).toBe('complete');
            expect(enumeration.selections).toHaveLength(1);
            const selection = enumeration.selections[0]!, sampleKey = `${route.target.id}#${route.generatorId}#${route.viewId}#train#question#inst:0`,
                seed = 41, replay = {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(route.plan, selection.choices)};
            const input = {generatorSchema: generator.schema, viewSchema: view.schema, plan: route.plan,
                sampleKey, seed, attempt: 1, replay};
            const resolved = resolvePlannedConfigurations(input), direct = extractConfig(generator.schema, selection.labels).config;
            expect(direct).toEqual(resolved.generatorConfig);
            expect(direct.requireZero).toBe(false);
            const draw = generatePlannedDraw({...input, generator});
            expect(draw.stub).not.toBeNull();
            expect(generatePlannedDraw({...input, generator})).toEqual(draw);
            const evaluated = evaluator.evaluate(selection.labels);
            expect(evaluated.errors).toEqual([]);
            expect(evaluated.conflicts).toEqual([]);
            expect(evaluated.assessments.filter(item => item.status === 'missing')).toEqual([]);
        }
    });
});
