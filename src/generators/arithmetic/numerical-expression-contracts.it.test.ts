import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {beforeAll, describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {loadGeneratorCatalog, loadViewCatalog, type GeneratorCatalogEntry,
    type ViewCatalogEntry} from '../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {buildCompatibleModulePairIndex, matchTargets, type MatchTuple} from '../../lib/matching.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import {loadMatchingTargets} from '../../lib/spec-validator.ts';
import type {ExactNumericalExpressionNode, ExactNumericValue, NumericalExpressionNode,
    NumericalExpressionStructureNode} from '../../types/problems.ts';

type Node = ExactNumericalExpressionNode | NumericalExpressionNode | NumericalExpressionStructureNode;
type Rational = readonly [bigint, bigint];
const rational = (numerator: bigint, denominator = 1n): Rational => denominator < 0n
    ? [-numerator, -denominator] : [numerator, denominator];
const asRational = (value: number | ExactNumericValue): Rational => typeof value === 'number'
    ? rational(BigInt(value)) : rational(BigInt(value.numerator), BigInt(value.denominator));
const multiply = ([a, b]: Rational, [c, d]: Rational): Rational => rational(a * c, b * d);
const magnitude = ([n, d]: Rational): Rational => [n < 0n ? -n : n, d];
const compare = ([a, b]: Rational, [c, d]: Rational): number => a * d < c * b ? -1 : a * d > c * b ? 1 : 0;

/** Independent arithmetic: payload result fields and production evaluators are never consulted. */
function evaluate(node: Node): Rational {
    if (node.kind === 'number') return asRational(node.value);
    if (node.kind === 'group') return evaluate(node.expression);
    if (node.kind === 'negation') {const [n, d] = evaluate(node.operand); return [-n, d];}
    if (node.kind === 'power') {
        const [n, d] = evaluate(node.base);
        return rational(n ** BigInt(node.exponent), d ** BigInt(node.exponent));
    }
    const [a, b] = evaluate(node.left), [c, d] = evaluate(node.right);
    if (node.operation === 'addition') return rational(a * d + c * b, b * d);
    if (node.operation === 'subtraction') return rational(a * d - c * b, b * d);
    if (node.operation === 'multiplication') return rational(a * c, b * d);
    return rational(a * d, b * c);
}

function quantities(node: Node, calculation: boolean): Rational[] {
    if (node.kind === 'number') return [asRational(node.value)];
    const values: Rational[] = calculation ? [evaluate(node)] : [];
    if (node.kind === 'group') return [...values, ...quantities(node.expression, calculation)];
    if (node.kind === 'negation') return [...values, ...quantities(node.operand, calculation)];
    if (node.kind === 'power') {
        const base = evaluate(node.base);
        values.push(rational(BigInt(node.exponent)), ...quantities(node.base, calculation));
        if (calculation) {
            let product = base;
            for (let exponent = 2; exponent <= node.exponent; exponent++) {
                product = multiply(product, base);
                values.push(product);
            }
        }
        return values;
    }
    return [...values, ...quantities(node.left, calculation), ...quantities(node.right, calculation)];
}

const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];
const labelName = (label: string): string => label.slice(label.lastIndexOf('/') + 1);
function canonicalLabels(values: readonly Rational[]): string[] {
    const magnitudes = values.map(magnitude).sort(compare);
    const upper = thresholds.find(value => compare(magnitudes.at(-1)!, rational(BigInt(value))) <= 0);
    const lower = thresholds.findLast(value => compare(magnitudes[0]!, rational(BigInt(value))) >= 0) ?? 0;
    if (upper === undefined || lower >= upper) throw new Error('The quantity set has no admitted canonical band.');
    return [`NumbersSmaller${upper}`, ...(lower ? [`NumbersLarger${lower}`] : [])].sort();
}

const generatorTypes = {
    'arithmetic-numerical-expressions': 'NumericalExpressionStructureProblem',
    'arithmetic-numerical-expression-calculations': 'NumericalExpressionProblem',
    'numerical-power-expression-syntax': 'NumericalPowerExpressionSyntaxProblem',
    'numerical-power-expressions': 'NumericalPowerExpressionProblem'
} as const;
const viewGenerators = {
    'operations-grouping-write': 'arithmetic-numerical-expressions',
    'operations-grouping-evaluate': 'arithmetic-numerical-expression-calculations',
    'operations-numerical-expression-write': 'arithmetic-numerical-expressions',
    'operations-numerical-expression-interpretation': 'arithmetic-numerical-expressions',
    'numerical-power-expression-write': 'numerical-power-expression-syntax',
    'numerical-power-expression-evaluate': 'numerical-power-expressions'
} as const;
const lineages = [
    ['5.OA.A.1-use-grouping~41de8f45', 'operations-grouping-write'],
    ['5.OA.A.1-evaluate-grouped-expressions~212996d5', 'operations-grouping-evaluate'],
    ['5.OA.A.2-write-numerical-expression~7831f547', 'operations-numerical-expression-write'],
    ['5.OA.A.2-interpret-numerical-expression~43e94b7c', 'operations-numerical-expression-interpretation'],
    ['5.OA.A.2-write-numerical-expression~7831f547', 'numerical-power-expression-write'],
    ['6.EE.A.1-write-power-expressions~f13db165', 'numerical-power-expression-write'],
    ['6.EE.A.1-write-power-expressions~4dcb1b0b', 'numerical-power-expression-write'],
    ['6.EE.A.1-evaluate-power-expressions~53f64352', 'numerical-power-expression-evaluate'],
    ['6.EE.A.1-evaluate-power-expressions~6fd32078', 'numerical-power-expression-evaluate']
] as const;

