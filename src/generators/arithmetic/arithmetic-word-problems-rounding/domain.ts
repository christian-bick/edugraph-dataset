import {Area} from 'edugraph-ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';
import {roundingProposalInterval, type ProposalInterval} from './proposal-domain.ts';

type Operations = readonly [ArithmeticOperation, ArithmeticOperation];
export interface RoundingCore {
    readonly a: number; readonly b: number; readonly c: number;
    readonly intermediate: number; readonly answer: number;
    readonly roundingPlace: 10 | 100 | 1000 | 10000 | 100000;
    readonly roundedAnswer: number;
    readonly minimum: number; readonly maximum: number;
    readonly sourceMinimum: number; readonly proposalLower: number; readonly proposalCount: number;
}
export const roundingOperationProfiles = [
    {labels: [Area.Addition], operations: ['addition', 'addition']},
    {labels: [Area.Subtraction], operations: ['subtraction', 'subtraction']},
    {labels: [Area.Multiplication], operations: ['multiplication', 'multiplication']},
    {labels: [Area.Division], operations: ['division', 'division']},
    {labels: [Area.Addition, Area.Subtraction], operations: ['addition', 'subtraction']},
    {labels: [Area.Addition, Area.Multiplication], operations: ['multiplication', 'addition']},
    {labels: [Area.Addition, Area.Division], operations: ['division', 'addition']},
    {labels: [Area.Subtraction, Area.Multiplication], operations: ['multiplication', 'subtraction']},
    {labels: [Area.Subtraction, Area.Division], operations: ['division', 'subtraction']},
    {labels: [Area.Multiplication, Area.Division], operations: ['multiplication', 'division']}
] as const;
export const roundingRangeProfiles = canonicalRangeProfiles.filter(p => p.range.max >= 10 && [0, 5, 10, 20].includes(p.range.min));
export const roundingRangeLabels = [...new Set(roundingRangeProfiles.flatMap(p => p.labels))];
const key = (labels: readonly string[]) => [...labels].sort().join('|');
const ranges = new Map(roundingRangeProfiles.map(p => [key(p.labels), p.range]));
export const roundingRangeForLabels = (labels: readonly string[]) => ranges.get(key(labels.filter(l => roundingRangeLabels.includes(l))));
export const roundingOperationsForLabels = (labels: readonly string[]) => roundingOperationProfiles
    .find(p => key(p.labels) === key(labels.filter(l => [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division].includes(l as never))))?.operations;
const coreCache = new Map<string, readonly RoundingCore[]>();

const apply = (a: number, b: number, op: ArithmeticOperation) => op === 'addition' ? a + b
    : op === 'subtraction' ? a - b : op === 'multiplication' ? a * b : a / b;

/** The old global primitive pool is finite. Floors5/10 only remove rows. The
 * four special division/factor constructors additionally have a genuine floor20
 * singleton small-factor pool; keep those exact corners, not a widened2..20. */
