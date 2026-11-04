import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Ability, Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {loadGeneratorCatalog, loadViewCatalog, type GeneratorCatalogEntry, type ViewCatalogEntry} from '../../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {matchTarget, matchTargets, type MatchTuple} from '../../../lib/matching.ts';
import {bindingsForSelection, generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import * as rng from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {loadMatchingTargets} from '../../../lib/spec-validator.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import type {PreparedViewConfiguration} from '../../../types/generation-plan.ts';
import type {RenderPayload} from '../../../types/ml-engine.ts';
import type {StandardMultiplicationProblem} from '../../../types/problems.ts';
import {standardMultiplicationDomain, standardMultiplicationMultipliers, standardMultiplicationPairWeight,
    type StandardMultiplicationRange} from './domain.ts';
import {buildStandardMultiplicationProblem, StandardAlgorithmMultiplicationGenerator} from './generator.ts';
import {spec, StandardAlgorithmMultiplicationGeneratorSchema as schema} from './spec.ts';

const generatorId = 'standard-algorithm-multiplication';
const viewId = 'operations-multiplication-standard-algorithm';
const sourceId = '5.NBT.B.5-multiplication-standard-algorithm~71786b7e';
const upperLabel = (upper: number) => `http://edugraph.io/edu/NumbersSmaller${upper}`;
const profiles = [
    {upper: 1000, previous: 120, examples: [[12, 17], [40, 25]]},
    {upper: 10000, previous: 1000, examples: [[43, 25], [400, 25]]},
    {upper: 100000, previous: 10000, examples: [[401, 25], [4000, 25]]},
    {upper: 1000000, previous: 100000, examples: [[4001, 25], [4000, 250]]},
    {upper: false, previous: 1000000, examples: [[4001, 250], [9999, 999]]}
] as const;
type Profile = typeof profiles[number];
const rangeFor = (profile: Profile): StandardMultiplicationRange => profile.upper === false ? false
    : {min: 0, max: profile.upper, maximumAbove: profile.previous, minimumBelow: 5};
const profileContains = (profile: Profile, product: number) => product > profile.previous
    && (profile.upper === false || product <= profile.upper);
const numeral = (number: number) => String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const visible = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const digits = (number: number) => String(number).split('').reverse().map(Number);

/** Compute the prescribed arithmetic independently of production payload/quantity helpers. */
function mathematics(a: number, b: number) {
    const product = Number(BigInt(a) * BigInt(b));
    const quantities = [a, b, product];
    const multiplicationEquations: string[] = [], sumEquations: string[] = [];
    let multiplicationCarry = false, additionCarry = false;
    const rows = digits(b).map((factor, shift) => {
        let carry = 0;
        for (const digit of digits(a)) {
            const working = digit * factor + carry;
            quantities.push(digit, factor, working);
            if (carry > 0) quantities.push(carry);
            multiplicationEquations.push(`${digit} × ${factor}${carry > 0 ? ` + ${carry}` : ''} = ${working}`);
            carry = Math.trunc(working / 10);
            if (carry > 0) {multiplicationCarry = true; quantities.push(carry);}
        }
        const unshifted = Number(BigInt(a) * BigInt(factor)), aligned = unshifted * 10 ** shift;
        quantities.push(unshifted, aligned);
        // Nulls above the represented row are absent cells; shift zeros are actual sum operands.
        return {unshifted, aligned, places: digits(unshifted).length + shift};
    });
    let carry = 0;
    for (let place = 0; place < digits(product).length; place++) {
        const terms = rows.filter(row => place < row.places).map(row => digits(row.aligned)[place] ?? 0);
        const operands = [...terms, ...(carry > 0 ? [carry] : [])];
        const total = operands.reduce((sum, value) => sum + value, 0);
        quantities.push(...operands, total);
        sumEquations.push(`${operands.join(' + ')} = ${total}`);
        carry = Math.trunc(total / 10);
        if (carry > 0) {additionCarry = true; quantities.push(carry);}
    }
    return {product, rows, quantities, multiplicationEquations, sumEquations, multiplicationCarry, additionCarry};
}

// Integer tickets for the original hierarchy: a width 2/3/4; two general b arms and a0b/ab0 arms.
function nativeWeight(a: number, b: number): number {
    const oracle = mathematics(a, b);
    if (!oracle.multiplicationCarry || !oracle.additionCarry) return 0;
    const topWeight = a < 100 ? 100 : a < 1000 ? 10 : 1;
    const text = String(b), specialZero = text.length === 3
        && ((text[1] === '0' && text[2] !== '0') || (text[1] !== '0' && text[2] === '0'));
    return topWeight * (b < 100 ? 90 : specialZero ? 109 : 9);
}

let generator: GeneratorCatalogEntry, decimalGenerator: GeneratorCatalogEntry;
let view: ViewCatalogEntry, decimalView: ViewCatalogEntry;
let tuple: MatchTuple;
let View: typeof import('../../../visuals/views/operations/operations-multiplication-standard-algorithm/view.tsx')['OperationsMultiplicationStandardAlgorithm'];
const selections = new Map<number | false, ReturnType<typeof enumerateDependencyAuditSelections>['selections'][number]>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const root = fileURLToPath(new URL('../../../../', import.meta.url));
    const [generators, views] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map([generatorId, 'standard-algorithm-decimal-multiplication'].map(id =>
            [id, resolve(root, `src/generators/arithmetic/${id}/spec.ts`)]))),
        loadViewCatalog(undefined, undefined, new Map([viewId, 'operations-decimal-standard-multiplication'].map(id =>
            [id, resolve(root, `src/visuals/views/operations/${id}/spec.ts`)])))
    ]);
    generator = generators.find(entry => entry.generatorId === generatorId)!;
    decimalGenerator = generators.find(entry => entry.generatorId !== generatorId)!;
    view = views.find(entry => entry.viewId === viewId)!;
    decimalView = views.find(entry => entry.viewId !== viewId)!;
});
beforeAll(async () => {
    ({OperationsMultiplicationStandardAlgorithm: View} = await import('../../../visuals/views/operations/operations-multiplication-standard-algorithm/view.tsx'));
});
beforeAll(async () => {
    const routes = matchTargets(await loadMatchingTargets('ccss'), [generator], [view]).tuples;
    expect(routes).toHaveLength(1);
    tuple = routes[0]!;
    for (const selection of enumerateDependencyAuditSelections(tuple.plan).selections) {
        const label = selection.labels.find(label => /\/NumbersSmaller\d+$/.test(label));
        selections.set(label ? Number(label.match(/\d+$/)![0]) : false, selection);
    }
});
// Build each independent finite fixture in its own ordinary hook. Catalog/source setup and
// all five domain builds must not accumulate inside a single setup timeout under coverage.
for (const profile of profiles) beforeAll(() => {standardMultiplicationDomain(rangeFor(profile));});
afterAll(() => vi.unstubAllGlobals());

