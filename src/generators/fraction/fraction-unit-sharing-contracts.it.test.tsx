import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {ReactElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {loadGeneratorCatalog, loadViewCatalog, type GeneratorCatalogEntry, type ViewCatalogEntry} from '../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {buildCompatibleModulePairIndex, matchTarget, matchTargets, type MatchTuple} from '../../lib/matching.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import {loadMatchingTargets} from '../../lib/spec-validator.ts';
import type {FractionQuotientContent, FractionQuotientProblem, FractionQuotientValue,
    FractionUnitPartitionProblem, FractionUnitSharingProblem} from '../../types/problems.ts';

const legacyId = 'fraction-quotient-model';
const partitionId = 'fraction-unit-partition-model';
const sharingId = 'fraction-unit-sharing-relations';
const generalId = 'fraction-division-relations';
const partitionViews = ['fractions-quotient-interpretation', 'fractions-division-interpretation', 'fractions-division-execution'];
const sharingViews = ['fractions-division-story-creation', 'fractions-division-inverse-explanation', 'fractions-division-word-problem'];
const quotientViews = [...partitionViews, ...sharingViews];
const generalViews = ['fractions-general-division-interpretation', 'fractions-general-division-execution',
    'fractions-general-division-story-creation', 'fractions-general-division-inverse-explanation',
    'fractions-general-division-word-problem', 'fractions-division-model-construction'];
const families = [legacyId, partitionId, sharingId, generalId];
const allViews = [...quotientViews, ...generalViews];

const lineages = [
    ['5.NF.B.3-interpret-quotient~58941c0e', 'fractions-quotient-interpretation', legacyId, 4],
    ['5.NF.B.3-whole-number-division-problems~93b20acf', 'fractions-division-word-problem', legacyId, 4],
    ['5.NF.B.7a-compute-unit-fraction-dividend~305d201f', 'fractions-division-execution', partitionId, 4],
    ['5.NF.B.7a-create-division-story~f49eaf9a', 'fractions-division-story-creation', sharingId, 2],
    ['5.NF.B.7a-explain-inverse-multiplication~1f6abb53', 'fractions-division-inverse-explanation', sharingId, 2],
    ['5.NF.B.7a-interpret-unit-fraction-dividend~fb8ea3a6', 'fractions-division-interpretation', partitionId, 4],
    ['5.NF.B.7b-compute-unit-fraction-divisor~936c597b', 'fractions-division-execution', legacyId, 5],
    ['5.NF.B.7b-create-division-story~e076143e', 'fractions-division-story-creation', legacyId, 5],
    ['5.NF.B.7b-explain-inverse-multiplication~8e8cc937', 'fractions-division-inverse-explanation', legacyId, 5],
    ['5.NF.B.7b-interpret-unit-fraction-divisor~250111ba', 'fractions-division-interpretation', legacyId, 5],
    ['5.NF.B.7c-unit-fraction-division-problems~2fec8939', 'fractions-division-word-problem', sharingId, 2],
    ['5.NF.B.7c-unit-fraction-division-problems~b0ad41e5', 'fractions-division-word-problem', legacyId, 5],
    ['6.NS.A.1-fraction-division-execution~064ac4c6', 'fractions-division-execution', partitionId, 12],
    ['6.NS.A.1-fraction-division-execution~cda9b2f2', 'fractions-division-execution', legacyId, 15],
    ['6.NS.A.1-fraction-division-interpretation~34d90295', 'fractions-division-interpretation', legacyId, 15],
    ['6.NS.A.1-fraction-division-interpretation~4d864771', 'fractions-division-interpretation', partitionId, 12],
    ['6.NS.A.1-fraction-division-inverse-explanation~572c5cfa', 'fractions-division-inverse-explanation', sharingId, 2],
    ['6.NS.A.1-fraction-division-inverse-explanation~aa5b012e', 'fractions-division-inverse-explanation', legacyId, 5],
    ['6.NS.A.1-fraction-division-story-creation~71f3fc19', 'fractions-division-story-creation', legacyId, 15],
    ['6.NS.A.1-fraction-division-story-creation~ca219375', 'fractions-division-story-creation', sharingId, 6],
    ['6.NS.A.1-fraction-division-word-problems~56d46488', 'fractions-division-word-problem', legacyId, 5],
    ['6.NS.A.1-fraction-division-word-problems~f469853c', 'fractions-division-word-problem', sharingId, 2]
] as const;

type Rational = readonly [bigint, bigint];
const rational = (value: FractionQuotientValue): Rational => [BigInt(value.numerator), BigInt(value.denominator)];
const integer = (value: number): Rational => [BigInt(value), 1n];
const product = ([a, b]: Rational, [c, d]: Rational): Rational => [a * c, b * d];
const compare = ([a, b]: Rational, [c, d]: Rational): number => a * d < c * b ? -1 : a * d > c * b ? 1 : 0;
const equal = (a: Rational, b: Rational): boolean => compare(a, b) === 0;
const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];

