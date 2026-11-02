import {fileURLToPath} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {matchTargets} from '../../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../../lib/model-catalog.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {spec as gradeTwo} from '../../../spec/ccss/grade-02.ts';
import {HundredsBundlesRenderer} from '../../../visuals/views/place-value/hundreds-bundles-renderer.tsx';
import {PlaceValueHundredsBundlesGenerator} from './generator.ts';
import {hundredsBundleRangeProfiles, hundredsBundleRows} from './numeric-domain.ts';

describe('hundred flats and ten-tens model contracts', () => {
    it('preserves all10 original payloads across both branches of both actual renderers', () => {
        const original = [{hundreds: 1, tens: 10, ones: 0, target: 100},
            ...Array.from({length: 9}, (_, index) => ({hundreds: index + 1, tens: 0, ones: 0, target: (index + 1) * 100}))];
        const current = [false, true].flatMap(regrouping => hundredsBundleRangeProfiles.flatMap(({range}) =>
            hundredsBundleRows(range, regrouping)));
        expect(current).toHaveLength(10);
        let projections = 0;
        for (const data of original) {
            const retained = current.find(row => row.hundreds === data.hundreds && row.tens === data.tens)!;
            expect(retained).toEqual(data);
            for (const task of ['completion', 'explanation'] as const) for (const isSolutionView of [false, true]) {
                const render = (row: typeof retained) => renderToStaticMarkup(<HundredsBundlesRenderer viewId="place-value-hundreds-bundles"
                    data={row} task={task} isSolutionView={isSolutionView} />);
                const markup = render(retained);
                expect(markup).toBe(render(data as typeof retained));
                expect(markup).not.toMatch(/NaN|undefined/);
                if (data.tens === 10) expect(markup).toContain('1 hundred');
                else expect(markup).toContain(`${data.hundreds} ${data.hundreds === 1 ? 'hundred' : 'hundreds'}`);
                projections++;
            }
        }
        expect(projections).toBe(40);
    });
    it('keeps all source competencies and validates every resolved model/range binding', async () => {
        const targets = gradeTwo.filter(target => target.id.startsWith('2.NBT.A.1a-ten-tens-make-hundred~')
            || target.id.startsWith('2.NBT.A.1b-hundreds~'));
        expect(targets).toHaveLength(6);
        const [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map([['place-value-hundreds-bundles',
                fileURLToPath(new URL('./spec.ts', import.meta.url))]])),
            loadViewModelCatalog(undefined, undefined, new Map(['place-value-hundreds-bundles', 'place-value-hundreds-bundles-explanation'].map(id =>
                [id, fileURLToPath(new URL(`../../../visuals/views/place-value/${id}/spec.ts`, import.meta.url))])))
        ]);
        const routes = matchTargets(targets, generators, views).tuples;
        expect(routes).toHaveLength(6);
        const generator = new PlaceValueHundredsBundlesGenerator(), evaluator = createLabelDependencyEvaluator(),
            flatValues = new Set<number>(), regroupedValues = new Set<number>();
        let selections = 0;
        for (const route of routes) {
            const view = views.find(view => view.viewId === route.viewId)!;
            const enumeration = enumerateDependencyAuditSelections(route.plan);
            expect(enumeration.status).toBe('complete');
            for (const selection of enumeration.selections) {
                const sampleKey = `${route.target.id}#place-value-hundreds-bundles#${route.viewId}#train#question#inst:0`, seed = 41;
                const replay = {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(route.plan, selection.choices)};
                const input = {generatorSchema: generator.schema, viewSchema: view.schema, plan: route.plan, sampleKey, seed, attempt: 1, replay};
                const resolved = resolvePlannedConfigurations(input), direct = extractConfig(generator.schema, selection.labels).config;
                expect(direct).toEqual(resolved.generatorConfig);
                expect(direct.requireRegrouping).toBe(route.target.id.startsWith('2.NBT.A.1a-'));
                const draw = generatePlannedDraw({...input, generator});
                expect(draw.stub).not.toBeNull();
                expect(generatePlannedDraw({...input, generator})).toEqual(draw);
                const evaluated = evaluator.evaluate(selection.labels);
                expect(evaluated.errors).toEqual([]);
                expect(evaluated.conflicts).toEqual([]);
                expect(evaluated.assessments.filter(item => item.status === 'missing')).toEqual([]);
                for (const row of hundredsBundleRows(direct.range!, direct.requireRegrouping!))
                    (direct.requireRegrouping ? regroupedValues : flatValues).add(row.target);
                if (direct.requireRegrouping) {
                    expect(selection.labels).toContain(Area.IntegerRegrouping);
                    expect(selection.labels).not.toContain(Scope.NumbersLarger5);
                }
                selections++;
            }
        }
        expect(selections).toBe(8);
        expect([...flatValues].sort((a, b) => a - b)).toEqual([100,200,300,400,500,600,700,800,900]);
        expect([...regroupedValues]).toEqual([100]);
    });
});
