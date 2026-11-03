import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {NumericalExpressionNode, NumericalExpressionProblem,
    NumericalExpressionStructureNode, NumericalExpressionStructureProblem} from '../../types/problems.ts';

import type {NumericalExpressionProfile, NumericalExpressionProjection, NumericalExpressionStructure} from './numerical-expression-profiles.ts';
export {numericalExpressionProfiles} from './numerical-expression-profiles.ts';
export type {NumericalExpressionProfile, NumericalExpressionProjection, NumericalExpressionStructure} from './numerical-expression-profiles.ts';
export interface NumericalExpressionFrame {
    readonly structure: NumericalExpressionStructure;
    readonly factor: number;
    readonly first: number;
    readonly second: number;
    readonly operation: 'addition' | 'subtraction' | 'multiplication';
    readonly weight: number;
}

// LCM(13..29): the original conditional second-operand pool sizes. All tickets
// and their total (440 * LCM) remain exact safe integers.
const groupedWeightDenominator = 2329089562800;
const sourceFrames = new Map<NumericalExpressionStructure, readonly NumericalExpressionFrame[]>();
function originalFrames(structure: NumericalExpressionStructure): readonly NumericalExpressionFrame[] {
    const cached = sourceFrames.get(structure);
    if (cached) return cached;
    const rows: NumericalExpressionFrame[] = [];
    if (structure === 'grouped') {
        for (let factor = 2; factor <= 5; factor++) for (let first = 16; first <= 70; first++) {
            const last = Math.min(30, first - 2);
            for (let second = 2; second <= last; second++) for (const operation of ['addition', 'subtraction'] as const) {
                rows.push({structure, factor, first, second, operation,
                    weight: groupedWeightDenominator / (last - 1)});
            }
        }
    } else {
        for (let factor = 2; factor <= 10; factor++) for (let first = 2; first <= 10; first++)
            for (let second = 2; second <= 10; second++) {
                rows.push({structure, factor, first, second, operation: 'multiplication', weight: 1});
            }
    }
    sourceFrames.set(structure, rows);
    return rows;
}

/** Syntax uses literals; calculation additionally uses every required subtotal and result. */
export function numericalExpressionQuantities(frame: NumericalExpressionFrame, projection: NumericalExpressionProjection): number[] {
    const inputs = [frame.factor, frame.first, frame.second];
    if (projection === 'structure') return inputs;
    const reference = frame.operation === 'addition' ? frame.first + frame.second
        : frame.operation === 'subtraction' ? frame.first - frame.second : frame.first * frame.second;
    return [...inputs, reference, frame.factor * reference];
}

const domains = new Map<string, readonly NumericalExpressionFrame[]>();
/** Conditions the complete old source law on a profile selected before any mathematical draw. */
export function numericalExpressionRows(projection: NumericalExpressionProjection,
    profile: NumericalExpressionProfile): readonly NumericalExpressionFrame[] {
    if (!['structure', 'calculation'].includes(projection) || !profile
        || !['grouped', 'ungrouped'].includes(profile.structure) || !profile.range) {
        throw new GeneratorValidationError('numerical-expression-domain', 'Expected a mathematical expression profile.');
    }
    const {range, structure} = profile;
    let expected: CanonicalNumericRange;
    try { expected = createCanonicalNumericRange(range.max, range.min); }
    catch { throw new GeneratorValidationError('numerical-expression-domain', 'Unsupported canonical expression range.'); }
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('numerical-expression-domain', 'Canonical expression witnesses are missing or inconsistent.');
    }
    const key = `${projection}:${structure}:${range.min}:${range.max}`;
    if (!domains.has(key)) domains.set(key, originalFrames(structure).filter(frame =>
        hasCanonicalRangeWitness(numericalExpressionQuantities(frame, projection), range)));
    return domains.get(key)!;
}

const tickets = new WeakMap<readonly NumericalExpressionFrame[], {ends: readonly number[]; total: number}>();
/** A single cumulative ticket preserves each original path's conditional probability. */
export function sampleNumericalExpressionFrame(rows: readonly NumericalExpressionFrame[], draw: () => number): NumericalExpressionFrame | undefined {
    if (!rows.length) return undefined;
    let pool = tickets.get(rows);
    if (!pool) {
        let total = 0;
        const ends = rows.map(row => total += row.weight);
        pool = {ends, total};
        tickets.set(rows, pool);
    }
    const value = draw();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new GeneratorValidationError('numerical-expression-domain', 'A source ticket must lie in [0, 1).');
    }
    const ticket = value * pool.total;
    let low = 0, high = rows.length - 1;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (ticket < pool.ends[middle]!) high = middle;
        else low = middle + 1;
    }
    return rows[low]!;
}

/** The canonical syntax contract contains no evaluated operation or group values. */
export function numericalExpressionStructureProblem(frame: NumericalExpressionFrame): NumericalExpressionStructureProblem {
    const reference: NumericalExpressionStructureNode = {kind: 'operation', operation: frame.operation,
        left: {kind: 'number', value: frame.first}, right: {kind: 'number', value: frame.second}};
    return {expression: {kind: 'operation', operation: 'multiplication', left: {kind: 'number', value: frame.factor},
        right: frame.structure === 'grouped' ? {kind: 'group', expression: reference} : reference},
    multiplicativeComparison: {reference, factor: frame.factor}};
}

function evaluatedNode(node: NumericalExpressionStructureNode): NumericalExpressionNode {
    if (node.kind === 'number') return {...node};
    if (node.kind === 'group') {
        const expression = evaluatedNode(node.expression);
        return {kind: 'group', expression, value: expression.value};
    }
    const left = evaluatedNode(node.left), right = evaluatedNode(node.right);
    return {kind: 'operation', operation: node.operation, left, right,
        value: node.operation === 'addition' ? left.value + right.value
            : node.operation === 'subtraction' ? left.value - right.value
                : node.operation === 'multiplication' ? left.value * right.value : left.value / right.value};
}

/** Exact calculated evidence is added only for the calculation producer. */
export function numericalExpressionCalculationProblem(frame: NumericalExpressionFrame): NumericalExpressionProblem {
    const source = numericalExpressionStructureProblem(frame);
    return {expression: evaluatedNode(source.expression), multiplicativeComparison: {
        factor: frame.factor, reference: evaluatedNode(source.multiplicativeComparison!.reference)}};
}
