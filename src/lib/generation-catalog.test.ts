import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {computeSampleKey, generateSampleByKey, generateTargetSamples, loadGeneratorCatalog, loadViewCatalog,
    matchTargets} from './generation.ts';
import {createWorkCounters} from './work-counters.ts';
import {generateWithLabels} from './utils.ts';
import {Scope} from 'edugraph-ts/generated';

const roots: string[] = [];

function write(path: string, content: string): void {
    mkdirSync(resolve(path, '..'), {recursive: true});
    writeFileSync(path, content, 'utf-8');
}

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, {recursive: true, force: true});
});

describe('selected generation catalogs', () => {
    it('preserves inferred annotations through public sample replay and target diagnostics', async () => {
        mkdirSync(resolve('temp'), {recursive: true});
        const root = mkdtempSync(resolve('temp', 'inferred-replay-'));
        roots.push(root);
        const generatorsRoot = resolve(root, 'generators');
        const viewsRoot = resolve(root, 'views');
        const specRoot = resolve(root, 'spec');
        write(resolve(generatorsRoot, 'demo', 'generator.ts'), `
            import {DemoGeneratorSchema} from './spec.ts';
            interface ProblemGenerator<T> {}
            interface CountingProblem {count: number}
            export class DemoGenerator implements ProblemGenerator<CountingProblem> {
                type = 'arithmetic'; schema = DemoGeneratorSchema;
                generate(config) { return {data: {count: config.count}}; }
            }
        `);
        write(resolve(generatorsRoot, 'demo', 'spec.ts'), `
            export const DemoGeneratorSchema = {
                count: Object.assign(() => 2, {ontologyNeutral: true})
            };
            export const spec = {generatorId: 'demo', generalLabels: ['${Scope.NumbersWithoutZero}'],
                inferredLabels: [{produces: ['${Scope.IntegerNumbers}'],
                    infer: config => config.count === 2 ? ['${Scope.IntegerNumbers}'] : []}]};
        `);
        write(resolve(viewsRoot, 'counting-objects-simple', 'view.tsx'), 'export const unused = true;');
        write(resolve(viewsRoot, 'counting-objects-simple', 'spec.ts'), `
            export const CountingObjectsSimpleViewSchema = {
                notation: Object.assign(() => 'arabic', {ontologyNeutral: true})
            };
            export const spec = {viewId: 'counting-objects-simple', generalLabels: [],
                inferredLabels: [{produces: ['${Scope.ArabicNumerals}'],
                    infer: config => config.notation === 'arabic' ? ['${Scope.ArabicNumerals}'] : []}]};
        `);
        const target = {id: 'inferred-replay', labels: [Scope.NumbersWithoutZero]};
        write(resolve(specRoot, 'demo.ts'), `export const spec = ${JSON.stringify([target])};`);
        const [generators, views] = await Promise.all([
            loadGeneratorCatalog(generatorsRoot), loadViewCatalog(viewsRoot)
        ]);
        expect(generators[0].labels).toEqual(target.labels);
        expect(views[0].supportedLabels).toEqual([]);
        expect(matchTargets([{...target, labels: [Scope.IntegerNumbers]}], generators, views).tuples).toEqual([]);
        const diagnostics = generateTargetSamples(target, generators, views, {valRatio: 0});
        expect(diagnostics).toHaveLength(2);
        const expectedLabels = [...target.labels, Scope.IntegerNumbers, Scope.ArabicNumerals].sort();
        for (const sample of diagnostics) {
            expect(sample.error).toBeNull();
            expect(sample.stub?.data).toEqual({count: 2});
            expect(sample.labels).toEqual(expectedLabels);
            expect(sample.preparedView?.config).toEqual({notation: 'arabic'});
            expect(sample.preparedView?.labels).toEqual([Scope.ArabicNumerals]);
            const replayed = await generateSampleByKey({sampleKey: sample.sampleKey, attempt: sample.attempt,
                specName: 'demo', specRoot, generatorsRoot, viewsRoot,
                replay: sample.replay, recordedPlan: sample.plan});
            expect(replayed.stub).toEqual(sample.stub);
            expect(replayed.labels).toEqual(sample.labels);
            expect(replayed.preparedView).toEqual(sample.preparedView);
            expect(replayed.replay).toEqual(sample.replay);
        }
        const question = diagnostics[0];
        const solutionKey = computeSampleKey({...question.identity, mode: 'solution'});
        const reused = await generateSampleByKey({sampleKey: solutionKey, attempt: 1,
            specName: 'demo', specRoot, generatorsRoot, viewsRoot,
            replay: question.replay, recordedPlan: question.plan});
        expect(reused.stub).toEqual(question.stub);
        expect(reused.labels).toEqual(question.labels);
        expect(reused.preparedView).toEqual(question.preparedView);
        expect(reused.replay).toEqual(question.replay);
    });

    it('binds inference metadata to instances without adding matching capabilities or changing their methods', async () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-inference-catalog-'));
        roots.push(root);
        const entry = resolve(root, 'demo', 'generator.ts');
        write(entry, `
            interface ProblemGenerator<T> {}
            interface DemoProblem {count: number}
            export class DemoGenerator implements ProblemGenerator<DemoProblem> {
                type = 'arithmetic'; schema = {}; #count = 1;
                generate() { return {data: {count: this.#count}}; }
            }
        `);
        write(resolve(root, 'demo', 'spec.ts'), `
            export const spec = {generatorId: 'demo', generalLabels: [], inferredLabels: [{
                produces: ['${Scope.IntegerNumbers}'], infer: () => ['${Scope.IntegerNumbers}']
            }]};
            export const DemoGeneratorSchema = {};
        `);
        const [loaded] = await loadGeneratorCatalog(root, undefined, new Map([['demo', entry]]));
        expect(loaded.generator.spec).toBe(loaded.spec);
        expect(loaded.labels).toEqual([]);
        expect(loaded.generalLabels).toEqual([]);
        expect(generateWithLabels(loaded.generator, [])).toEqual({data: {count: 1}, labels: [Scope.IntegerNumbers]});
        expect(loaded.generator.generate({})).toEqual({data: {count: 1}});
    });
    it('loads recorded module entries without discovering unrelated modules', async () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-selected-catalog-'));
        roots.push(root);
        const generatorsRoot = resolve(root, 'generators');
        const viewsRoot = resolve(root, 'views');
        const generatorEntry = resolve(generatorsRoot, 'demo', 'generator.ts');
        const viewEntry = resolve(viewsRoot, 'demo-view', 'view.tsx');
        write(generatorEntry, `
            interface ProblemGenerator<T> {}
            interface DemoProblem {}
            export class DemoGenerator implements ProblemGenerator<DemoProblem> {}
        `);
        write(resolve(generatorsRoot, 'demo', 'spec.ts'), `
            export const spec = {generalLabels: []};
            export const DemoGeneratorSchema = {};
        `);
        write(resolve(generatorsRoot, 'unrelated', 'spec.ts'), `throw new Error('must not import');`);
        write(viewEntry, 'export const unused = true;');
        write(resolve(viewsRoot, 'demo-view', 'spec.ts'), `
            export const spec = {viewId: 'demo-view', generalLabels: []};
            export const DemoViewViewSchema = {};
        `);
        write(resolve(viewsRoot, 'unrelated', 'spec.ts'), `throw new Error('must not import');`);
        const counters = createWorkCounters();

        const [generators, views] = await Promise.all([
            loadGeneratorCatalog(generatorsRoot, counters, new Map([['demo', generatorEntry]])),
            loadViewCatalog(viewsRoot, counters, new Map([['demo-view', viewEntry]]))
        ]);

        expect(generators.map(entry => entry.generatorId)).toEqual(['demo']);
        expect(views.map(entry => entry.viewId)).toEqual(['demo-view']);
        expect(counters.get('catalog.generator_modules')).toBe(1);
        expect(counters.get('catalog.view_modules')).toBe(1);
    });
});
