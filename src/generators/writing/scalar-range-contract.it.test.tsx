import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Ability, Area, Scope} from 'edugraph-ts';
import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {loadGeneratorCatalog, loadViewCatalog, type GeneratorCatalogEntry, type ViewCatalogEntry} from '../../lib/generation.ts';
import {resolveDependencyAuditAnnotation} from '../../lib/label-dependency-annotation-resolution.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {matchTargets, type MatchTuple} from '../../lib/matching.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import * as rng from '../../lib/random.ts';
import {loadMatchingTargets} from '../../lib/spec-validator.ts';
import {extractConfig} from '../../lib/utils.ts';
import type {PreparedViewConfiguration} from '../../types/generation-plan.ts';
import type {RenderPayload} from '../../types/ml-engine.ts';
import type {WholeNumberPlaceValue, WritingProblem} from '../../types/problems.ts';
import {WritingGenerator} from './generator.ts';
import {nameIntegerInterval} from './range-profile.ts';
import {spec, WritingGeneratorSchema as schema, type WritingGeneratorConfig} from './spec.ts';

// The oracle concerns the represented number, never its digits, block counts or chart cells.
const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000] as const;
const notations = [Area.DigitNotation, Area.NumerationWithIntegers, Area.NumberNameNotation] as const;
const cells = thresholds.map((upper, index) => ({upper, lower: index ? thresholds[index - 1]! : 0}));
type Cell = typeof cells[number];
const upperLabel = (upper: number) => `http://edugraph.io/edu/NumbersSmaller${upper}`;
const lowerLabel = (lower: number) => `http://edugraph.io/edu/NumbersLarger${lower}`;
const rangeLabels = (cell: Cell) => [upperLabel(cell.upper), ...(cell.lower ? [lowerLabel(cell.lower)] : [])];
const rangeFor = (cell: Cell) => ({min: cell.lower, max: cell.upper,
    maximumAbove: cell.lower || -1, minimumBelow: cell.lower ? cell.upper : 5});
function scalarBand(number: number) {
    const upper = thresholds.find(threshold => number <= threshold);
    const lower = [...thresholds].reverse().find(threshold => number >= threshold) ?? 0;
    return {upper, lower};
}
const placeNames = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions'] as const;
const exponents = [0, 1, 2, 3, 4, 5, 6] as const;
const shownNumeral = (number: number) => number > 1000 ? String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(number);
function dataFor(number: number): WritingProblem {
    if (number <= 1000) return {number};
    const digits = String(number).split('');
    const placeValues: WholeNumberPlaceValue[] = digits.map((digit, index) => {
        const exponent = exponents[digits.length - index - 1]!;
        return {exponent, name: placeNames[exponent]!, digit: Number(digit), value: Number(digit) * 10 ** exponent};
    });
    return {number, placeValues};
}

