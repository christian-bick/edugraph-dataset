import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {ReactElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {loadGeneratorCatalog, loadViewCatalog, type GeneratorCatalogEntry, type ViewCatalogEntry} from '../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {buildCompatibleModulePairIndex, matchTarget, matchTargets, type MatchTuple} from '../../lib/matching.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import * as randomModule from '../../lib/random.ts';
import {loadMatchingTargets} from '../../lib/spec-validator.ts';
import type {FractionScaleComparisonProblem, FractionScaleRelationProblem} from '../../types/problems.ts';
import {ViewValidationError} from '../../visuals/helpers/validation.ts';
import {isValidFractionScaleComparison, isValidFractionScaleRelation} from '../../visuals/views/fractions/fraction-scale-comparison-helpers.ts';
import {FractionScaleRelationsGenerator} from './fraction-scale-relations/generator.ts';
import {FractionScalingGenerator} from './fraction-scaling/generator.ts';

const relationId = 'fraction-scale-relations';
const analogyId = 'fraction-scaling';
const comparisonId = 'fractions-scaling-comparison';
const explanationId = 'fractions-scaling-explanation';
const families = [
    {id: relationId, viewId: comparisonId, analogy: false},
    {id: analogyId, viewId: explanationId, analogy: true}
] as const;
const profiles = ['greater', 'less', 'equal'] as const;
type Profile = typeof profiles[number];
type Data = FractionScaleComparisonProblem | FractionScaleRelationProblem;
type Frame = {q: number; a: number; b: number; weight: number};
type Rational = readonly [bigint, bigint];
const integer = (value: number): Rational => [BigInt(value), 1n];
const rational = (value: {numerator: number; denominator: number}): Rational => [BigInt(value.numerator), BigInt(value.denominator)];
const compare = ([a, b]: Rational, [c, d]: Rational): number => a * d < c * b ? -1 : a * d > c * b ? 1 : 0;
const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];
const symbol = {greater: '>', less: '<', equal: '='} as const;
const profileLabels = {
    greater: [Area.NumericInequality, Scope.Greater, Scope.ImproperFractions],
    less: [Area.NumericInequality, Scope.Less, Scope.ProperFractions],
    equal: [Area.NumericEquality, Scope.Equal, Scope.ImproperFractions]
};
const lineages = [
    ['5.NF.B.5a-compare-product-factor~7e16305f', relationId, comparisonId, 3],
    ['5.NF.B.5a-compare-product-factor~e44eb1d0', relationId, comparisonId, 2],
    ['5.NF.B.5a-compare-product-factor~cd7ed5ec', relationId, comparisonId, 2],
    ['5.NF.B.5b-explain-fraction-scaling~b6daacd2', analogyId, explanationId, 3],
    ['5.NF.B.5b-explain-fraction-scaling~95e21c0d', analogyId, explanationId, 2]
] as const;

function fixture(q: number, a: number, b: number, analogy: boolean): Data {
    const common = {reference: {numerator: q, denominator: 1}, scaleFactor: {numerator: a, denominator: b},
        product: {numerator: q * a, denominator: b}, onePart: {numerator: q, denominator: b},
        relation: a > b ? 'greater' as const : a < b ? 'less' as const : 'equal' as const, partDifferenceCount: a - b};
    return analogy ? {...common, kind: 'fraction-scale-comparison',
        wholeNumberAnalogy: {factor: 2, product: {numerator: 2 * q, denominator: 1}}}
        : {...common, kind: 'fraction-scale-relation'};
}

/** Original conditional law, independently enumerated without the production domain helper. */
function native(profile: Profile): Frame[] {
    const rows: Frame[] = [];
    for (let q = 2; q <= 5; q++) for (let b = 2; b <= 6; b++) {
        const numerators = profile === 'equal' ? [b]
            : Array.from({length: b - 1}, (_, index) => profile === 'greater' ? b + index + 1 : index + 1);
        for (const a of numerators) rows.push({q, a, b, weight: 60 / numerators.length});
    }
    return rows;
}

