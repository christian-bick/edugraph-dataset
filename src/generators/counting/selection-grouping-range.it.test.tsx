import {fileURLToPath} from 'node:url';
import {Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {matchTargets} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import {extractConfig} from '../../lib/utils.ts';
import {spec as kindergarten} from '../../spec/ccss/kindergarten.ts';
import {spec as gradeTwo} from '../../spec/ccss/grade-02.ts';
import {CountingObjectsCountOutCore} from '../../visuals/views/counting/counting-objects-count-out/view.tsx';
import {CountingObjectsParityCore} from '../../visuals/views/counting/counting-objects-parity/view.tsx';
import {countingSupplyRows, groupingCountingProfiles, groupingCountsForRange, selectionCountingProfiles} from './canonical-counting-domains.ts';
import {CountingSelectionGenerator} from './counting-selection/generator.ts';
import {ParityGroupingGenerator} from './parity-grouping/generator.ts';

describe('selection and grouping canonical quantity contracts', () => {
    const arrangements = [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement] as const;
    const selectionCases = selectionCountingProfiles.flatMap(({range}) => arrangements.map(arrangement => ({
        name: `${range.min}..${range.max}, ${arrangement.split('/').at(-1)}`,
        range, arrangement, rows: countingSupplyRows(range, 'any')
    })));
    const groupingCases = groupingCountingProfiles.flatMap(({range}) =>
        (['even', 'singleton-odd', 'positive-odd'] as const).map(parity => ({
            name: `${range.min}..${range.max}, ${parity}`,
            counts: groupingCountsForRange(range, parity)
        })));

    it.each(selectionCases)('projects every requested/supply pair for $name in both modes', ({rows, arrangement}) => {
        let projections = 0;
        for (const row of rows) {
            for (let available = row.first; available <= row.last; available++) {
                for (const isSolutionView of [false, true]) {
                    const markup = renderToStaticMarkup(<CountingObjectsCountOutCore config={{arrangement}} payload={{
                        viewId: 'counting-objects-count-out', problem: {type: 'counting', labels: [],
                            data: {numObjects: row.requested, simpleAnswer: row.requested, availableCount: available}},
                        targetLabels: [], seed: 7, isSolutionView}} />);
                    expect(markup.match(/<img\b/g)).toHaveLength(available);
                    expect(markup).toContain(isSolutionView ? `Colored: ${row.requested}`
                        : `Color exactly ${row.requested} `);
                    expect(markup).not.toMatch(/NaN|undefined/);
                    projections++;
                }
            }
        }
        expect(projections).toBe(rows.reduce((sum, row) => sum + row.last - row.first + 1, 0) * 2);
    });

    it.each(groupingCases)('projects every grouping count for $name in both modes', ({counts}) => {
        let projections = 0;
        for (const count of counts) for (const isSolutionView of [false, true]) {
            const groupSize = Math.floor(count / 2), remainder = count % 2 as 0 | 1;
            const markup = renderToStaticMarkup(<CountingObjectsParityCore config={{}} payload={{
                viewId: 'counting-objects-parity', problem: {type: 'counting', labels: [], data: {
                    kind: 'parity-grouping', numObjects: count, groupSize, remainder,
                    parity: remainder ? 'odd' : 'even'}}, targetLabels: [], seed: 7, isSolutionView}} />);
            expect(markup).toContain(`Can ${count} objects be split into two equal groups?`);
            expect(markup).toContain(`group 1 with ${groupSize} objects`);
            expect(markup).toContain(`group 2 with ${groupSize} objects`);
            expect(markup).not.toMatch(/NaN|undefined/);
            projections++;
        }
        expect(projections).toBe(counts.length * 2);
    });

    it('retains all207 pairs, three arrangements, all20 grouping counts and exactly1282 projections', () => {
        const pairs = selectionCountingProfiles.flatMap(({range}) => countingSupplyRows(range, 'any')
            .flatMap(row => Array.from({length: row.last - row.first + 1}, (_, offset) =>
                `${row.requested}/${row.first + offset}`)));
        expect(pairs).toHaveLength(207);
        expect(new Set(pairs).size).toBe(207);
        expect(selectionCases).toHaveLength(selectionCountingProfiles.length * 3);
        expect(selectionCases.map(({arrangement}) => arrangement)).toEqual(
            selectionCountingProfiles.flatMap(() => [...arrangements]));
        const counts = groupingCases.flatMap(({counts}) => [...counts]);
        expect(counts.sort((a, b) => a - b)).toEqual(Array.from({length: 20}, (_, index) => index + 1));
        const selectionProjections = selectionCases.reduce((sum, {rows}) =>
            sum + rows.reduce((total, row) => total + row.last - row.first + 1, 0) * 2, 0);
        const groupingProjections = groupingCases.reduce((sum, {counts}) => sum + counts.length * 2, 0);
        expect(selectionProjections).toBe(1242);
        expect(groupingProjections).toBe(40);
        expect(selectionProjections + groupingProjections).toBe(1282);
    });
    it('retains old source support through reviewed fine bands and validates every admitted annotation selection', async () => {
        const targets = [...kindergarten, ...gradeTwo].filter(target => target.id.startsWith('K.CC.B.5-how-many~')
            || target.id.startsWith('2.OA.C.3-object-group-parity~'));
        expect(targets).toHaveLength(16);
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map([
                ['counting-selection', fileURLToPath(new URL('./counting-selection/spec.ts', import.meta.url))],
                ['parity-grouping', fileURLToPath(new URL('./parity-grouping/spec.ts', import.meta.url))]
            ])), loadViewModelCatalog(undefined, undefined, new Map([
                ['counting-objects-count-out', fileURLToPath(new URL('../../visuals/views/counting/counting-objects-count-out/spec.ts', import.meta.url))],
                ['counting-objects-parity', fileURLToPath(new URL('../../visuals/views/counting/counting-objects-parity/spec.ts', import.meta.url))]
            ]))
        ]);
        const routes = matchTargets(targets, generators, views).tuples;
        expect(routes).toHaveLength(14);
        const evaluator = createLabelDependencyEvaluator(), supplies = new Map<string, Set<string>>(),
            evenCounts = new Set<number>(), oddCounts = new Set<number>();
        let selections = 0;
        for (const route of routes) {
            const generator = route.generatorId === 'counting-selection' ? new CountingSelectionGenerator() : new ParityGroupingGenerator();
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
                if (route.generatorId === 'counting-selection') {
                    const arrangement = String(resolved.view.config.arrangement);
                    const covered = supplies.get(arrangement) ?? new Set<string>();
                    for (const row of countingSupplyRows(direct.range!, 'any'))
                        for (let available = row.first; available <= row.last; available++) covered.add(`${row.requested}/${available}`);
                    supplies.set(arrangement, covered);
                } else {
                    const profile = direct.parity as 'even' | 'singleton-odd' | 'positive-odd';
                    const counts = groupingCountsForRange(direct.range!, profile);
                    counts.forEach(count => (profile === 'even' ? evenCounts : oddCounts).add(count));
                }
                selections++;
            }
        }
        expect(selections).toBe(22);
        for (const [arrangement, covered] of supplies) {
            const cap = arrangement === Scope.ScatteredArrangement ? 10 : 20, expected = [];
            for (let requested = 1; requested <= cap; requested++) for (let available = requested; available <= cap; available++) {
                if (requested === available && [5, 10, 20].includes(requested)) continue;
                expected.push(`${requested}/${available}`);
            }
            expect([...covered].sort()).toEqual(expected.sort());
        }
        expect([...evenCounts].sort((a, b) => a - b)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
        expect([...oddCounts].sort((a, b) => a - b)).toEqual([1, 3, 5, 7, 9, 11, 13, 15, 17, 19]);
    });
});
