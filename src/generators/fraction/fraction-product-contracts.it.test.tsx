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
import type {FractionProductContent, FractionProductFractionOperand, FractionProductMixedOperand,
    FractionProductProblem, FractionProductRelationProblem, FractionProductValue} from '../../types/problems.ts';

const derivationId = 'fraction-products';
const relationId = 'fraction-product-relations';
const interpretationId = 'fractions-product-partition-interpretation';
const storyId = 'fractions-product-story-creation';
const wordId = 'fractions-product-word-problem';
const viewIds = [interpretationId, storyId, wordId];
const lineages = [
    ['5.NF.B.4a-partition-product~084fd55b', interpretationId, derivationId, 9],
    ['5.NF.B.4a-create-product-story~e715c35f', storyId, relationId, 5],
    ['5.NF.B.6-fraction-product-problems~cee4a115', wordId, relationId, 5],
    ['5.NF.B.6-fraction-product-problems~bd96866e', wordId, relationId, 3]
] as const;

type Rational = readonly [bigint, bigint];
type Operand = FractionProductFractionOperand | FractionProductMixedOperand;
const rational = (value: FractionProductValue): Rational => [BigInt(value.numerator), BigInt(value.denominator)];
const integer = (value: number): Rational => [BigInt(value), 1n];
const multiply = ([a, b]: Rational, [c, d]: Rational): Rational => [a * c, b * d];
const compare = ([a, b]: Rational, [c, d]: Rational): number => a * d < c * b ? -1 : a * d > c * b ? 1 : 0;
const equal = (a: Rational, b: Rational): boolean => compare(a, b) === 0;
const operandValue = (operand: Operand): FractionProductValue => ({denominator: operand.denominator,
    numerator: operand.form === 'mixed' ? operand.whole * operand.denominator + operand.fractionNumerator : operand.numerator});
const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];

/** Count selected parts and parts per copy, never unused cells or rational storage components. */
function quantities(data: FractionProductContent, zeroReference: boolean): Rational[] {
    const multiplier = operandValue(data.multiplier), quantity = operandValue(data.quantity);
    const a = multiplier.numerator, b = multiplier.denominator;
    expect(data.multiplierValue).toEqual(multiplier);
    expect(data.quantityValue).toEqual(quantity);
    expect(equal(multiply(rational(multiplier), rational(quantity)), rational(data.product))).toBe(true);
    expect(data.partition.selectedPartCount).toBe(a);
    expect(data.partition.equalPartsPerCopy).toBe(b);
    expect(data.partition.copyCount).toBe(Math.ceil(a / b));
    expect(data.partition.availablePartCount).toBe(Math.ceil(a / b) * b);
    const onePart: Rational = [BigInt(quantity.numerator), BigInt(quantity.denominator) * BigInt(b)];
    expect(equal(rational(data.partition.onePartValue), onePart)).toBe(true);
    const values = [rational(multiplier), rational(quantity), rational(data.product), onePart,
        integer(a), integer(b), integer(Math.ceil(a / b)), integer(zeroReference ? 0 : 1)];
    if (data.kind === 'fraction-product') {
        const scaled = multiply(integer(a), rational(quantity));
        expect(equal(rational(data.partition.scaledQuantity), scaled)).toBe(true);
        values.push(scaled);
    } else expect(data.partition).not.toHaveProperty('scaledQuantity');
    if (data.equationWitness) {
        expect(data.equationWitness.measureUnit).toBe('meter');
        expect(equal(rational(data.equationWitness.factor), rational(multiplier))).toBe(true);
        expect(equal(rational(data.equationWitness.referenceMeasure), rational(quantity))).toBe(true);
        expect(equal(rational(data.equationWitness.productMeasure), rational(data.product))).toBe(true);
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

const fraction = (numerator: number, denominator: number): FractionProductFractionOperand => ({form: 'fraction', numerator, denominator});
const mixed = (whole: number, fractionNumerator: number, denominator: number): FractionProductMixedOperand =>
    ({form: 'mixed', whole, fractionNumerator, denominator, improperNumerator: whole * denominator + fractionNumerator});

/** Independent fixtures preserve supplied notation and use only exact integer cross-products. */
function fixtures(multiplier: Operand, quantity: Operand, equation: boolean): {
    derivation: FractionProductProblem; relation: FractionProductRelationProblem
} {
    const m = operandValue(multiplier), q = operandValue(quantity), a = m.numerator, b = m.denominator;
    const product = {numerator: a * q.numerator, denominator: b * q.denominator};
    const forms = multiplier.form === 'mixed' && quantity.form === 'mixed'
        ? {operandForm: 'mixed-numbers' as const, multiplier, quantity}
        : {operandForm: 'fractions' as const, multiplier: multiplier as FractionProductFractionOperand,
            quantity: quantity as FractionProductFractionOperand};
    const common = {...forms, sharedWhole: 1 as const, multiplierValue: m, quantityValue: q, product,
        context: {material: 'ribbon' as const, measureUnit: 'meter' as const},
        partition: {equalPartsPerCopy: b, selectedPartCount: a, copyCount: Math.ceil(a / b),
            availablePartCount: Math.ceil(a / b) * b, onePartValue: {numerator: q.numerator, denominator: q.denominator * b}},
        ...(equation ? {equationWitness: {factor: m, referenceMeasure: q, productMeasure: product, measureUnit: 'meter' as const}} : {})};
    return {relation: {...common, kind: 'fraction-product-relation'},
        derivation: {...common, kind: 'fraction-product', partition: {...common.partition,
            scaledQuantity: {numerator: a * q.numerator, denominator: q.denominator}}}};
}

const contrast = fixtures(fraction(17, 6), fraction(6, 1), false);
const unusedCells = fixtures(fraction(7, 6), fraction(1, 2), true);
const storageNumerator = fixtures(fraction(1, 2), fraction(17, 6), false);
const mixedNumbers = fixtures(mixed(1, 1, 2), mixed(3, 5, 6), true);
const profiles = [
    {id: 'fraction-partition-proper', data: storageNumerator, labels: [Area.Division, Area.FractionNumeratorInterpretation,
        Area.FractionDenominatorInterpretation, Scope.FractionNumbers, Scope.EqualShares, Scope.ProperFractions], upper: [5, 5]},
    {id: 'fraction-partition-improper', data: contrast, labels: [Area.Division, Area.FractionNumeratorInterpretation,
        Area.FractionDenominatorInterpretation, Scope.FractionNumbers, Scope.EqualShares, Scope.ImproperFractions], upper: [120, 20]},
    {id: 'fraction-equation-proper', data: fixtures(fraction(1, 2), fraction(17, 6), true),
        labels: [Area.Equation, Scope.FractionNumbers, Scope.SingleFrameOfReference, Scope.ProperFractions], upper: [5, 5]},
    {id: 'fraction-equation-improper', data: unusedCells,
        labels: [Area.Equation, Scope.FractionNumbers, Scope.SingleFrameOfReference, Scope.ImproperFractions], upper: [10, 10]},
    {id: 'mixed-equation', data: mixedNumbers,
        labels: [Area.Equation, Scope.MixedNumbers, Scope.ImproperFractions, Scope.SingleFrameOfReference], upper: [20, 10]}
] as const;

let generators: GeneratorCatalogEntry[];
let views: ViewCatalogEntry[];
let tuples: MatchTuple[];
const cores = new Map<string, (props: never) => ReactElement>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    [generators, views] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map([derivationId, relationId].map(id =>
            [id, resolve(root, 'src/generators/fraction', id, 'spec.ts')]))),
        loadViewCatalog(undefined, undefined, new Map(viewIds.map(id =>
            [id, resolve(root, 'src/visuals/views/fractions', id, 'spec.ts')])))
    ]);
    await Promise.all(viewIds.map(async id => {
        const module = await import(`../../visuals/views/fractions/${id}/view.tsx`);
        const exportName = id.split('-').map(word => word[0]!.toUpperCase() + word.slice(1)).join('') + 'Core';
        cores.set(id, module[exportName]);
    }));
    tuples = matchTargets(await loadMatchingTargets('ccss'), generators, views).tuples;
});
afterAll(() => vi.unstubAllGlobals());