const consumers = [
    {viewId: 'numbers-write-stroke', exported: 'NumbersWriteStroke', area: Area.DigitNotation,
        ability: Ability.VisualArticulation, capacity: 1000, routes: 9,
        examples: [0, 1, 4, 6, 11, 19, 21, 99, 101, 119, 120, 321, 999, 1000]},
    {viewId: 'numbers-write-count', exported: 'NumbersWriteCount', area: Area.NumerationWithIntegers,
        ability: Ability.Formalization, capacity: 1000, routes: 9,
        examples: [0, 4, 11, 19, 21, 99, 101, 121, 310, 999, 1000]},
    {viewId: 'numbers-write-standard', exported: 'NumbersWriteStandard', area: Area.DigitNotation,
        ability: Ability.VisualArticulation, capacity: 1000000, routes: 13,
        examples: [0, 4, 11, 19, 21, 99, 101, 121, 310, 999, 1000, 1001, 1005, 4205, 999999, 1000000]},
    {viewId: 'numbers-read-standard', exported: 'NumbersReadStandard', area: Area.DigitNotation,
        ability: Ability.TextualReception, capacity: 1000000, routes: 9,
        examples: [0, 4, 11, 19, 21, 99, 101, 121, 310, 999, 1000, 1001, 1005, 4205, 999999, 1000000]},
    {viewId: 'numbers-write-name', exported: 'NumbersWriteName', area: Area.NumberNameNotation,
        ability: Ability.TextualArticulation, capacity: 1000000, routes: 9,
        examples: [0, 4, 11, 19, 21, 99, 101, 121, 310, 999, 1000, 1001, 1005, 4205, 999999, 1000000]}
] as const;
type Consumer = typeof consumers[number];
const lineageCounts = [
    ['K.CC.A.3-write-numerals', 'numbers-write-standard', 4],
    ['K.CC.A.3-write-numerals', 'numbers-write-stroke', 4],
    ['K.CC.A.3-represent-counts', 'numbers-write-count', 4],
    ['1.NBT.A.1-read-numerals', 'numbers-read-standard', 5],
    ['1.NBT.A.1-write-numerals', 'numbers-write-standard', 5],
    ['1.NBT.A.1-write-numerals', 'numbers-write-stroke', 5],
    ['1.NBT.A.1-represent-counts', 'numbers-write-count', 5],
    ['2.NBT.A.3-base-ten-numerals', 'numbers-read-standard', 1],
    ['2.NBT.A.3-base-ten-numerals', 'numbers-write-standard', 1],
    ['2.NBT.A.3-number-names', 'numbers-write-name', 6],
    ['4.NBT.A.2-read-write-base-ten-numerals', 'numbers-read-standard', 3],
    ['4.NBT.A.2-read-write-base-ten-numerals', 'numbers-write-standard', 3],
    ['4.NBT.A.2-write-number-names', 'numbers-write-name', 3]
] as const;
let generator: GeneratorCatalogEntry;
let views: ViewCatalogEntry[];
let tuples: MatchTuple[];
const components = new Map<string, ComponentType<{payload: RenderPayload}>>();
const evaluator = createLabelDependencyEvaluator();

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    const [generators, selectedViews] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map([['writing', resolve(root, 'src/generators/writing/spec.ts')]])),
        loadViewCatalog(undefined, undefined, new Map(consumers.map(({viewId}) =>
            [viewId, resolve(root, `src/visuals/views/numbers/${viewId}/spec.ts`)])))
    ]);
    generator = generators[0]!;
    views = selectedViews;
    tuples = matchTargets(await loadMatchingTargets('ccss'), generators, views).tuples;
    for (const consumer of consumers) {
        const module = await import(`../../visuals/views/numbers/${consumer.viewId}/view.tsx`);
        components.set(consumer.viewId, module[consumer.exported]);
    }
});
afterAll(() => vi.unstubAllGlobals());

function render(consumer: Consumer, data: WritingProblem, solution: boolean,
                preparedView?: PreparedViewConfiguration, labels: string[] = []): string {
    const payload: RenderPayload = {viewId: consumer.viewId, seed: 37, targetLabels: [], isSolutionView: solution,
        problem: {type: 'writing', data, labels}, preparedView: preparedView ?? {version: 1, viewId: consumer.viewId,
            planHash: 'scalar-renderer-contract', variantHash: 'empty', config: {}, labels: [], randomState: 1}};
    return renderToStaticMarkup(createElement(components.get(consumer.viewId)!, {payload}));
}

