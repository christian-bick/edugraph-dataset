import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt, planCompatibility} from '../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {matchTargets} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import * as rng from '../../lib/random.ts';
import {normalizeSchemaChoices} from '../../lib/schema-choices.ts';
import {extractConfig} from '../../lib/utils.ts';
import {spec as gradeOne} from '../../spec/ccss/grade-01.ts';
import {spec as kindergarten} from '../../spec/ccss/kindergarten.ts';
import {PlaceValueTeenGenerator} from './place-value-teen/generator.ts';
import {spec as teenSpec} from './place-value-teen/spec.ts';
import {teenRangeProfiles, teenRowsForRange} from './place-value-teen/numeric-domain.ts';
import {PlaceValueBundlesGenerator} from './place-value-bundles/generator.ts';
import {spec as tensSpec} from './place-value-bundles/spec.ts';
import {tensRangeProfiles, tensRowsForRange} from './place-value-bundles/numeric-domain.ts';
import {spec as composeSpec} from '../../visuals/views/place-value/place-value-compose-teen/spec.ts';
import {spec as decomposeSpec} from '../../visuals/views/place-value/place-value-decompose-teen/spec.ts';
import {spec as bundlesSpec} from '../../visuals/views/place-value/place-value-tens-bundles/spec.ts';

let Compose: typeof import('../../visuals/views/place-value/place-value-compose-teen/view.tsx')['PlaceValueComposeTeen'];
let Decompose: typeof import('../../visuals/views/place-value/place-value-decompose-teen/view.tsx')['PlaceValueDecomposeTeen'];
let Bundles: typeof import('../../visuals/views/place-value/place-value-tens-bundles/view.tsx')['PlaceValueTensBundles'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({PlaceValueComposeTeen: Compose} = await import('../../visuals/views/place-value/place-value-compose-teen/view.tsx'));
    ({PlaceValueDecomposeTeen: Decompose} = await import('../../visuals/views/place-value/place-value-decompose-teen/view.tsx'));
    ({PlaceValueTensBundles: Bundles} = await import('../../visuals/views/place-value/place-value-tens-bundles/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

describe('teen and tens-bundle canonical ranges', () => {
    it('retains all18 original values and their per-profile weights across every Q/S consumer', () => {
        const draw = vi.spyOn(rng, 'random'), teenValues: number[] = [], tensValues: number[] = [];
        let projections = 0;
        try {
            for (const kind of ['teen', 'tens'] as const) {
                const generator = kind === 'teen' ? new PlaceValueTeenGenerator() : new PlaceValueBundlesGenerator();
                const spec = kind === 'teen' ? teenSpec : tensSpec;
                for (const {range, labels} of kind === 'teen' ? teenRangeProfiles : tensRangeProfiles) {
                    const rows = kind === 'teen' ? teenRowsForRange(range) : tensRowsForRange(range);
                    for (let index = 0; index < rows.length; index++) {
                        draw.mockClear().mockReturnValue((index + 0.5) / rows.length);
                        const {data} = generator.generate({range})!;
                        expect(data).toEqual(rows[index]);
                        expect(draw).toHaveBeenCalledTimes(1);
                        const values = 'tens' in data ? [data.tens, 10, data.target] : [10, data.ones, data.target];
                        expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                        (kind === 'teen' ? teenValues : tensValues).push(data.target);
                        const consumers = kind === 'teen' ? [[Compose, composeSpec], [Decompose, decomposeSpec]] as const : [[Bundles, bundlesSpec]] as const;
                        for (const [View, view] of consumers) {
                            const targetLabels = [...spec.generalLabels!, ...view.generalLabels!, ...labels];
                            const result = planCompatibility({identity: {targetId: 'bundle-range', generatorId: spec.generatorId, viewId: view.viewId},
                                targetLabels, generatorLabels: spec.generalLabels!, viewLabels: view.generalLabels!,
                                fields: normalizeSchemaChoices(generator.schema, targetLabels, 'generator')});
                            if (!result.supported) throw new Error('A finite bundle profile stopped matching.');
                            const preparedView = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {}, plan: result.plan,
                                sampleKey: `bundle-range#${spec.generatorId}#${view.viewId}#train#question#inst:0`, seed: 0, attempt: 1}).view;
                            for (const isSolutionView of [false, true]) {
                                const markup = renderToStaticMarkup(createElement(View, {payload: {viewId: view.viewId,
                                    problem: {type: 'arithmetic', data, labels: []}, targetLabels, seed: 0, isSolutionView, preparedView}} as never));
                                expect(markup).not.toMatch(/NaN|undefined/);
                                if (isSolutionView) expect(markup).toContain(String(data.target));
                                projections++;
                            }
                        }
                    }
                }
            }
            expect(teenValues).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19]);
            expect(tensValues).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90]);
            expect(teenRangeProfiles.map(({range}) => teenRowsForRange(range).length)).toEqual([4, 5]);
            expect(tensRangeProfiles.map(({range}) => tensRowsForRange(range).length)).toEqual([1, 1, 2, 5]);
            expect(projections).toBe(54);
        } finally { draw.mockRestore(); }
    });

    it('keeps all old source routes and covers every old multiple-of-ten case through the reviewed bands', async () => {
        const prefixes = ['K.NBT.A.1-compose-teen-numbers~', 'K.NBT.A.1-decompose-teen-numbers~', '1.NBT.B.2b-teen-numbers~',
            '1.NBT.B.2a-ten-bundle~', '1.NBT.B.2c-multiples-of-ten~'];
        const targets = [...kindergarten, ...gradeOne].filter(target => prefixes.some(prefix => target.id.startsWith(prefix)));
        expect(targets).toHaveLength(7);
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map([
                ['place-value-teen', fileURLToPath(new URL('./place-value-teen/spec.ts', import.meta.url))],
                ['place-value-bundles', fileURLToPath(new URL('./place-value-bundles/spec.ts', import.meta.url))]
            ])), loadViewModelCatalog(undefined, undefined, new Map([
                ['place-value-compose-teen', fileURLToPath(new URL('../../visuals/views/place-value/place-value-compose-teen/spec.ts', import.meta.url))],
                ['place-value-decompose-teen', fileURLToPath(new URL('../../visuals/views/place-value/place-value-decompose-teen/spec.ts', import.meta.url))],
                ['place-value-tens-bundles', fileURLToPath(new URL('../../visuals/views/place-value/place-value-tens-bundles/spec.ts', import.meta.url))]
            ]))
        ]);
        const routes = matchTargets(targets, generators, views).tuples;
        expect(routes).toHaveLength(8);
        const evaluator = createLabelDependencyEvaluator(), oldSourceValues = new Set<number>();
        let checked = 0;
        for (const route of routes) {
            const generator = route.generatorId === 'place-value-teen' ? new PlaceValueTeenGenerator() : new PlaceValueBundlesGenerator();
            const view = views.find(view => view.viewId === route.viewId)!;
            const enumeration = enumerateDependencyAuditSelections(route.plan);
            expect(enumeration.status).toBe('complete');
            for (const selection of enumeration.selections) {
                const sampleKey = `${route.target.id}#${route.generatorId}#${route.viewId}#train#question#inst:0`, seed = 41;
                const replay = {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(route.plan, selection.choices)};
                const input = {generatorSchema: generator.schema, viewSchema: view.schema, plan: route.plan, sampleKey, seed, attempt: 1, replay};
                const resolved = resolvePlannedConfigurations(input), direct = extractConfig(generator.schema, selection.labels).config;
                expect(direct).toEqual(resolved.generatorConfig);
                const draw = generatePlannedDraw({...input, generator});
                expect(generatePlannedDraw({...input, generator})).toEqual(draw);
                const evaluated = evaluator.evaluate(selection.labels);
                expect(evaluated.errors).toEqual([]);
                expect(evaluated.conflicts).toEqual([]);
                expect(evaluated.assessments.filter(item => item.status === 'missing')).toEqual([]);
                if (route.target.id.startsWith('1.NBT.B.2c-multiples-of-ten~'))
                    for (const row of tensRowsForRange(direct.range!)) oldSourceValues.add(row.target);
                checked++;
            }
        }
        expect(checked).toBe(13);
        expect([...oldSourceValues].sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90]);
    });
});
