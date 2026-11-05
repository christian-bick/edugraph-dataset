import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {ArithmeticEstimationProblem, ArithmeticOperation} from '../../../types/problems.ts';
import {estimationRawRows, estimationRelation, type EstimationConstructionDomain, type EstimationRelation} from './numeric-domain.ts';
import {estimationProposalCases, proposalSeedCount, type ProposalCase} from './proposal-domain.ts';

interface Row {readonly source: EstimationConstructionDomain; readonly first: number;
    readonly seconds: readonly number[]; readonly masses: readonly number[]; readonly weight: number}
export interface CanonicalEstimationDomain {readonly rows: readonly Row[]; readonly weight: number}
const cache = new Map<string, CanonicalEstimationDomain>(), feasibility = new Map<string, boolean>();
interface Admission {readonly cases: readonly ProposalCase[]; readonly mass: number}
type AdmissionCache = readonly Map<number, Admission>[];
const admissions = new Map<string, AdmissionCache>();
const emptyAdmission: Admission = {cases: [], mass: 0};

/** Prepare the unchanged domain/zero/range prefix once per source row. Numeric
 * Map keys preserve the original Number-to-string equality for NaN and signed0. */
function admissionCache(minimum: number, maximum: number, zero: boolean, range: CanonicalNumericRange): AdmissionCache {
    const key = `${minimum}:${maximum}:${zero}:${range.min}:${range.max}`;
    let result = admissions.get(key);
    if (!result) {
        result = Array.from({length: 8}, () => new Map<number, Admission>());
        admissions.set(key, result);
    }
    return result;
}
const uppers = [10, 20, 100, 120, 1000], lowers = [0, 5, 10, 20, 100, 120];
const invalid = (message: string) => new GeneratorValidationError('arithmetic-estimation', message);
const round = (value: number) => Math.round(value / 10) * 10;

export const estimationQuantities = (data: ArithmeticEstimationProblem | EstimationRelation): number[] => [
    data.num1, data.num2, data.roundedNum1, data.roundedNum2, data.exactAnswer, data.estimatedAnswer, round(data.estimatedAnswer),
    ...('proposal' in data ? [data.proposal.proposedAnswer, data.proposal.roundedProposedAnswer] : [])
];

function validate(operation: ArithmeticOperation, zero: boolean, range: CanonicalNumericRange): string {
    if (!['addition', 'subtraction', 'multiplication', 'division'].includes(operation) || typeof zero !== 'boolean'
        || !range || ![5, ...uppers].includes(range.max) || !lowers.includes(range.min) || range.min >= range.max) throw invalid('Expected a reviewed operation, zero profile and canonical range.');
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) throw invalid('Canonical range witnesses are missing or inconsistent.');
    return `${operation}:${zero}:${range.min}:${range.max}`;
}

/** A wider construction context may have different legitimate seeded proposals. Keep those paths. */
export const estimationConstructionContexts = (operation: ArithmeticOperation, range: CanonicalNumericRange): EstimationConstructionDomain[] =>
    uppers.filter(upper => upper >= range.max).flatMap(upper => lowers.filter(lower => lower < upper && lower <= range.min)
        .map(lower => ({operation, minimum: lower, maximum: upper})));

function admission(data: EstimationRelation, zero: boolean, range: CanonicalNumericRange, prepared?: AdmissionCache): Admission {
    const minimum = Math.min(data.num1, data.num2, data.roundedNum1, data.roundedNum2, data.exactAnswer, data.estimatedAnswer, round(data.estimatedAnswer));
    const maximum = Math.max(data.num1, data.num2, data.roundedNum1, data.roundedNum2, data.exactAnswer, data.estimatedAnswer, round(data.estimatedAnswer));
    const baseZero = minimum === 0;
    if (minimum < range.min || maximum > range.max || !zero && baseZero) return emptyAdmission;
    const needUpper = maximum <= range.maximumAbove, needLower = minimum >= range.minimumBelow;
    // The complete relation affects proposal admission only through these booleans.
    const flags = (baseZero ? 4 : 0) | (needUpper ? 2 : 0) | (needLower ? 1 : 0);
    const cache = (prepared ?? admissionCache(data.numberDomain.min, data.numberDomain.max, zero, range))[flags]!;
    let result = cache.get(data.estimatedAnswer);
    if (!result) {
        const cases = estimationProposalCases(data).filter(proposal => {
            const low = Math.min(proposal.proposedAnswer, proposal.roundedProposedAnswer);
            const high = Math.max(proposal.proposedAnswer, proposal.roundedProposedAnswer);
            return (baseZero || low === 0) === zero && low >= range.min && high <= range.max
                && (!needUpper || high > range.maximumAbove) && (!needLower || low < range.minimumBelow);
        });
        result = {cases, mass: cases.reduce((sum, proposal) => sum + proposal.seeds, 0) / proposalSeedCount};
        cache.set(data.estimatedAnswer, result);
    }
    return result;
}
export const canonicalEstimationCases = (data: EstimationRelation, zero: boolean, range: CanonicalNumericRange): readonly ProposalCase[] =>
    admission(data, zero, range).cases;

