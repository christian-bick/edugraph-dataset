import {fileURLToPath} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {matchTargets} from '../../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../../lib/model-catalog.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {spec as gradeFive} from '../../../spec/ccss/grade-05.ts';
import {spec as gradeSix} from '../../../spec/ccss/grade-06.ts';
import {RatioTableView} from '../../../visuals/views/ratio/ratio-table-view.tsx';
import {ratioQuantities, ratioTable} from '../helpers.ts';
import {RatioTablesGenerator} from './generator.ts';
import {ratioTableBaseRows, ratioTableRangeProfiles} from './numeric-domain.ts';

describe('ratio-table required mathematical models', () => {
    it('checks every numeric frame in all three actual Q/S projection contracts', () => {
        let projections = 0;
        for (const {range} of ratioTableRangeProfiles) for (const row of ratioTableBaseRows(range)) for (const second of row.seconds) {
            const data = ratioTable([row.first, second], ratioQuantities[0]!, [1,2,3,4]);
            for (const task of ['construction', 'missing-values', 'plotting'] as const) for (const isSolutionView of [false, true]) {
                const viewId = task === 'construction' ? 'ratio-table-construction'
                    : task === 'missing-values' ? 'ratio-table-missing-values' : 'ratio-coordinate-plotting';
                const markup = renderToStaticMarkup(<RatioTableView task={task} viewId={viewId} payload={{
                    viewId, problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], seed: 7, isSolutionView}} />);
                const text = markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
                expect(markup).not.toMatch(/NaN|undefined/);
                if (task === 'construction') {
                    expect(text).toContain('by 2, 3, 4');
                    expect(text.match(/\?/g) ?? []).toHaveLength(isSolutionView ? 0 : 6);
                } else if (task === 'missing-values') {
                    expect(text).toContain('Recover each incomplete row’s multiplier');
                    expect(text.match(/\?/g) ?? []).toHaveLength(isSolutionView ? 0 : 4);
                    if (isSolutionView) {
                        expect(text).toContain(`${second * 3} ÷ ${second} = 3`);
                        expect(text).toContain(`${row.first * 4} ÷ ${row.first} = 4`);
                        expect(text).toContain(`${row.first} × 3 = ${row.first * 3}`);
                        expect(text).toContain(`${second} × 4 = ${second * 4}`);
                    }
                } else {
                    expect(markup).toContain('>0</text>');
                    expect(markup.match(/<circle\b/g) ?? []).toHaveLength(isSolutionView ? 4 : 0);
                }
                projections++;
            }
        }
        expect(projections).toBe(3456);
    }, 15000);
    it('retains the four existing targets and validates every admitted range selection', async () => {
        const ids = ['5.OA.B.3-graph-pattern-pairs~e639c9f8', '6.RP.A.3a-ratio-coordinate-plotting~480f996f',
            '6.RP.A.3a-ratio-table-construction~8e7d1da7', '6.RP.A.3a-ratio-table-missing-values~e60644ec'];
        const targets = [...gradeFive, ...gradeSix].filter(target => ids.includes(target.id));
        expect(targets).toHaveLength(4);
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map([['ratio-tables', fileURLToPath(new URL('./spec.ts', import.meta.url))]])),
            loadViewModelCatalog(undefined, undefined, new Map(['ratio-table-construction', 'ratio-table-missing-values',
                'ratio-coordinate-plotting'].map(id => [id, fileURLToPath(new URL(`../../../visuals/views/ratio/${id}/spec.ts`, import.meta.url))])))
        ]);
        const routes = matchTargets(targets, generators, views).tuples;
        expect(routes).toHaveLength(4);
        const producer = new RatioTablesGenerator(), evaluator = createLabelDependencyEvaluator();
        let selections = 0;
        for (const route of routes) {
            const view = views.find(view => view.viewId === route.viewId)!;
            const enumeration = enumerateDependencyAuditSelections(route.plan);
            expect(enumeration.status).toBe('complete');
            expect(enumeration.selections).toHaveLength(4);
            for (const selection of enumeration.selections) {
                const sampleKey = `${route.target.id}#ratio-tables#${route.viewId}#train#question#inst:0`, seed = 41;
                const replay = {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(route.plan, selection.choices)};
                const input = {generatorSchema: producer.schema, viewSchema: view.schema, plan: route.plan,
                    sampleKey, seed, attempt: 1, replay};
                expect(extractConfig(producer.schema, selection.labels).config)
                    .toEqual(resolvePlannedConfigurations(input).generatorConfig);
                const draw = generatePlannedDraw({...input, generator: producer});
                expect(draw.stub).not.toBeNull();
                expect(generatePlannedDraw({...input, generator: producer})).toEqual(draw);
                const assessed = evaluator.evaluate(selection.labels);
                expect(assessed.errors).toEqual([]);
                expect(assessed.conflicts).toEqual([]);
                expect(assessed.assessments.filter(item => item.status === 'missing')).toEqual([]);
                selections++;
            }
        }
        expect(selections).toBe(16);
    });
});