let generators: GeneratorCatalogEntry[];
let views: ViewCatalogEntry[];
let tuples: MatchTuple[];
beforeAll(async () => {
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    [generators, views] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map(Object.keys(generatorTypes).map(id =>
            [id, resolve(root, 'src/generators/arithmetic', id, 'spec.ts')]))),
        loadViewCatalog(undefined, undefined, new Map(Object.keys(viewGenerators).map(id =>
            [id, resolve(root, 'src/visuals/views/operations', id, 'spec.ts')])))
    ]);
    tuples = matchTargets(await loadMatchingTargets('ccss'), generators, views).tuples;
});

describe('separate numerical expression syntax and calculation contracts', () => {
    it('keeps nominal payload boundaries independent of target-label preconditions', () => {
        expect(generators).toHaveLength(4);
        expect(views).toHaveLength(6);
        for (const generator of generators) expect(generator.problemType).toBe(generatorTypes[generator.generatorId as keyof typeof generatorTypes]);
        for (const view of views) {
            const producer = viewGenerators[view.viewId as keyof typeof viewGenerators];
            expect(view.problemType).toBe(generatorTypes[producer]);
        }
        const pairs = buildCompatibleModulePairIndex(generators, views).orderedPairs.map(pair =>
            `${pair.generator.generatorId}#${pair.view.viewId}`).sort();
        expect(pairs).toEqual(Object.entries(viewGenerators).map(([view, generator]) => `${generator}#${view}`).sort());
    });

    it('preserves all nine real CCSS target/view lineages without widening their routing', () => {
        expect(tuples.map(tuple => `${tuple.target.id}#${tuple.viewId}`).sort())
            .toEqual(lineages.map(([target, view]) => `${target}#${view}`).sort());
        for (const tuple of tuples) expect(tuple.generatorId).toBe(viewGenerators[tuple.viewId as keyof typeof viewGenerators]);
    });

    it('counts only task quantities and retains inclusive minimum/maximum endpoint meaning', () => {
        const power: ExactNumericalExpressionNode = {id: 'p', kind: 'power', exponent: 3,
            base: {id: 'b', kind: 'number', value: {numerator: 3, denominator: 1}, notation: {kind: 'integer', numeral: '3'}}};
        expect(canonicalLabels(quantities(power, false))).toEqual(['NumbersSmaller5']);
        expect(canonicalLabels(quantities(power, true))).toEqual(['NumbersSmaller100']);
        const fractionalPower: ExactNumericalExpressionNode = {id: 'fraction-power', kind: 'power', exponent: 3,
            base: {id: 'fraction-base', kind: 'number', value: {numerator: 3, denominator: 4},
                notation: {kind: 'fraction', numerator: 3, denominator: 4}}};
        expect(canonicalLabels(quantities(fractionalPower, true))).toEqual(['NumbersSmaller5']);
        const grouped: NumericalExpressionStructureNode = {kind: 'operation', operation: 'multiplication',
            left: {kind: 'number', value: 2}, right: {kind: 'group', expression: {kind: 'operation', operation: 'addition',
                left: {kind: 'number', value: 16}, right: {kind: 'number', value: 2}}}};
        expect(canonicalLabels(quantities(grouped, false))).toEqual(['NumbersSmaller20']);
        expect(canonicalLabels(quantities(grouped, true))).toEqual(['NumbersSmaller100']);
        expect(canonicalLabels([rational(90n), rational(80n), rational(10n)]))
            .toEqual(['NumbersLarger10', 'NumbersSmaller100']);
        expect(canonicalLabels([rational(10n), rational(10n), rational(20n)]))
            .toEqual(['NumbersLarger10', 'NumbersSmaller20']);
        expect(() => canonicalLabels([rational(5n), rational(5n)])).toThrow('no admitted canonical band');
    });

    it.each(lineages)('proves every admitted quantity/range selection and exact replay for %s / %s', (targetId, viewId) => {
        const tuple = tuples.find(tuple => tuple.target.id === targetId && tuple.viewId === viewId)!;
        expect(tuple).toBeDefined();
        const generator = generators.find(generator => generator.generatorId === tuple.generatorId)!;
        const view = views.find(view => view.viewId === tuple.viewId)!;
        const enumeration = enumerateDependencyAuditSelections(tuple.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).not.toHaveLength(0);
        for (const selection of enumeration.selections) for (let seed = 0; seed < 8; seed++) {
            const sampleKey = `${targetId}#${tuple.generatorId}#${viewId}#train#question#inst:0`;
            const input = {generator: generator.generator, generatorSpec: generator.spec,
                viewSchema: view.schema, viewSpec: view.spec, plan: tuple.plan,
                sampleKey, seed, attempt: 1, replay: {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(tuple.plan, selection.choices)}};
            const draw = generatePlannedDraw(input);
            expect(draw.stub).not.toBeNull();
            const data = draw.stub!.data as {expression: Node};
            const values = quantities(data.expression, viewId.endsWith('evaluate'));
            const actualRange = draw.labels.map(labelName).filter(label => /^Numbers(?:Smaller|Larger)\d+$/.test(label)).sort();
            expect(actualRange, `${viewId}: ${selection.variantHash} / seed ${seed}`).toEqual(canonicalLabels(values));
            expect(draw.labels).toContain(values.some(([n]) => n < 0n) ? Scope.NumbersWithNegatives : Scope.NumbersWithoutNegatives);
            expect(draw.labels).toContain(values.some(([n]) => n === 0n) ? Scope.NumbersWithZero : Scope.NumbersWithoutZero);
            expect(generatePlannedDraw(input)).toEqual(draw);
        }
    });
});