/** Reconstruct required mathematics without reading any production range helper. */
function quantities(data: FractionQuotientContent): Rational[] {
    const dividend = rational(data.dividend), divisor = rational(data.divisor), quotient = rational(data.quotient);
    expect(equal(product(quotient, divisor), dividend)).toBe(true);
    expect(equal(rational(data.inverse.quotientFactor), quotient)).toBe(true);
    expect(equal(rational(data.inverse.divisorFactor), divisor)).toBe(true);
    expect(equal(rational(data.inverse.reconstructedDividend), dividend)).toBe(true);
    if (data.equationWitness) {
        const witness = data.equationWitness;
        expect(equal(product(rational(witness.groupCount), rational(witness.measurePerGroup)), dividend)).toBe(true);
        expect(equal(rational(witness.totalMeasure), dividend)).toBe(true);
    }
    if (data.multiplicationWitness) {
        expect(equal(rational(data.multiplicationWitness.unreducedProduct), dividend)).toBe(true);
        expect(equal(rational(data.multiplicationWitness.reconstructedDividend), dividend)).toBe(true);
    }
    const values = [dividend, divisor, quotient];
    if (data.kind === 'fraction-unit-partition') {
        const denominator = data.dividend.denominator, recipients = data.divisor.numerator;
        expect(data.model).toEqual({kind: 'unit-part-sharing', wholePartitionCount: denominator,
            recipientCount: recipients, refinedPartitionCount: denominator * recipients, sharedFineParts: recipients});
        values.push(integer(denominator), integer(recipients), integer(denominator * recipients));
    } else if (data.kind === 'fraction-unit-sharing') {
        expect(data.recipientCount).toBe(data.divisor.numerator);
        expect(data).not.toHaveProperty('model');
        values.push(integer(data.divisor.numerator));
    } else if (data.orientation === 'whole-by-unit-fraction') {
        // The task counts actual pieces; a zero dividend has none. A unit
        // fraction's denominator alone does not assess an integer part count.
        values.push(integer(data.dividend.numerator * data.divisor.denominator));
    }
    return values;
}

function canonicalLabels(values: readonly Rational[]): string[] {
    const ordered = values.map(([n, d]) => [n < 0n ? -n : n, d] as const).sort(compare);
    const upper = thresholds.find(value => compare(ordered.at(-1)!, integer(value)) <= 0)!;
    const lower = thresholds.findLast(value => compare(ordered[0]!, integer(value)) >= 0) ?? 0;
    expect(upper).toBeDefined();
    expect(lower).toBeLessThan(upper);
    return [`NumbersSmaller${upper}`, ...(lower ? [`NumbersLarger${lower}`] : [])].sort();
}

const value = (numerator: number, denominator = 1) => ({numerator, denominator});
const unitRelations = {dividend: value(1, 6), divisor: value(6), quotient: value(1, 36),
    inverse: {quotientFactor: value(1, 36), divisorFactor: value(6), reconstructedDividend: value(1, 6)},
    equationWitness: {totalMeasure: value(1, 6), groupCount: value(6), measurePerGroup: value(1, 36)},
    multiplicationWitness: {unreducedProduct: value(6, 36), reconstructedDividend: value(1, 6)},
    story: {material: 'ribbon', measureUnit: 'meter', recipientUnit: 'person'}} as const;
const partition: FractionUnitPartitionProblem = {...unitRelations, kind: 'fraction-unit-partition',
    orientation: 'unit-fraction-by-whole', model: {kind: 'unit-part-sharing', wholePartitionCount: 6,
        recipientCount: 6, refinedPartitionCount: 36, sharedFineParts: 6}};
const sharing: FractionUnitSharingProblem = {...unitRelations, kind: 'fraction-unit-sharing',
    orientation: 'unit-fraction-by-whole', recipientCount: 6};
const inverseSharing: FractionUnitSharingProblem = {kind: 'fraction-unit-sharing', orientation: 'unit-fraction-by-whole',
    dividend: unitRelations.dividend, divisor: unitRelations.divisor, quotient: unitRelations.quotient,
    inverse: unitRelations.inverse, multiplicationWitness: unitRelations.multiplicationWitness,
    recipientCount: 6, story: unitRelations.story};
const whole: FractionQuotientProblem = {kind: 'fraction-quotient', orientation: 'whole-by-whole',
    dividend: value(3), divisor: value(2), quotient: value(3, 2),
    inverse: {quotientFactor: value(3, 2), divisorFactor: value(2), reconstructedDividend: value(3)},
    model: {kind: 'equal-sharing', wholeUnitCount: 3, recipientCount: 2, partsPerWhole: 2, totalParts: 6, partsPerRecipient: 3},
    story: {material: 'rope', measureUnit: 'meter', recipientUnit: 'person'}};
