import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Scope} from 'edugraph-ts';
import {createGenerationSelectionReceipt, planCompatibility} from '../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {matchTargets} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import {normalizeSchemaChoices} from '../../lib/schema-choices.ts';
import {extractConfig} from '../../lib/utils.ts';
import {spec as kindergarten} from '../../spec/ccss/kindergarten.ts';
import {buildCategoryCountRelations} from './category-count-relations.ts';
import {classificationRangeProfiles, classificationRows} from './canonical-classification-domains.ts';
import {CountingClassifyCountGenerator} from './counting-classify-count/generator.ts';
import {spec as countSpec} from './counting-classify-count/spec.ts';
import {CountingClassifySortGenerator} from './counting-classify-sort/generator.ts';
import {spec as sortSpec} from './counting-classify-sort/spec.ts';
import {spec as countViewSpec} from '../../visuals/views/sorting/sorting-classify-count/spec.ts';
import {spec as sortViewSpec} from '../../visuals/views/sorting/sorting-classify-sort/spec.ts';
import {spec as orderViewSpec} from '../../visuals/views/sorting/sorting-classify-order/spec.ts';

let Count: typeof import('../../visuals/views/sorting/sorting-classify-count/view.tsx')['SortingClassifyCount'];
let Sort: typeof import('../../visuals/views/sorting/sorting-classify-sort/view.tsx')['SortingClassifySort'];
let Order: typeof import('../../visuals/views/sorting/sorting-classify-order/view.tsx')['SortingClassifyOrder'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({SortingClassifyCount: Count} = await import('../../visuals/views/sorting/sorting-classify-count/view.tsx'));
    ({SortingClassifySort: Sort} = await import('../../visuals/views/sorting/sorting-classify-sort/view.tsx'));
    ({SortingClassifyOrder: Order} = await import('../../visuals/views/sorting/sorting-classify-order/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

describe('classification canonical quantity projections', () => {
    it('checks canonical boundaries, small category sets and permitted ties in every actual Q/S consumer', () => {
        let projections = 0;
        const relationChoices = [[Scope.Least, 'least'], [Scope.Most, 'most'],
            [Scope.AscendingOrder, 'ascending'], [Scope.DescendingOrder, 'descending']] as const;
        for (const profile of classificationRangeProfiles) for (const relation of [undefined, ...relationChoices.map(([, relation]) => relation)]) {
            const generator = relation ? new CountingClassifySortGenerator() : new CountingClassifyCountGenerator(),
                spec = relation ? sortSpec : countSpec, view = !relation ? countViewSpec
                    : relation === 'least' || relation === 'most' ? sortViewSpec : orderViewSpec,
                View = !relation ? Count : relation === 'least' || relation === 'most' ? Sort : Order;
            const targetLabels = [...spec.generalLabels!, ...view.generalLabels!, ...profile.labels,
                ...(relation ? [relationChoices.find(([, value]) => value === relation)![0]] : [])];
            const result = planCompatibility({identity: {targetId: 'classification-boundary', generatorId: spec.generatorId, viewId: view.viewId},
                targetLabels, generatorLabels: spec.generalLabels!, viewLabels: view.generalLabels!,
                fields: normalizeSchemaChoices(generator.schema, targetLabels, 'generator')});
            if (!result.supported) throw new Error('A finite classification profile stopped matching.');
            const preparedView = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {},
                plan: result.plan, sampleKey: `classification-boundary#${spec.generatorId}#${view.viewId}#train#question#inst:0`,
                seed: 0, attempt: 1}).view;
            const rows = classificationRows(profile.range, relation);
            const witnesses = [...new Set([rows[0]!, rows[rows.length - 1]!,
                ...rows.filter(row => row.counts.length < 3), rows.find(row => row.counts.join('/') === '3/3/4'),
                rows.find(row => new Set(row.counts).size === 2)].filter(row => row !== undefined))];
            for (const row of witnesses) {
                const categories = Object.fromEntries(row.counts.map((count, index) => [['A', 'B', 'C'][index]!, count]));
                const numObjects = row.counts.reduce((sum, count) => sum + count, 0);
                const data = relation ? {categories, numObjects, relation, ...buildCategoryCountRelations(categories)} : {categories, numObjects};
                for (const isSolutionView of [false, true]) {
                    const markup = renderToStaticMarkup(createElement(View, {payload: {viewId: view.viewId,
                        problem: {type: 'counting', data, labels: []}, targetLabels, seed: 0, isSolutionView, preparedView}} as never));
                    expect(markup).not.toMatch(/NaN|undefined/);
                    if (relation) expect(markup.match(/data-classification-item="true"/g)).toHaveLength(numObjects);
                    if (relation === 'least' || relation === 'most')
                        expect(markup.match(/data-selected="true"/g) ?? []).toHaveLength(isSolutionView ? 1 : 0);
                    if (isSolutionView && (!relation || relation === 'ascending' || relation === 'descending'))
                        for (const count of row.counts) expect(markup).toContain(`>${count}</`);
                    projections++;
                }
            }
        }
        expect(projections).toBe(94);
    });
    it('uses reviewed category-count bands for all old source allocations and validates every native selection', async () => {
        const targets = kindergarten.filter(target => ['K.MD.B.3-classify-count~', 'K.MD.B.3-sort-by-count~',
            'K.MD.B.3-select-by-count~'].some(prefix => target.id.startsWith(prefix)));
        expect(targets).toHaveLength(10);
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map([
                ['counting-classify-count', fileURLToPath(new URL('./counting-classify-count/spec.ts', import.meta.url))],
                ['counting-classify-sort', fileURLToPath(new URL('./counting-classify-sort/spec.ts', import.meta.url))]
            ])), loadViewModelCatalog(undefined, undefined, new Map([
                ['sorting-classify-count', fileURLToPath(new URL('../../visuals/views/sorting/sorting-classify-count/spec.ts', import.meta.url))],
                ['sorting-classify-sort', fileURLToPath(new URL('../../visuals/views/sorting/sorting-classify-sort/spec.ts', import.meta.url))],
                ['sorting-classify-order', fileURLToPath(new URL('../../visuals/views/sorting/sorting-classify-order/spec.ts', import.meta.url))]
            ]))
        ]);
        const routes = matchTargets(targets, generators, views).tuples;
        expect(routes).toHaveLength(10);
        const evaluator = createLabelDependencyEvaluator(), sourceSupport = new Map<string, Set<string>>();
        let selections = 0;
        for (const route of routes) {
            const generator = route.generatorId === 'counting-classify-count' ? new CountingClassifyCountGenerator() : new CountingClassifySortGenerator();
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
                expect(draw.stub).not.toBeNull();
                expect(generatePlannedDraw({...input, generator})).toEqual(draw);
                const evaluated = evaluator.evaluate(selection.labels);
                expect(evaluated.errors).toEqual([]);
                expect(evaluated.conflicts).toEqual([]);
                expect(evaluated.assessments.filter(item => item.status === 'missing')).toEqual([]);
                const relation = 'relation' in direct ? direct.relation : undefined;
                const key = String(relation ?? 'count'), covered = sourceSupport.get(key) ?? new Set<string>();
                classificationRows(direct.range!, relation).forEach(row => covered.add(row.counts.join('/')));
                sourceSupport.set(key, covered);
                selections++;
            }
        }
        expect(selections).toBe(15);
        for (const [relation, covered] of sourceSupport) {
            const expected = relation === 'count' ? ['1', '1/1'] : [];
            for (let a = 1; a <= 8; a++) for (let b = 1; b <= 9 - a; b++) for (let c = 1; c <= 10 - a - b; c++) {
                const counts = [a, b, c];
                if (relation !== 'count' && (new Set(counts).size < 2
                    || relation === 'least' && counts.filter(count => count === Math.min(...counts)).length !== 1
                    || relation === 'most' && counts.filter(count => count === Math.max(...counts)).length !== 1)) continue;
                expected.push(counts.join('/'));
            }
            expect(expected.every(key => covered.has(key))).toBe(true);
        }
    });
});