export function roundingCores(operations: Operations): readonly RoundingCore[] {
    const sequence = operations.join('-'), previous = coreCache.get(sequence);
    if (previous) return previous;
    const rows: RoundingCore[] = [];
    const push = (a: number, b: number, c: number, intermediate: number, answer: number, sourceMinimum: number) => {
        const values = [a, b, c, intermediate, answer];
        if (!values.every(v => Number.isInteger(v) && v >= sourceMinimum && v <= 999999) || answer < Math.max(5, sourceMinimum)) return;
        const roundingPlace = 10 ** Math.max(1, Math.min(5, Math.floor(Math.log10(answer)))) as RoundingCore['roundingPlace'];
        const roundedAnswer = Math.round(answer / roundingPlace) * roundingPlace;
        const interval = roundingProposalInterval({answer, roundingPlace, roundedAnswer, numberDomain: {min: sourceMinimum, max: 1000000}});
        if (!interval) return;
        rows.push({a, b, c, intermediate, answer, roundingPlace, roundedAnswer,
            minimum: Math.min(...values, roundedAnswer), maximum: Math.max(...values, roundedAnswer),
            sourceMinimum, proposalLower: interval.lower, proposalCount: interval.upper - interval.lower});
    };
    for (const minimum of [1, 20]) {
        if (minimum === 20 && !['division-division', 'division-addition', 'division-subtraction', 'multiplication-division'].includes(sequence)) continue;
        const first = Math.max(2, minimum), small = Math.max(first, sequence === 'multiplication-division' ? 10 : 12);
        if (sequence === 'division-division') {
            for (let answer = first; answer <= 50; answer++) for (let b = first; b <= small; b++) for (let c = first; c <= small; c++)
                push(answer * c * b, b, c, answer * c, answer, minimum);
        } else if (sequence === 'division-addition') {
            for (let intermediate = first; intermediate <= 50; intermediate++) for (let b = first; b <= small; b++) for (let c = first; c <= 50; c++)
                push(intermediate * b, b, c, intermediate, intermediate + c, minimum);
        } else if (sequence === 'division-subtraction') {
            for (let answer = first; answer <= 50; answer++) for (let b = first; b <= small; b++) for (let c = first; c <= 50; c++)
                push((answer + c) * b, b, c, answer + c, answer, minimum);
        } else if (sequence === 'multiplication-division') {
            for (let a = first; a <= 50; a++) for (let factor = first; factor <= small; factor++) for (let c = first; c <= small; c++)
                push(a, factor * c, c, a * factor * c, a * factor, minimum);
        } else if (sequence === 'subtraction-subtraction') {
            for (let answer = first; answer <= 50; answer++) for (let b = first; b <= 50; b++) for (let c = first; c <= 50; c++)
                push(answer + c + b, b, c, answer + c, answer, minimum);
        } else {
            for (let a = first; a <= 50; a++) for (let b = first; b <= 50; b++) for (let c = first; c <= 50; c++) {
                const intermediate = apply(a, b, operations[0]);
                push(a, b, c, intermediate, apply(intermediate, c, operations[1]), minimum);
            }
        }
    }
    coreCache.set(sequence, rows);
    return rows;
}

/** Both proposal values are monotone in P. Therefore canonical maximum/minimum
 * witnesses each clip one interval, with the exact answer removed by rank. */
export function canonicalProposalInterval(row: RoundingCore, range: CanonicalNumericRange): ProposalInterval | null {
    if (row.maximum > range.max || row.minimum < range.min) return null;
    const R = row.roundingPlace;
    let lower = Math.max(row.proposalLower, range.min, Math.ceil(range.min / R) * R - R / 2);
    let upper = Math.min(1000000, range.max, Math.floor(range.max / R) * R + R / 2 - 1);
    if (row.maximum <= range.maximumAbove)
        lower = Math.max(lower, Math.min(range.maximumAbove + 1, (Math.floor(range.maximumAbove / R) + 1) * R - R / 2));
    if (row.minimum >= range.minimumBelow)
        upper = Math.min(upper, Math.max(range.minimumBelow - 1, (Math.ceil(range.minimumBelow / R) - 1) * R + R / 2 - 1));
    const count = upper - lower + 1 - Number(row.answer >= lower && row.answer <= upper);
    return count > 0 ? {lower, upper} : null;
}
export interface RoundingDomain {readonly rows: readonly RoundingCore[]; readonly cumulative: Float64Array; readonly weight: number}
const domains = new Map<string, RoundingDomain>();
export function roundingDomain(operations: Operations, range: CanonicalNumericRange): RoundingDomain {
    const profile = roundingRangeProfiles.find(p => p.range.max === range.max && p.range.min === range.min);
    if (!profile || profile.range.maximumAbove !== range.maximumAbove || profile.range.minimumBelow !== range.minimumBelow)
        throw new GeneratorValidationError('arithmetic-word-problems-rounding', 'Select a supported canonical rounding-judgement range.');
    const id = `${operations.join('-')}:${range.max}:${range.min}`, previous = domains.get(id);
    if (previous) return previous;
    const rows = roundingCores(operations), cumulative = new Float64Array(rows.length);
    let weight = 0;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!, interval = canonicalProposalInterval(row, range);
        if (interval) weight += (interval.upper - interval.lower + 1
            - Number(row.answer >= interval.lower && row.answer <= interval.upper)) / row.proposalCount;
        cumulative[i] = weight;
    }
    const result = {rows, cumulative, weight};
    domains.set(id, result);
    return result;
}
export function selectRoundingCore(domain: RoundingDomain, draw: number): RoundingCore {
    if (domain.weight <= 0) throw new GeneratorValidationError('arithmetic-word-problems-rounding', 'No rounding judgements satisfy this canonical domain.');
    let first = 0, last = domain.rows.length - 1;
    const rank = draw * domain.weight;
    while (first < last) {
        const middle = Math.floor((first + last) / 2);
        if (domain.cumulative[middle]! > rank) last = middle; else first = middle + 1;
    }
    return domain.rows[first]!;
}