const groups: FractionQuotientProblem = {kind: 'fraction-quotient', orientation: 'whole-by-unit-fraction',
    dividend: value(2), divisor: value(1, 3), quotient: value(6),
    inverse: {quotientFactor: value(6), divisorFactor: value(1, 3), reconstructedDividend: value(2)},
    model: {kind: 'unit-part-group-count', wholeUnitCount: 2, partsPerWhole: 3, groupCount: 6},
    story: {material: 'rope', measureUnit: 'meter', groupUnit: 'piece'}};

let generators: GeneratorCatalogEntry[];
let views: ViewCatalogEntry[];
let tuples: MatchTuple[];
let sourceTargets: Awaited<ReturnType<typeof loadMatchingTargets>>;
const cores = new Map<string, (props: never) => ReactElement>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    [generators, views, sourceTargets] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map(families.map(id => [id, resolve(root, 'src/generators/fraction', id, 'spec.ts')]))),
        loadViewCatalog(undefined, undefined, new Map(allViews.map(id => [id, resolve(root, 'src/visuals/views/fractions', id, 'spec.ts')]))),
        loadMatchingTargets('ccss')
    ]);
    await Promise.all(allViews.map(async id => {
        const module = await import(`../../visuals/views/fractions/${id}/view.tsx`);
        const exportName = id.split('-').map(word => word[0]!.toUpperCase() + word.slice(1)).join('') + 'Core';
        cores.set(id, module[exportName]);
    }));
    tuples = matchTargets(sourceTargets, generators, views).tuples.filter(tuple => tuple.generatorId !== generalId);
});
afterAll(() => vi.unstubAllGlobals());

// Invalid-family fixtures deliberately cross the runtime boundary through never;
// this adapter does not widen any production Core's accepted payload signature.
const render = (id: string, data: unknown, solution: boolean): string => renderToStaticMarkup(cores.get(id)!({payload: {
    viewId: id, problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 42
}} as never));
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