// Only adversarial fixture injection crosses through never; no production Core
// is widened to accept the other family's payload type.
const render = (id: string, data: unknown, solution: boolean): string => renderToStaticMarkup(cores.get(id)!({payload: {
    viewId: id, problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 42
}} as never));
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const format = (value: FractionProductValue): string => value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;

describe('fraction-product derivation and relation contract integration', () => {
    it('enforces all six nominal producer/view combinations and preserves four source lineages', () => {
        expect(generators).toHaveLength(2);
        expect(views).toHaveLength(3);
        expect(buildCompatibleModulePairIndex(generators, views).orderedPairs.map(pair => `${pair.generator.generatorId}#${pair.view.viewId}`).sort())
            .toEqual([`${derivationId}#${interpretationId}`, `${relationId}#${storyId}`, `${relationId}#${wordId}`].sort());
        expect(tuples.map(tuple => `${tuple.target.id}#${tuple.viewId}#${tuple.generatorId}`).sort())
            .toEqual(lineages.map(([target, view, generator]) => `${target}#${view}#${generator}`).sort());
        expect(tuples.reduce((total, tuple) => total + enumerateDependencyAuditSelections(tuple.plan).selections.length, 0)).toBe(22);
    });

    it.each(profiles)('preserves future $id matching and both-mode runtime acceptance without crossing the family boundary', profile => {
        for (const id of viewIds) {
            const interpretation = id === interpretationId;
            const generator = generators.find(generator => generator.generatorId === (interpretation ? derivationId : relationId))!;
            const wrong = generators.find(candidate => candidate.generatorId !== generator.generatorId)!;
            const view = views.find(view => view.viewId === id)!;
            const upper = profile.upper[interpretation ? 0 : 1];
            const target = {id: `future-${profile.id}-${id}`, labels: [Area.Multiplication, Scope.NumbersWithoutNegatives,
                ...profile.labels, interpretation ? Ability.Interpretation : id === storyId ? Ability.TextualArticulation
                    : Ability.TextualReception, ...(!interpretation && id === wordId ? [Ability.ProcedureExecution] : []),
                `http://edugraph.io/edu/NumbersSmaller${upper}`]};
            expect(matchTarget(target, generator, view).matched).toBe(true);
            expect(matchTarget(target, wrong, view)).toEqual({matched: false, reason: 'incompatible-type'});
            for (const solution of [false, true]) {
                const accepted = interpretation ? profile.data.derivation : profile.data.relation;
                const rejected = interpretation ? profile.data.relation : profile.data.derivation;
                expect(() => render(id, accepted, solution)).not.toThrow();
                expect(() => render(id, rejected, solution)).toThrow(/Validation Error/);
                const markup = render(id, accepted, solution);
                if (id !== wordId || solution) {
                    expect(markup.match(/fill="#7dd3fc"/g)).toHaveLength(accepted.partition.selectedPartCount);
                    expect(markup.match(/height="34"/g)).toHaveLength(accepted.partition.availablePartCount);
                }
            }
        }
    });

    it.each([
        ['17/6 times6', contrast, 120, 20],
        ['7/6 times1/2 with twelve available cells', unusedCells, 10, 10],
        ['1/2 times17/6 without treating17 as a count', storageNumerator, 5, 5],
        ['mixed1 1/2 times3 5/6 without treating23 as a count', mixedNumbers, 20, 10]
    ] as const)('independently classifies %s', (_name, data, derivationUpper, relationUpper) => {
        expect(canonicalLabels(quantities(data.derivation, true))).toEqual([`NumbersSmaller${derivationUpper}`]);
        expect(canonicalLabels(quantities(data.relation, true))).toEqual([`NumbersSmaller${relationUpper}`]);
    });

    it('requires both interpretation calculation orders in Question while withholding the102 subtotal and product', () => {
        const question = visible(render(interpretationId, contrast.derivation, false));
        const solution = visible(render(interpretationId, contrast.derivation, true));
        expect(question).toContain('Show both calculation orders: divide the complete quantity by the denominator and multiply by the numerator; then multiply the numerator by the complete quantity before dividing by the denominator.');
        expect(question).not.toContain('102');
        expect(question).not.toContain('102/6');
        expect(solution).toContain('17 × (6 ÷ 6) = 102/6');
        expect(solution).toContain('(17 × 6) ÷ 6 = 102 ÷ 6 = 102/6');
        const storyQuestion = visible(render(storyId, contrast.relation, false));
        expect(storyQuestion).not.toMatch(/Show both calculation orders|102|Example story:|The answer is|= ______/);
        expect(storyQuestion).toContain('My story:');
        const storySolution = visible(render(storyId, contrast.relation, true));
        expect(storySolution).toContain('The project uses 17 of these pieces');
        expect(storySolution).toContain('The answer is 102/6 meters');
    });

    it('shows a blank equation for a valid future equation-story while retaining one story-writing action', () => {
        const data = profiles[2].data.relation;
        const question = visible(render(storyId, data, false));
        const solution = visible(render(storyId, data, true));
        expect(question).toContain('Write a ribbon story for this product. Preserve the full measured quantity, its equal partitions, and the selected parts.');
        expect(question).toContain('1/2 × 17/6 = ______');
        expect(question).toContain('My story:');
        expect(question).not.toMatch(/17\/12|Example story:|The answer is|Find the product|Solve the equation/);
        expect(solution).toContain('1/2 × 17/6 = 17/12');
        expect(solution).toContain('Example story:');
    });

    it.each(profiles)('preserves product withholding, model tasks and units for $id', profile => {
        const product = format(profile.data.relation.product);
        for (const id of [storyId, wordId]) {
            const question = visible(render(id, profile.data.relation, false));
            const solution = visible(render(id, profile.data.relation, true));
            expect(question).not.toContain(product);
            expect(solution).toContain(product);
            expect(solution).toContain('meter');
            if (id === storyId) {
                expect(question).toContain('My story:');
                expect(solution).toContain('Example story:');
            } else {
                expect(question).toContain('Use an equal-parts bar model with a measured number line to solve the story.');
                expect(question).toContain('Equation: ____________________');
                expect(question).toContain('Answer with units: ____________________');
                expect(question).not.toContain('×');
            }
        }
    });

    it.each(lineages)('independently proves all range selections and receipt replays for %s / %s', (targetId, viewId, generatorId, count) => {
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
            const values = quantities(draw.stub!.data as FractionProductContent, viewId !== wordId);
            expect(draw.labels.map(label => label.slice(label.lastIndexOf('/') + 1)).filter(label => /^Numbers(?:Smaller|Larger)\d+$/.test(label)).sort())
                .toEqual(canonicalLabels(values));
            expect(draw.labels).toContain(Scope.NumbersWithoutNegatives);
            expect(draw.labels).toContain(viewId === wordId ? Scope.NumbersWithoutZero : Scope.NumbersWithZero);
            expect(generatePlannedDraw(input)).toEqual(draw);
        }
    });
});
