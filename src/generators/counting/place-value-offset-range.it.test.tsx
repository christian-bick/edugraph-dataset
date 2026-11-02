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

describe('place-value offset source correction', () => {
    it('projects all2736 unchanged source frames through both actual Question/Solution consumers', () => {
        let projections = 0;
        for (const [step, upper, profile] of [[10, 100, 'two-digit'], [10, 1000, 'three-digit'],
            [100, 1000, 'three-digit']] as const) for (const direction of ['inc', 'dec'] as const) {
            const old = countingOffsetStarts({range: {min: step, max: upper}, direction}, step, profile),
                current = placeValueOffsetStarts(step, createCanonicalNumericRange(upper), direction, profile, false);
            expect(current).toEqual(old);
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
        }
        expect(projections).toBe(5472);
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