describe('unit-fraction partition and sharing contract integration', () => {
    it('admits exactly the four-family/twelve-view nominal matrix', () => {
        expect(generators).toHaveLength(4);
        expect(views).toHaveLength(12);
        const expected = [[legacyId, quotientViews], [partitionId, partitionViews], [sharingId, sharingViews], [generalId, generalViews]] as const;
        expect(buildCompatibleModulePairIndex(generators, views).orderedPairs.map(pair => `${pair.generator.generatorId}#${pair.view.viewId}`).sort())
            .toEqual(expected.flatMap(([family, ids]) => ids.map(id => `${family}#${id}`)).sort());
    });

    it('enforces the same complete family matrix at every leaf in both modes', () => {
        const generalTuple = matchTargets(sourceTargets, [generators.find(generator => generator.generatorId === generalId)!], views).tuples[0]!;
        const generator = generators.find(generator => generator.generatorId === generalId)!;
        const view = views.find(view => view.viewId === generalTuple.viewId)!;
        const general = generatePlannedDraw({generator: generator.generator, generatorSpec: generator.spec, viewSchema: view.schema,
            viewSpec: view.spec, plan: generalTuple.plan, seed: 42, attempt: 1,
            sampleKey: `${generalTuple.target.id}#${generalId}#${view.viewId}#train#question#inst:0`}).stub!.data;
        for (const id of allViews) for (const solution of [false, true]) {
            for (const [family, data] of [[legacyId, whole], [legacyId, groups], [partitionId, partition], [sharingId, sharing], [generalId, general]] as const) {
                const accepted = family === legacyId ? quotientViews.includes(id) : family === partitionId ? partitionViews.includes(id)
                    : family === sharingId ? sharingViews.includes(id) : generalViews.includes(id);
                if (accepted) expect(() => render(id, data, solution)).not.toThrow();
                else expect(() => render(id, data, solution)).toThrow(/Validation Error/);
            }
        }
    });

    it('preserves all22 source target/view lineages and accounts for all136 selections', () => {
        expect(tuples.map(tuple => `${tuple.target.id}#${tuple.viewId}#${tuple.generatorId}`).sort())
            .toEqual(lineages.map(([target, view, generator]) => `${target}#${view}#${generator}`).sort());
        const total = (family: string) => tuples.filter(tuple => tuple.generatorId === family)
            .reduce((count, tuple) => count + enumerateDependencyAuditSelections(tuple.plan).selections.length, 0);
        expect(total(legacyId)).toBe(88);
        expect(total(partitionId)).toBe(32);
        expect(total(sharingId)).toBe(16);
    });

    it('admits future fine-unit notation while preserving the existing whole-input notation target', () => {
        const notation = views.find(view => view.viewId === 'fractions-quotient-interpretation')!;
        const fine = generators.find(generator => generator.generatorId === partitionId)!;
        const future = {id: 'future-explicit-unit-dividend-notation', labels: [Area.Division, Area.FractionNotation,
            Scope.FractionDividend, Scope.IntegerDivisor, Scope.UnitFractions, Scope.NumbersWithoutNegatives, Ability.Interpretation]};
        expect(matchTarget(future, fine, notation).matched).toBe(true);
        const existing = sourceTargets.find(target => target.id === '5.NF.B.3-interpret-quotient~58941c0e')!;
        expect(generators.filter(generator => matchTarget(existing, generator, notation).matched).map(generator => generator.generatorId))
            .toEqual([legacyId]);
    });

    it('distinguishes a constructed36-part whole from six shares of the given1/6-meter amount', () => {
        expect(canonicalLabels(quantities(partition))).toEqual(['NumbersSmaller100']);
        expect(canonicalLabels(quantities(sharing))).toEqual(['NumbersSmaller10']);
        expect(render('fractions-division-execution', partition, true)).toContain('36 equal fine parts');
        const coarse = render('fractions-division-inverse-explanation', sharing, true);
        expect(coarse).toContain('Given amount:');
        expect(coarse).not.toContain('equal fine parts');
        expect(coarse).not.toContain('One meter');
    });

    it('preserves selected multiplication evidence in the Grade6 story task without supplying its story or quotient', () => {
        const tuple = tuples.find(tuple => tuple.target.id === '6.NS.A.1-fraction-division-story-creation~ca219375'
            && tuple.viewId === 'fractions-division-story-creation')!;
        expect(enumerateDependencyAuditSelections(tuple.plan).selections.some(selection => selection.labels.includes(Area.Multiplication))).toBe(true);
        const questionMarkup = render('fractions-division-story-creation', inverseSharing, false);
        const solutionMarkup = render('fractions-division-story-creation', inverseSharing, true);
        const question = visible(questionMarkup), solution = visible(solutionMarkup);
        for (const markup of [questionMarkup, solutionMarkup]) expect(markup).toContain('data-evidence="story-multiplication-relation"');
        expect(question).toContain('Write a ribbon story that matches this division. Make the original quantities and the question clear.');
        expect(question).toContain('______ × 6 = 1/6');
        expect(question).toContain('My story:');
        expect(question).not.toMatch(/1\/36|6\/36|Example story:|Find the quotient|Explain why|Check by multiplication:/);
        expect(solution).toContain('1/36 × 6 = 6/36 = 1/6');
        expect(solution).toContain('Example story:');
        expect(solution).toContain('The answer is 1/36 meter');
        for (const text of [question, solution]) expect(text).not.toContain('equal fine parts');
    });

    it('handles a valid inverse-only sharing payload in the word task with an unfilled Question check and exact Solution check', () => {
        const questionMarkup = render('fractions-division-word-problem', inverseSharing, false);
        const solutionMarkup = render('fractions-division-word-problem', inverseSharing, true);
        const question = visible(questionMarkup), solution = visible(solutionMarkup);
        expect(question).toContain('A ribbon measures 1/6 meter. It is shared equally among 6 people.');
        expect(question).toContain('Equation: ____________________');
        expect(question).toContain('Check by multiplication: ____________________');
        expect(question).not.toMatch(/1\/36|6\/36|÷|×/);
        expect(solutionMarkup).toContain('data-evidence="word-multiplication-check"');
        expect(solution).toContain('1/6 ÷ 6 = 1/36');
        expect(solution).toContain('1/36 × 6 = 6/36 = 1/6');
        expect(solution).not.toContain('equal fine parts');
    });

    it.each(lineages)('independently proves ranges and receipt replay for %s / %s', (targetId, viewId, generatorId, count) => {
        const tuple = tuples.find(tuple => tuple.target.id === targetId && tuple.viewId === viewId)!;
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
            const values = quantities(draw.stub!.data as FractionQuotientContent);
            expect(draw.labels.map(label => label.slice(label.lastIndexOf('/') + 1)).filter(label => /^Numbers(?:Smaller|Larger)\d+$/.test(label)).sort())
                .toEqual(canonicalLabels(values));
            expect(draw.labels).toContain(Scope.NumbersWithoutNegatives);
            expect(draw.labels).toContain(values.some(([n]) => n === 0n) ? Scope.NumbersWithZero : Scope.NumbersWithoutZero);
            expect(generatePlannedDraw(input)).toEqual(draw);
        }
    });
});