describe('shared writing represented-scalar range contract', () => {
    it.each(notations)('retains every nonthreshold positive integer through one million for %s', notation => {
        const actual = cells.map(cell => {
            const labels = [notation, Scope.NumbersWithoutZero, ...rangeLabels(cell)];
            const config = extractConfig(schema, labels).config;
            expect(config).toEqual({notationFamily: notation, requireZero: false, range: rangeFor(cell)});
            const interval = nameIntegerInterval(config.range!, false);
            expect(interval).toEqual([cell.lower + 1, cell.upper - 1]);
            return interval;
        });
        const covered = new Uint8Array(1000001);
        let duplicate = false, retained = 0;
        for (const [first, last] of actual) for (let number = first; number <= last; number++) {
            if (covered[number]) duplicate = true;
            covered[number] = 1;
            retained++;
        }
        const retired = [];
        for (let number = 1; number <= 1000000; number++) if (!covered[number]) retired.push(number);
        expect(duplicate).toBe(false);
        expect(retained).toBe(999991);
        expect(retired).toEqual(thresholds);
        expect(covered[0]).toBe(0);
    });

    it.each(cells)('samples the complete scalar interval $lower/$upper uniformly with one draw for every notation', cell => {
        const first = cell.lower + 1, size = cell.upper - first;
        const offsets = [...new Set([0, 1, Math.floor(size / 2), size - 2, size - 1])].filter(index => index >= 0 && index < size);
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const notation of notations) for (const offset of offsets) {
                const config = extractConfig(schema, [notation, Scope.NumbersWithoutZero, ...rangeLabels(cell)]).config;
                draw.mockReset().mockReturnValue((offset + 0.5) / size);
                const actual = new WritingGenerator().generate(config);
                expect(actual?.data).toEqual(dataFor(first + offset));
                expect(scalarBand(actual!.data.number)).toEqual(cell);
                expect(draw).toHaveBeenCalledTimes(1);
            }
        } finally {draw.mockRestore();}
        for (const notation of notations) {
            const config = {notationFamily: notation, requireZero: false, range: rangeFor(cell)};
            rng.setSeed(`${notation}:${cell.upper}`);
            rng.random();
            const continuation = rng.getRandomState();
            rng.setSeed(`${notation}:${cell.upper}`);
            expect(new WritingGenerator().generate(config)).not.toBeNull();
            expect(rng.getRandomState()).toBe(continuation);
        }
    });

    it('retains the exact thirteen target/view lineages and all forty-nine one-selection routes', () => {
        expect(generator.generatorId).toBe('writing');
        expect(generator.problemType).toBe('WritingProblem');
        expect(views.map(view => view.problemType)).toEqual(Array(5).fill('WritingProblem'));
        expect(tuples).toHaveLength(49);
        for (const [prefix, viewId, count] of lineageCounts)
            expect(tuples.filter(tuple => tuple.target.id.startsWith(`${prefix}~`) && tuple.viewId === viewId)).toHaveLength(count);
        expect(tuples.every(tuple => lineageCounts.some(([prefix, viewId]) =>
            tuple.target.id.startsWith(`${prefix}~`) && tuple.viewId === viewId))).toBe(true);
        let positives = 0, names = 0, zeros = 0;
        for (const tuple of tuples) {
            const result = enumerateDependencyAuditSelections(tuple.plan);
            expect(result.status).toBe('complete');
            expect(result.selections).toHaveLength(1);
            const labels = result.selections[0]!.labels;
            if (labels.includes(Scope.NumbersWithZero)) zeros++;
            else if (labels.includes(Area.NumberNameNotation)) names++;
            else positives++;
        }
        expect({positives, names, zeros}).toEqual({positives: 37, names: 9, zeros: 3});
    });

    it.each(consumers)('resolves, directly generates and replays all $routes current $viewId source routes', consumer => {
        const routes = tuples.filter(tuple => tuple.viewId === consumer.viewId);
        expect(routes).toHaveLength(consumer.routes);
        const view = views.find(entry => entry.viewId === consumer.viewId)!;
        for (const tuple of routes) for (const selection of enumerateDependencyAuditSelections(tuple.plan).selections) {
            const annotation = resolveDependencyAuditAnnotation({id: selection.variantHash, plan: tuple.plan, selection,
                generator: {schema, spec}, view: {schema: view.schema, spec: view.spec}});
            expect(annotation.annotationResolution.status).toBe('not_required');
            const evaluated = evaluator.evaluate(annotation.labels);
            expect(evaluated.errors).toEqual([]);
            expect(evaluated.conflicts).toEqual([]);
            expect(evaluated.assessments.filter(item => item.status === 'missing')).toEqual([]);
            for (const seed of [0, 7, 37, 82]) {
                const sampleKey = `${tuple.target.id}#writing#${view.viewId}#train#question#inst:0`;
                const input = {generator: generator.generator, generatorSpec: spec, viewSpec: view.spec,
                    viewSchema: view.schema, plan: tuple.plan, sampleKey, seed, attempt: 1,
                    replay: {version: 1 as const, sampleKey, seed, attempt: 1,
                        selection: createGenerationSelectionReceipt(tuple.plan, selection.choices)}};
                const resolved = resolvePlannedConfigurations({...input, generatorSchema: schema});
                const config = resolved.generatorConfig as WritingGeneratorConfig;
                const directConfig = extractConfig(schema, resolved.generatorLabels, {spec, owner: 'generator'});
                expect(directConfig.config).toEqual(config);
                rng.setRandomState(resolved.generatorRandomState);
                const direct = generator.generator.generate(config), continuation = rng.getRandomState();
                const drawn = generatePlannedDraw(input);
                expect(drawn.stub).toEqual({...direct, labels: resolved.generatorLabels});
                expect(drawn.labels).toEqual(annotation.labels);
                expect(rng.getRandomState()).toBe(continuation);
                expect(generatePlannedDraw(input)).toEqual(drawn);
                expect(rng.getRandomState()).toBe(continuation);
                const number = (drawn.stub!.data as WritingProblem).number;
                expect(drawn.stub!.data).toEqual(dataFor(number));
                const band = scalarBand(number);
                if (config.requireZero) {
                    expect(number).toBe(0);
                    expect(config.range).toEqual({min: 0, max: 5});
                    expect(band).toEqual({upper: 5, lower: 0});
                } else {
                    const cell = cells.find(entry => entry.upper === band.upper && entry.lower === band.lower);
                    expect(cell).toBeDefined();
                    expect(rangeFor(cell!)).toEqual(config.range);
                }
                expect(number === 0).toBe(config.requireZero);
                expect(resolved.generatorLabels).toContain(number === 0 ? Scope.NumbersWithZero : Scope.NumbersWithoutZero);
                expect(number).toBeLessThanOrEqual(consumer.capacity);
                expect(continuation).toBe(config.requireZero ? resolved.generatorRandomState
                    : (resolved.generatorRandomState + 0x6D2B79F5) >>> 0);
                if (seed === 37) for (const solution of [false, true])
                    expect(render(consumer, drawn.stub!.data, solution, resolved.view, drawn.labels))
                        .not.toMatch(/data-view-error|NaN|undefined/);
            }
        }
    });

    it.each(consumers)('keeps all valid positive bands and renderer capacities for $viewId', consumer => {
        const view = views.find(entry => entry.viewId === consumer.viewId)!;
        for (const cell of cells) {
            const target = {id: `future-scalar-${consumer.viewId}-${cell.upper}`,
                labels: [consumer.area, consumer.ability, Scope.NumbersWithoutZero, ...rangeLabels(cell)]};
            const routes = matchTargets([target], [generator], [view]).tuples;
            const excludedByOriginalTarget = consumer.viewId === 'numbers-write-stroke' && cell.lower >= 120;
            expect(routes.length > 0).toBe(cell.upper <= consumer.capacity && !excludedByOriginalTarget);
            if (routes[0]) expect(enumerateDependencyAuditSelections(routes[0].plan).selections).toHaveLength(1);
        }
    });

    it.each(consumers.slice(0, 2))('restricts unbounded positive completion but preserves explicit zero for $viewId', consumer => {
        const view = views.find(entry => entry.viewId === consumer.viewId)!;
        const positive = {id: `unbounded-positive-${consumer.viewId}`,
            labels: [consumer.area, consumer.ability, Scope.NumbersWithoutZero]};
        const positiveTuple = matchTargets([positive], [generator], [view]).tuples[0];
        expect(positiveTuple).toBeDefined();
        const completions = enumerateDependencyAuditSelections(positiveTuple!.plan).selections;
        expect(completions).toHaveLength(6);
        expect(completions.every(selection => selection.labels.some(label => cells
            .filter(cell => cell.upper <= consumer.capacity).map(cell => upperLabel(cell.upper)).includes(label)))).toBe(true);
        for (const bound of [undefined, Scope.NumbersSmaller1000000]) {
            const target = {id: `explicit-zero-${consumer.viewId}-${bound ?? 'none'}`,
                labels: [consumer.area, consumer.ability, Scope.NumbersWithZero, ...(bound ? [bound] : [])]};
            const tuple = matchTargets([target], [generator], [view]).tuples[0];
            if (consumer.viewId === 'numbers-write-stroke' && bound) {
                expect(tuple).toBeUndefined(); // Original target policy still rejects this explicit upper.
                continue;
            }
            expect(tuple).toBeDefined();
            const sampleKey = `${target.id}#writing#${view.viewId}#train#question#inst:0`;
            const resolved = resolvePlannedConfigurations({generatorSchema: schema, viewSchema: view.schema,
                generatorSpec: spec, viewSpec: view.spec, plan: tuple!.plan, sampleKey, seed: 37, attempt: 1});
            rng.setRandomState(resolved.generatorRandomState);
            expect(new WritingGenerator().generate(resolved.generatorConfig)).toEqual({data: {number: 0}});
            expect(rng.getRandomState()).toBe(resolved.generatorRandomState);
        }
    });

    it('retains the original Stroke target participation boundary and other shared scalar consumers', () => {
        const stroke = views.find(view => view.viewId === 'numbers-write-stroke')!;
        const standard = views.find(view => view.viewId === 'numbers-write-standard')!;
        const target = {id: 'existing-stroke-target-boundary', labels: [Area.DigitNotation, Ability.VisualArticulation,
            Scope.NumbersWithoutZero, Scope.NumbersLarger120, Scope.NumbersSmaller1000]};
        expect(matchTargets([target], [generator], [stroke]).tuples).toEqual([]);
        expect(matchTargets([{...target, labels: target.labels.filter(label => label !== Scope.NumbersLarger120)}],
            [generator], [stroke]).tuples).toEqual([]);
        expect(matchTargets([target], [generator], [standard]).tuples).toHaveLength(1);
        for (const viewId of ['numbers-read-standard', 'numbers-write-name']) {
            const consumer = consumers.find(entry => entry.viewId === viewId)!;
            const view = views.find(entry => entry.viewId === viewId)!;
            for (const notation of notations) expect(matchTargets([{id: `${viewId}-${notation}`,
                labels: [notation, consumer.ability, Scope.NumbersWithoutZero, Scope.NumbersLarger1000, Scope.NumbersSmaller10000]}],
            [generator], [view]).tuples).toHaveLength(1);
        }
    });

    it('keeps an unqualified Stroke request with an admitted upper1000 completion and unchanged tracing task', () => {
        const consumer = consumers[0], view = views.find(entry => entry.viewId === consumer.viewId)!;
        const target = {id: 'unqualified-stroke', labels: [Area.DigitNotation, Ability.VisualArticulation,
            Scope.NumbersWithoutZero]};
        const tuple = matchTargets([target], [generator], [view]).tuples[0];
        expect(tuple).toBeDefined();
        const enumeration = enumerateDependencyAuditSelections(tuple!.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(6);
        const selection = enumeration.selections.find(entry => entry.labels.includes(Scope.NumbersSmaller1000))!;
        expect(selection).toBeDefined();
        const sampleKey = `${target.id}#writing#${consumer.viewId}#train#question#inst:0`;
        const resolved = resolvePlannedConfigurations({generatorSchema: schema, viewSchema: view.schema,
            generatorSpec: spec, viewSpec: view.spec, plan: tuple!.plan, sampleKey, seed: 37, attempt: 1,
            replay: {version: 1, sampleKey, seed: 37, attempt: 1,
                selection: createGenerationSelectionReceipt(tuple!.plan, selection.choices)}});
        expect(resolved.generatorConfig).toEqual({notationFamily: Area.DigitNotation,
            requireZero: false, range: {min: 120, max: 1000, maximumAbove: 120, minimumBelow: 1000}});
        expect(resolved.generatorLabels).toContain(Scope.NumbersLarger120);
        const draw = vi.spyOn(rng, 'random').mockReturnValue((321 - 121 + 0.5) / 879);
        let data: WritingProblem;
        try {data = new WritingGenerator().generate(resolved.generatorConfig)!.data;} finally {draw.mockRestore();}
        expect(data).toEqual({number: 321});
        const question = render(consumer, data, false, resolved.view, resolved.labels);
        const solution = render(consumer, data, true, resolved.view, resolved.labels);
        expect(question).toContain('Trace');
        expect(question).toContain('>321<');
        expect(question).toContain('Write');
        expect(question).not.toContain('text-emerald-700');
        expect(solution).toContain('text-emerald-700');
        expect(solution.match(/>321</g)).toHaveLength(3);
    });

    it.each(consumers)('preserves legacy and place-value rendering branches in both modes for $viewId', consumer => {
        for (const number of consumer.examples) {
            const question = render(consumer, dataFor(number), false), solution = render(consumer, dataFor(number), true);
            expect(question).not.toMatch(/data-view-error|NaN|undefined/);
            expect(solution).not.toMatch(/data-view-error|NaN|undefined/);
            expect(question).not.toBe(solution);
            if (consumer.viewId === 'numbers-write-count') {
                expect(question).toContain('Count:');
                expect(question).not.toContain(`>${number}<`);
                expect(solution).toContain(`>${number}<`);
            } else if (consumer.viewId === 'numbers-write-stroke') {
                expect(question).toContain('Trace');
                expect(question).toContain(`>${number}<`);
                expect(solution).toContain('text-emerald-700');
            } else if (consumer.viewId === 'numbers-write-standard') {
                expect(question).toContain(number > 1000 ? 'Write the number name as a base-ten numeral.'
                    : number === 0 ? 'Write the numeral.' : 'Write the numeral represented by');
                if (number > 1000) {
                    expect(question).not.toContain(`>${shownNumeral(number)}<`);
                    expect(solution).toContain(`>${shownNumeral(number)}<`);
                }
            } else {
                expect(question).toContain(consumer.viewId === 'numbers-write-name' ? 'words.' : number > 1000
                    ? 'Read the base-ten numeral' : number > 120 ? 'Read this numeral' : 'Read this number aloud.');
                expect(question).toContain(`>${shownNumeral(number)}<`);
            }
        }
    });

    it.each([{number: 310, upper: 1000, lower: 120, name: 'three hundred ten'},
        {number: 4205, upper: 10000, lower: 1000, name: 'four thousand two hundred five'}])(
        'uses scalar $number despite a written zero and smaller representation parts', ({number, upper, lower, name}) => {
            const cell = cells.find(entry => entry.upper === upper)!;
            const labels = [Area.DigitNotation, Scope.NumbersWithoutZero, ...rangeLabels(cell)];
            const config = extractConfig(schema, labels).config;
            const draw = vi.spyOn(rng, 'random').mockReturnValue((number - lower - 0.5) / (upper - lower - 1));
            let data: WritingProblem;
            try {data = new WritingGenerator().generate(config)!.data;} finally {draw.mockRestore();}
            expect(data).toEqual(dataFor(number));
            expect(String(data.number)).toContain('0');
            expect(scalarBand(data.number)).toEqual({upper, lower});
            for (const consumer of consumers.filter(entry => entry.capacity >= number)) {
                const question = render(consumer, data, false, undefined, labels);
                const solution = render(consumer, data, true, undefined, labels);
                if (consumer.viewId === 'numbers-write-count') {
                    expect(question).toContain('3 hundreds');
                    expect(question).toContain('1 tens');
                    expect(question).not.toContain('0 ones');
                    expect(question).not.toContain('>310<');
                    expect(solution).toContain('>310<');
                } else if (consumer.viewId === 'numbers-read-standard' || consumer.viewId === 'numbers-write-name') {
                    expect(question).not.toContain(name);
                    expect(solution).toContain(name);
                }
                expect(config.requireZero).toBe(false);
                expect(labels).toContain(Scope.NumbersWithoutZero);
            }
        });
});