function render(data: unknown, solution: boolean, configuration?: PreparedViewConfiguration): string {
    const payload: RenderPayload = {viewId, targetLabels: [], seed: 37, isSolutionView: solution,
        problem: {type: 'arithmetic', data, labels: []}, preparedView: configuration ?? {version: 1, viewId,
            planHash: 'whole-multiplication-range', variantHash: 'empty', config: {}, labels: [], randomState: 1}};
    return renderToStaticMarkup(<View payload={payload} />);
}

describe('whole-number standard multiplication ranges and retained overflow', () => {
    it('retains the exact broad source lineage with four labelled selections and one exclusive overflow selection', () => {
        expect(tuple.target.id).toBe(sourceId);
        expect(tuple.generatorId).toBe(generatorId);
        expect(tuple.viewId).toBe(viewId);
        expect(tuple.target.labels.some(label => /\/Numbers(?:Smaller|Larger)/.test(label))).toBe(false);
        const enumeration = enumerateDependencyAuditSelections(tuple.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(5);
        expect([...selections.keys()].sort()).toEqual([false, 1000, 10000, 100000, 1000000].sort());
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(view.schema).toEqual({});
        expect(generator.problemType).toBe('StandardMultiplicationProblem');
        expect(view.problemType).toBe('StandardMultiplicationProblem');
        for (const profile of profiles) {
            const selection = selections.get(profile.upper)!;
            const selectedRanges = selection.labels.filter(label => /\/Numbers(?:Smaller|Larger)/.test(label));
            expect(selectedRanges).toEqual(profile.upper === false ? [] : [upperLabel(profile.upper)]);
            expect(selection.labels).toContain(Scope.NumbersWithZero);
        }
    });

    it.each(profiles)('replays the complete $upper source selection with exact two-draw mathematics', profile => {
        const selection = selections.get(profile.upper)!;
        const receipt = createGenerationSelectionReceipt(tuple.plan, selection.choices);
        const binding = bindingsForSelection(tuple.plan, receipt);
        for (let seed = 0; seed < 24; seed++) {
            const sampleKey = `${sourceId}#${generatorId}#${viewId}#train#question#inst:0`;
            const input = {generator: generator.generator, generatorSpec: spec, viewSpec: view.spec, viewSchema: view.schema,
                plan: tuple.plan, sampleKey, seed, attempt: 1,
                replay: {version: 1 as const, sampleKey, seed, attempt: 1, selection: receipt}};
            const resolved = resolvePlannedConfigurations({...input, generatorSchema: schema});
            expect(resolved.generatorConfig).toEqual({range: rangeFor(profile)});
            expect(resolveSchemaChoices(schema, tuple.target.labels, binding.generator).config).toEqual(resolved.generatorConfig);
            if (profile.upper !== false)
                expect(extractConfig(schema, [upperLabel(profile.upper)]).config).toEqual(resolved.generatorConfig);
            rng.setRandomState(resolved.generatorRandomState);
            const direct = generator.generator.generate(resolved.generatorConfig)!, continuation = rng.getRandomState();
            const planned = generatePlannedDraw(input);
            expect(planned.stub).toEqual({...direct, labels: resolved.generatorLabels});
            expect(rng.getRandomState()).toBe(continuation);
            expect(generatePlannedDraw(input)).toEqual(planned);
            expect(rng.getRandomState()).toBe(continuation);
            rng.setRandomState(resolved.generatorRandomState);
            rng.random(); rng.random();
            expect(rng.getRandomState()).toBe(continuation);
            const data = direct.data as StandardMultiplicationProblem;
            const oracle = mathematics(data.multiplicand, data.multiplier);
            expect(data.product).toBe(oracle.product);
            expect(data.partialRows.map(row => row.unshiftedProduct)).toEqual(oracle.rows.map(row => row.unshifted));
            expect(data.partialRows.map(row => row.alignedProduct)).toEqual(oracle.rows.map(row => row.aligned));
            expect(oracle.multiplicationCarry && oracle.additionCarry).toBe(true);
            expect(Math.min(...oracle.quantities)).toBe(0);
            expect(Math.max(...oracle.quantities)).toBe(data.product);
            expect(profileContains(profile, data.product)).toBe(true);
            if (seed === 7) {
                const question = render(data, false, planned.view), solution = render(data, true, planned.view);
                expect(question).toContain(`${numeral(data.multiplicand)} × ${numeral(data.multiplier)} = ___`);
                expect(question).not.toContain('column-calculations');
                expect(solution).toContain(`${numeral(data.multiplicand)} × ${numeral(data.multiplier)} = ${numeral(data.product)}`);
                expect(solution).not.toContain('Unresolved digit');
            }
        }
    });

    it.each(profiles)('preserves independently weighted native multiplier rows inside $upper', profile => {
        const range = rangeFor(profile), domain = standardMultiplicationDomain(range);
        expect(domain.count).toBeGreaterThan(0);
        expect(domain.weight).toBeGreaterThan(0);
        const selectedRows = [domain.rows[0]!, domain.rows[Math.floor(domain.rows.length / 2)]!, domain.rows.at(-1)!];
        for (const row of selectedRows) {
            const expected: {multiplier: number; weight: number}[] = [];
            const topWeight = row.multiplicand < 100 ? 100 : row.multiplicand < 1000 ? 10 : 1;
            for (let multiplier = 10; multiplier <= 999; multiplier++) {
                if (!profileContains(profile, row.multiplicand * multiplier)) continue;
                const weight = nativeWeight(row.multiplicand, multiplier);
                if (weight) expected.push({multiplier, weight: weight / topWeight});
                expect(standardMultiplicationPairWeight(row.multiplicand, multiplier)).toBe(weight);
            }
            expect(standardMultiplicationMultipliers(row.multiplicand, range)).toEqual(expected);
            expect(row.count).toBe(expected.length);
            expect(row.multiplierWeight).toBe(expected.reduce((sum, entry) => sum + entry.weight, 0));
            expect(row.weight).toBe(row.multiplierWeight * topWeight);
            const selectedEntries = [expected[0]!, expected[Math.floor(expected.length / 2)]!, expected.at(-1)!];
            for (const entry of selectedEntries) {
                const before = expected.slice(0, expected.indexOf(entry)).reduce((sum, item) => sum + item.weight, 0);
                const draw = vi.spyOn(rng, 'random').mockReturnValueOnce((row.cumulativeWeight - row.weight / 2) / domain.weight)
                    .mockReturnValueOnce((before + entry.weight / 2) / row.multiplierWeight);
                try {
                    const data = new StandardAlgorithmMultiplicationGenerator().generate({range}).data;
                    expect([data.multiplicand, data.multiplier]).toEqual([row.multiplicand, entry.multiplier]);
                    expect(draw).toHaveBeenCalledTimes(2);
                } finally {draw.mockRestore();}
            }
        }
    });

    it.each(profiles.filter(profile => profile.upper !== false))('admits the explicit finite upper $upper with the same mathematical contract', profile => {
        const target = {id: `whole-standard-upper-${profile.upper}`, labels: [Area.MultiplicationStandardAlgorithm,
            Scope.IntegerNumbers, Ability.ProcedureExecution, upperLabel(profile.upper)]};
        const routes = matchTargets([target], [generator], [view]).tuples;
        expect(routes).toHaveLength(1);
        const result = enumerateDependencyAuditSelections(routes[0]!.plan);
        expect(result.status).toBe('complete');
        expect(result.selections).toHaveLength(1);
        expect(result.selections[0]!.labels).toContain(upperLabel(profile.upper));
    });

    it('rejects too-small uppers and positive lower descriptors rather than inventing support', () => {
        const base = [Area.MultiplicationStandardAlgorithm, Scope.IntegerNumbers, Ability.ProcedureExecution];
        for (const upper of [5, 10, 20, 100, 120])
            expect(matchTargets([{id: `too-small-${upper}`, labels: [...base, upperLabel(upper)]}], [generator], [view]).tuples).toEqual([]);
        for (const lower of [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000])
            expect(matchTargets([{id: `positive-floor-${lower}`, labels: [...base, upperLabel(1000000),
                `http://edugraph.io/edu/NumbersLarger${lower}`]}], [generator], [view]).tuples).toEqual([]);
    });

    it('preserves the distinct whole/decimal producer-view boundaries and rejects a foreign runtime family', () => {
        expect(matchTarget(tuple.target, generator, decimalView)).toEqual({matched: false, reason: 'incompatible-type'});
        expect(matchTarget(tuple.target, decimalGenerator, view)).toEqual({matched: false, reason: 'incompatible-type'});
        const foreign = {...buildStandardMultiplicationProblem(347, 206), kind: 'decimal-standard-multiplication'};
        for (const solution of [false, true]) expect(() => render(foreign, solution)).toThrow('inconsistent');
    });

    it.each(profiles)('keeps all required arithmetic and threshold/overflow endpoints visible in $upper solutions', profile => {
        for (const [a, b] of profile.examples) {
            const data = buildStandardMultiplicationProblem(a, b), oracle = mathematics(a, b);
            expect(data.product).toBe(oracle.product);
            expect(profileContains(profile, data.product)).toBe(true);
            expect(oracle.multiplicationCarry && oracle.additionCarry).toBe(true);
            expect(Math.min(...oracle.quantities)).toBe(0);
            expect(Math.max(...oracle.quantities)).toBe(data.product);
            const question = render(data, false), solution = render(data, true), text = visible(solution);
            expect(question).not.toMatch(/data-view-error|NaN|undefined/);
            expect(solution).not.toMatch(/data-view-error|NaN|undefined/);
            expect(question).toContain(`${numeral(a)} × ${numeral(b)} = ___`);
            expect(question).not.toContain(numeral(data.product));
            expect(question).toContain('Unresolved digit');
            expect(question).toContain('Unresolved carry');
            expect(question).not.toContain('column-calculations');
            expect(solution).toContain(`${numeral(a)} × ${numeral(b)} = ${numeral(data.product)}`);
            expect(solution).not.toContain('Unresolved digit');
            expect(solution).not.toContain('Unresolved carry');
            for (const equation of [...oracle.multiplicationEquations, ...oracle.sumEquations]) expect(text).toContain(equation);
        }
    });
});