/** Part counts a and b are observed; unused product storage and signed difference are not. */
function rangeLabels(data: Data): string[] {
    const q = rational(data.reference), factor = rational(data.scaleFactor), part = rational(data.onePart);
    const product = rational(data.product), a = data.scaleFactor.numerator, b = data.scaleFactor.denominator;
    expect(compare(part, [q[0], q[1] * BigInt(b)])).toBe(0);
    expect(compare(product, [q[0] * factor[0], q[1] * factor[1]])).toBe(0);
    expect(data.partDifferenceCount).toBe(a - b);
    expect(data.relation).toBe(a > b ? 'greater' : a < b ? 'less' : 'equal');
    const values = [q, factor, part, integer(a), integer(b), integer(1)];
    if (data.kind === 'fraction-scale-comparison') {
        expect(data.wholeNumberAnalogy.factor).toBe(2);
        expect(compare(rational(data.wholeNumberAnalogy.product), [2n * q[0], q[1]])).toBe(0);
        values.push(integer(2), rational(data.wholeNumberAnalogy.product));
    } else expect(data).not.toHaveProperty('wholeNumberAnalogy');
    const ordered = values.sort(compare);
    const upper = thresholds.find(value => compare(ordered.at(-1)!, integer(value)) <= 0)!;
    const lower = thresholds.findLast(value => compare(ordered[0]!, integer(value)) >= 0) ?? 0;
    expect(upper).toBeDefined();
    expect(lower).toBeLessThan(upper);
    return [`NumbersSmaller${upper}`, ...(lower ? [`NumbersLarger${lower}`] : [])].sort();
}
const upperFor = (frame: Frame, analogy: boolean): number => Number(rangeLabels(fixture(frame.q, frame.a, frame.b, analogy))[0]!.replace('NumbersSmaller', ''));

/** Marginal intervals follow the original probabilities conditioned on a range cell. */
function interval(rows: readonly Frame[], field: 'q' | 'b' | 'a', value: number): readonly [number, number] {
    const weights = new Map<number, number>();
    for (const row of rows) weights.set(row[field], (weights.get(row[field]) ?? 0) + row.weight);
    const total = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
    let before = 0;
    for (const [candidate, weight] of weights) {
        if (candidate === value) return [before / total, (before + weight) / total];
        before += weight;
    }
    throw new Error('Independent native frame is absent from its conditional domain.');
}

let generators: GeneratorCatalogEntry[];
let views: ViewCatalogEntry[];
let tuples: MatchTuple[];
const cores = new Map<string, (props: never) => ReactElement>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    [generators, views] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map(families.map(({id}) => [id, resolve(root, 'src/generators/fraction', id, 'spec.ts')]))),
        loadViewCatalog(undefined, undefined, new Map(families.map(({viewId}) => [viewId, resolve(root, 'src/visuals/views/fractions', viewId, 'spec.ts')])))
    ]);
    cores.set(comparisonId, (await import('../../visuals/views/fractions/fractions-scaling-comparison/view.tsx')).FractionsScalingComparisonCore);
    cores.set(explanationId, (await import('../../visuals/views/fractions/fractions-scaling-explanation/view.tsx')).FractionsScalingExplanationCore);
    tuples = matchTargets(await loadMatchingTargets('ccss'), generators, views).tuples;
});
afterAll(() => vi.unstubAllGlobals());
const render = (viewId: string, data: unknown, solution: boolean): string => renderToStaticMarkup(cores.get(viewId)!({payload: {
    viewId, problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 42
}} as never));
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/\s+/g, ' ').trim();

