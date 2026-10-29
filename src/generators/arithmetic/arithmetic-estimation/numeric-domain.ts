import {random} from '../../../lib/random.ts';
import type {ArithmeticEstimationProblem, ArithmeticOperation} from '../../../types/problems.ts';
import {estimationProposalCases, ProposalCase, proposalSeedCount} from './proposal-domain.ts';

export type EstimationRelation = Omit<ArithmeticEstimationProblem, 'proposal'>;
interface Domain {readonly operation: ArithmeticOperation; readonly minimum: number; readonly maximum: number}
interface Row {
    readonly first: number;
    readonly seconds: readonly number[];
    readonly zeroMass: readonly number[];
    readonly totalMass: readonly number[];
    readonly pairWeight: number;
    readonly weights: readonly [number, number];
}
const cache = new Map<string, readonly Row[]>();
const feasibility = new Map<string, boolean>();
const apply = (left: number, right: number, operation: ArithmeticOperation) => operation === 'addition' ? left + right
    : operation === 'subtraction' ? left - right : operation === 'multiplication' ? left * right : left / right;
const round = (value: number) => Math.round(value / 10) * 10;

export function estimationRelation(domain: Domain, first: number, second: number): EstimationRelation | null {
    const {operation, minimum, maximum} = domain;
    const num1 = operation === 'subtraction' ? first + second : operation === 'division' ? first * second : first;
    const num2 = operation === 'subtraction' || operation === 'division' ? first : second;
    const roundedNum1 = round(num1), roundedNum2 = round(num2);
    if (roundedNum1 === num1 && roundedNum2 === num2 || roundedNum2 === 0) return null;
    const exactAnswer = apply(num1, num2, operation), estimatedAnswer = apply(roundedNum1, roundedNum2, operation);
    if (![num1, num2, roundedNum1, roundedNum2, exactAnswer, estimatedAnswer, round(estimatedAnswer)]
        .every(value => Number.isInteger(value) && value >= minimum && value <= maximum)) return null;
    return {numberDomain: {min: minimum, max: maximum}, num1, num2, roundedNum1, roundedNum2,
        exactAnswer, estimatedAnswer, operation, roundingPlace: 10};
}

export const estimationRelationHasZero = (data: EstimationRelation) => [data.num1, data.num2,
    data.roundedNum1, data.roundedNum2, data.exactAnswer, data.estimatedAnswer, round(data.estimatedAnswer)].includes(0);
const proposalHasZero = (data: EstimationRelation, proposal: ProposalCase) => estimationRelationHasZero(data)
    || proposal.proposedAnswer === 0 || proposal.roundedProposedAnswer === 0;

function* rawRows({operation, minimum, maximum}: Domain) {
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum < 0 || maximum > 1000
        || minimum >= maximum || Math.ceil(minimum / 10) >= Math.floor(maximum / 10)) return;
    const minOperand = Math.max(1, minimum, maximum < 22 ? 1 : 11);
    const firstMax = operation === 'addition' ? Math.min(700, maximum - minOperand)
        : operation === 'subtraction' ? Math.min(400, maximum - minOperand) : Math.min(49, maximum);
    for (let first = minOperand; first <= firstMax; first++) {
        const secondMin = operation === 'division' ? Math.max(2, minimum) : minOperand;
        const secondMax = operation === 'addition' || operation === 'subtraction' ? maximum - first
            : operation === 'multiplication' ? Math.min(49, Math.floor(maximum / first))
                : Math.min(80, Math.floor(maximum / first));
        yield {first, secondMin, secondMax,
            pairWeight: 1 / (firstMax - minOperand + 1) / (secondMax - secondMin + 1)};
    }
}

/** Exact existence review exits on a witness, without constructing the weighted sampler. */
export function hasEstimationProfile(domain: Domain, presence: boolean): boolean {
    const key = JSON.stringify([domain, presence]);
    const known = feasibility.get(key);
    if (known !== undefined) return known;
    // Positive domains exclude every participating zero. With minimum operand11,
    // rounded multiplication is at least100 and each preferred proposal is positive.
    if (presence && (domain.minimum > 0 || domain.operation === 'multiplication' && domain.maximum >= 22)) {
        feasibility.set(key, false); return false;
    }
    for (const {first, secondMin, secondMax} of rawRows(domain)) for (let second = secondMin; second <= secondMax; second++) {
        const data = estimationRelation(domain, first, second);
        if (data && estimationProposalCases(data).some(proposal => proposalHasZero(data, proposal) === presence)) {
            feasibility.set(key, true); return true;
        }
    }
    feasibility.set(key, false);
    return false;
}

/** Full old first/second hierarchy, weighted by exact admissible presentation-seed mass. */
export function estimationRows(domain: Domain): readonly Row[] {
    const key = JSON.stringify(domain);
    const cached = cache.get(key);
    if (cached) return cached;
    const rows: Row[] = [];
    for (const {first, secondMin, secondMax, pairWeight} of rawRows(domain)) {
        const seconds: number[] = [], zeroMass: number[] = [], totalMass: number[] = [];
        const weights: [number, number] = [0, 0];
        for (let second = secondMin; second <= secondMax; second++) {
            const data = estimationRelation(domain, first, second);
            if (!data) continue;
            const proposals = estimationProposalCases(data);
            const total = proposals.reduce((sum, item) => sum + item.seeds, 0) / proposalSeedCount;
            const zero = proposals.reduce((sum, item) => sum + (proposalHasZero(data, item) ? item.seeds : 0), 0) / proposalSeedCount;
            if (!total) continue;
            seconds.push(second); zeroMass.push(zero); totalMass.push(total);
            weights[0] += pairWeight * (total - zero); weights[1] += pairWeight * zero;
        }
        if (seconds.length) rows.push({first, seconds, zeroMass, totalMass, pairWeight, weights});
    }
    cache.set(key, rows);
    return rows;
}

export const estimationProfileMass = (domain: Domain, presence: boolean): number =>
    estimationRows(domain).reduce((sum, row) => sum + row.weights[Number(presence)]!, 0);

const weightedIndex = (weights: readonly number[]): number => {
    let position = random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < weights.length; index++) if ((position -= weights[index]!) < 0) return index;
    return weights.findLastIndex(weight => weight > 0);
};

/** Constructive conditional sampling, without a rare-zero rejection loop. */
export function sampleEstimation(domain: Domain, presence: boolean): ArithmeticEstimationProblem | null {
    const rows = estimationRows(domain);
    const rowIndex = weightedIndex(rows.map(row => row.weights[Number(presence)]!));
    if (rowIndex < 0) return null;
    const row = rows[rowIndex]!;
    const secondIndex = weightedIndex(row.seconds.map((_, index) => presence ? row.zeroMass[index]!
        : row.totalMass[index]! - row.zeroMass[index]!));
    const data = estimationRelation(domain, row.first, row.seconds[secondIndex]!)!;
    const proposals = estimationProposalCases(data).filter(proposal => proposalHasZero(data, proposal) === presence);
    const chosen = proposals[weightedIndex(proposals.map(proposal => proposal.seeds))]!;
    return {...data, proposal: {proposedAnswer: chosen.proposedAnswer, roundedProposedAnswer: chosen.roundedProposedAnswer}};
}