function* sourceRows(operation: ArithmeticOperation, range: CanonicalNumericRange) {
    for (const source of estimationConstructionContexts(operation, range)) {
        for (const row of estimationRawRows(source)) {
            if (row.first < range.min || row.first > range.max) continue;
            const firstSecond = Math.max(row.secondMin, range.min);
            const lastSecond = Math.min(row.secondMax, operation === 'addition' || operation === 'subtraction'
                ? range.max - row.first : Math.floor(range.max / row.first));
            if (firstSecond <= lastSecond) yield {source, ...row, firstSecond, lastSecond};
        }
    }
}

export function hasCanonicalEstimationProfile(operation: ArithmeticOperation, zero: boolean, range: CanonicalNumericRange): boolean {
    const key = validate(operation, zero, range);
    if (feasibility.has(key)) return feasibility.get(key)!;
    if (zero && range.min > 0 || range.min > 49 && ['multiplication', 'division'].includes(operation)) {
        feasibility.set(key, false); return false;
    }
    for (const row of sourceRows(operation, range)) for (let second = row.firstSecond; second <= row.lastSecond; second++) {
        const data = estimationRelation(row.source, row.first, second);
        if (data && canonicalEstimationCases(data, zero, range).length) {feasibility.set(key, true); return true;}
    }
    feasibility.set(key, false); return false;
}

/** Conditions the finite union of old pair/proposal paths, without balancing new semantic classes. */
export function canonicalEstimationDomain(operation: ArithmeticOperation, zero: boolean, range: CanonicalNumericRange): CanonicalEstimationDomain {
    const key = validate(operation, zero, range);
    if (!cache.has(key)) {
        if (!hasCanonicalEstimationProfile(operation, zero, range)) {
            const empty = {rows: [], weight: 0}; cache.set(key, empty); return empty;
        }
        const rows: Row[] = [];
        let weight = 0;
        for (const row of sourceRows(operation, range)) {
            const context = admissionCache(row.source.minimum, row.source.maximum, zero, range);
            const seconds: number[] = [], masses: number[] = [];
            let rowWeight = 0;
            for (let second = row.firstSecond; second <= row.lastSecond; second++) {
                const data = estimationRelation(row.source, row.first, second);
                if (!data) continue;
                const mass = admission(data, zero, range, context).mass;
                if (!mass) continue;
                seconds.push(second); masses.push(mass); rowWeight += row.pairWeight * mass;
            }
            if (seconds.length) {rows.push({source: row.source, first: row.first, seconds, masses, weight: rowWeight}); weight += rowWeight;}
        }
        cache.set(key, {rows, weight});
    }
    return cache.get(key)!;
}

function weightedIndex(weights: readonly number[]): number {
    let position = random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (const [index, weight] of weights.entries()) if ((position -= weight) < 0) return index;
    return weights.findLastIndex(weight => weight > 0);
}

export function sampleCanonicalEstimation(operation: ArithmeticOperation, zero: boolean, range: CanonicalNumericRange): ArithmeticEstimationProblem | null {
    const domain = canonicalEstimationDomain(operation, zero, range);
    if (!domain.weight) return null;
    const row = domain.rows[weightedIndex(domain.rows.map(row => row.weight))]!;
    const second = row.seconds[weightedIndex(row.masses)]!;
    const data = estimationRelation(row.source, row.first, second)!;
    const cases = canonicalEstimationCases(data, zero, range), chosen = cases[weightedIndex(cases.map(proposal => proposal.seeds))]!;
    return {...data, proposal: {proposedAnswer: chosen.proposedAnswer, roundedProposedAnswer: chosen.roundedProposedAnswer}};
}