describe('fraction scaling comparison and analogy contract integration', () => {
    it('preserves all five source lineages with precisely the two intended nominal pairs', () => {
        expect(buildCompatibleModulePairIndex(generators, views).orderedPairs.map(pair => `${pair.generator.generatorId}#${pair.view.viewId}`).sort())
            .toEqual(families.map(({id, viewId}) => `${id}#${viewId}`).sort());
        expect(tuples.map(tuple => `${tuple.target.id}#${tuple.generatorId}#${tuple.viewId}`).sort())
            .toEqual(lineages.map(([target, generator, view]) => `${target}#${generator}#${view}`).sort());
        expect(tuples.reduce((sum, tuple) => sum + enumerateDependencyAuditSelections(tuple.plan).selections.length, 0)).toBe(12);
    });

    it.each(families.flatMap(family => profiles.map(profile => ({...family, profile}))))
    ('preserves weighted native $profile support and range boundaries for $id', ({id, analogy, profile}) => {
        const rows = native(profile);
        expect(rows.reduce((sum, row) => sum + row.weight, 0)).toBe(1200);
        const upperBounds = [...new Set(rows.map(row => upperFor(row, analogy)))].sort((a, b) => a - b);
        expect(upperBounds).toEqual(profile === 'greater' ? [5, 10, 20] : [5, 10]);
        const generator = id === relationId ? new FractionScaleRelationsGenerator() : new FractionScalingGenerator();
        const random = vi.spyOn(randomModule, 'random');
        try {
            for (const upper of upperBounds) {
                const cell = rows.filter(row => upperFor(row, analogy) === upper);
                for (const row of cell) {
                    const qRows = cell.filter(candidate => candidate.q === row.q);
                    const bRows = qRows.filter(candidate => candidate.b === row.b);
                    const intervals = [interval(cell, 'q', row.q), interval(qRows, 'b', row.b),
                        ...(profile === 'equal' ? [] : [interval(bRows, 'a', row.a)])];
                    const middle = intervals.map(([low, high]) => (low + high) / 2);
                    // Interior and both ends of each conditional probability interval
                    // expose denominator-weight regressions without random frequency tests.
                    const draws = [middle, ...intervals.flatMap(([low, high], index) => [
                        middle.map((point, i) => i === index ? low + (high - low) * 1e-7 : point),
                        middle.map((point, i) => i === index ? high - (high - low) * 1e-7 : point)
                    ])];
                    for (const values of draws) {
                        random.mockReset();
                        for (const value of values) random.mockReturnValueOnce(value);
                        expect(generator.generate({comparisonProfile: profile, range: createCanonicalNumericRange(upper)}).data)
                            .toEqual(fixture(row.q, row.a, row.b, analogy));
                        expect(random).toHaveBeenCalledTimes(profile === 'equal' ? 2 : 3);
                    }
                }
            }
        } finally { random.mockRestore(); }
    });

    it.each(profiles)('preserves future %s matching, family rejection, and both-mode task evidence', profile => {
        for (const {id, viewId, analogy} of families) {
            const rows = native(profile), upperBounds = [...new Set(rows.map(row => upperFor(row, analogy)))];
            const generator = generators.find(generator => generator.generatorId === id)!;
            const wrong = generators.find(generator => generator.generatorId !== id)!;
            const view = views.find(view => view.viewId === viewId)!;
            for (const upper of upperBounds) {
                const target = {id: `future-scaling-${profile}-${id}-${upper}`, labels: [Area.ProportionalScaling, Area.Multiplication,
                    Ability.Interpretation, ...(analogy ? [Ability.TextualArticulation] : []), ...profileLabels[profile],
                    `http://edugraph.io/edu/NumbersSmaller${upper}`]};
                expect(matchTarget(target, generator, view).matched).toBe(true);
                expect(matchTarget(target, wrong, view)).toEqual({matched: false, reason: 'incompatible-type'});
                const row = rows.find(row => upperFor(row, analogy) === upper)!;
                const data = fixture(row.q, row.a, row.b, analogy);
                const q = row.q, factor = `${row.a}/${row.b}`;
                for (const solution of [false, true]) {
                    expect(() => render(viewId, fixture(row.q, row.a, row.b, !analogy), solution)).toThrow(ViewValidationError);
                    const markup = render(viewId, data, solution), text = visible(markup);
                    expect(text).toContain(`${q} × ${factor} ${solution ? symbol[profile] : '□'} ${q}`);
                    expect(text).not.toContain(`${q} × ${factor} = ${q * row.a}/${row.b}`);
                    expect(text.includes('Familiar whole-number scaling:')).toBe(analogy);
                    if (solution) {
                        expect(markup.match(/fill="#dbeafe"/g)).toHaveLength(row.b);
                        expect(markup.match(/fill="#bbf7d0"/g)).toHaveLength(row.a);
                        expect(text).toContain(`${q} ÷ ${row.b} = ${q}/${row.b}`);
                    } else expect(text).not.toContain('Every section is one equal part');
                }
            }
            if (analogy) expect(matchTarget({id: `unrequested-explanation-${profile}`, labels: [Area.ProportionalScaling,
                Area.Multiplication, Ability.Interpretation, ...profileLabels[profile]]}, generator, view).matched).toBe(false);
        }
    });

    it.each([
        [5, 3, 2, 5, 10], [5, 11, 6, 20, 20], [5, 9, 5, 10, 10], [2, 6, 6, 10, 10]
    ])('independently classifies reference%i with factor%i/%i without promoting product storage', (q, a, b, comparisonUpper, explanationUpper) => {
        expect(rangeLabels(fixture(q, a, b, false))).toEqual([`NumbersSmaller${comparisonUpper}`]);
        expect(rangeLabels(fixture(q, a, b, true))).toEqual([`NumbersSmaller${explanationUpper}`]);
    });

    it('leaves the future equality explanation verdict open in Question and supplies it in Solution', () => {
        const data = fixture(5, 2, 2, true);
        const question = visible(render(explanationId, data, false));
        const solution = visible(render(explanationId, data, true));
        expect(question).toContain('Explain how multiplying by this fraction affects the original quantity.');
        expect(question).toContain('5 × 2/2 □ 5');
        expect(question).toContain('grows, shrinks, or stays the same');
        expect(question).not.toMatch(/5 × 2\/2 = 5|2 = 2|2\/2 = 1|leaves .* unchanged|makes a quantity equal to/);
        expect(solution).toContain('5 × 2/2 = 5');
        expect(solution).toContain('2 = 2, so 2/2 = 1');
        expect(solution).toContain('Because 2 parts are equal to 2 parts');
        for (const text of [question, solution]) expect(text).toContain('multiplying 5 by 2 gives 10');
    });

    it.each([
        {name: 'non-object', corrupt: (_data: Data): unknown => []},
        {name: 'unknown family', corrupt: (data: Data): unknown => ({...data, kind: 'unknown'})},
        {name: 'missing reference', corrupt: (data: Data): unknown => ({...data, reference: undefined})},
        {name: 'fractional reference count', corrupt: (data: Data): unknown => ({...data, reference: {numerator: 2.5, denominator: 1}})},
        {name: 'out-of-domain reference', corrupt: (data: Data): unknown => ({...data, reference: {numerator: 6, denominator: 1}})},
        {name: 'non-integral reference', corrupt: (data: Data): unknown => ({...data, reference: {numerator: 5, denominator: 2}})},
        {name: 'zero selected parts', corrupt: (data: Data): unknown => ({...data, scaleFactor: {numerator: 0, denominator: 2}})},
        {name: 'unit denominator', corrupt: (data: Data): unknown => ({...data, scaleFactor: {numerator: 1, denominator: 1}})},
        {name: 'too many reference parts', corrupt: (data: Data): unknown => ({...data, scaleFactor: {numerator: 3, denominator: 7}})},
        {name: 'factor beyond native extent', corrupt: (data: Data): unknown => ({...data, scaleFactor: {numerator: 4, denominator: 2}})},
        {name: 'inexact product', corrupt: (data: Data): unknown => ({...data, product: {numerator: 14, denominator: 2}})},
        {name: 'inexact one-part value', corrupt: (data: Data): unknown => ({...data, onePart: {numerator: 4, denominator: 2}})},
        {name: 'inexact signed difference', corrupt: (data: Data): unknown => ({...data, partDifferenceCount: 2})},
        {name: 'non-integral signed difference', corrupt: (data: Data): unknown => ({...data, partDifferenceCount: 1.5})},
        {name: 'incorrect relation', corrupt: (data: Data): unknown => ({...data, relation: 'less'})}
    ])('rejects $name with public guards and typed errors at both leaf boundaries', ({corrupt}) => {
        for (const {viewId, analogy} of families) {
            const invalid = corrupt(fixture(5, 3, 2, analogy));
            expect(isValidFractionScaleRelation(invalid)).toBe(false);
            expect(isValidFractionScaleComparison(invalid)).toBe(false);
            for (const solution of [false, true]) expect(() => render(viewId, invalid, solution)).toThrow(ViewValidationError);
        }
    });

    it('rejects missing or incoherent analogy evidence and prevents analogy leakage into the relation contract', () => {
        const full = fixture(5, 3, 2, true) as FractionScaleComparisonProblem;
        for (const wholeNumberAnalogy of [undefined, null, {factor: 3, product: {numerator: 10, denominator: 1}},
            {factor: 2, product: {numerator: 9, denominator: 1}}, {factor: 2, product: {numerator: 10, denominator: 0}}]) {
            const invalid = {...full, wholeNumberAnalogy};
            expect(isValidFractionScaleComparison(invalid)).toBe(false);
            for (const solution of [false, true]) expect(() => render(explanationId, invalid, solution)).toThrow(ViewValidationError);
        }
        const leaked = {...fixture(5, 3, 2, false), wholeNumberAnalogy: full.wholeNumberAnalogy};
        expect(isValidFractionScaleRelation(leaked)).toBe(false);
        for (const solution of [false, true]) expect(() => render(comparisonId, leaked, solution)).toThrow(ViewValidationError);
    });

    it.each(lineages)('independently verifies every range selection and receipt replay for %s / %s / %s', (targetId, generatorId, viewId, count) => {
        const tuple = tuples.find(tuple => tuple.target.id === targetId && tuple.generatorId === generatorId && tuple.viewId === viewId)!;
        const generator = generators.find(generator => generator.generatorId === generatorId)!;
        const view = views.find(view => view.viewId === viewId)!;
        const enumeration = enumerateDependencyAuditSelections(tuple.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(count);
        for (const selection of enumeration.selections) for (let seed = 0; seed < 8; seed++) {
            const sampleKey = `${targetId}#${generatorId}#${viewId}#train#question#inst:0`;
            const input = {generator: generator.generator, generatorSpec: generator.spec, viewSchema: view.schema, viewSpec: view.spec,
                plan: tuple.plan, sampleKey, seed, attempt: 1, replay: {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(tuple.plan, selection.choices)}};
            const draw = generatePlannedDraw(input);
            expect(draw.stub).not.toBeNull();
            const data = draw.stub!.data as Data;
            expect(data.kind).toBe(generatorId === relationId ? 'fraction-scale-relation' : 'fraction-scale-comparison');
            expect(draw.labels.map(label => label.slice(label.lastIndexOf('/') + 1)).filter(label => /^Numbers(?:Smaller|Larger)\d+$/.test(label)).sort())
                .toEqual(rangeLabels(data));
            expect(draw.labels).toContain(Scope.NumbersWithoutNegatives);
            expect(draw.labels).toContain(Scope.NumbersWithoutZero);
            expect(generatePlannedDraw(input)).toEqual(draw);
        }
    });
});
