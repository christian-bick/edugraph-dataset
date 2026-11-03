import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {FractionScaleComparisonProblem, FractionScaleRational, FractionScaleRelationProblem} from '../../types/problems.ts';

export const fractionScaleProfiles = ['greater', 'less', 'equal'] as const;
export type FractionScaleProfile = typeof fractionScaleProfiles[number];
export type FractionScaleContract = 'comparison' | 'analogy';
export type FractionScaleFrame = Readonly<{q: number; a: number; b: number}>;
export type WeightedFractionScaleFrame = FractionScaleFrame & {readonly weight: number};

export function fractionScaleUpperBounds(profile: FractionScaleProfile): readonly number[] {
    if (!fractionScaleProfiles.includes(profile))
        throw new GeneratorValidationError('fraction-scaling', 'Choose a supported comparison profile.');
    return profile === 'greater' ? [5, 10, 20] : [5, 10];
}

const nativeDomains = new Map<FractionScaleProfile, readonly WeightedFractionScaleFrame[]>();

/** Integer weights preserve uniform q, uniform b, then uniform a conditional on b. */
export function fractionScaleNativeDomain(profile: FractionScaleProfile): readonly WeightedFractionScaleFrame[] {
    fractionScaleUpperBounds(profile);
    const cached = nativeDomains.get(profile);
    if (cached) return cached;
    const rows: WeightedFractionScaleFrame[] = [];
    for (let q = 2; q <= 5; q++) for (let b = 2; b <= 6; b++) {
        const first = profile === 'greater' ? b + 1 : profile === 'less' ? 1 : b;
        const last = profile === 'greater' ? 2 * b - 1 : profile === 'less' ? b - 1 : b;
        for (let a = first; a <= last; a++)
            rows.push({q, a, b, weight: profile === 'equal' ? 60 : 60 / (b - 1)});
    }
    nativeDomains.set(profile, rows);
    return rows;
}

/** Observable equal-part quantities; unused exact product and difference are not range inputs. */
export function fractionScaleQuantities(frame: FractionScaleFrame, contract: FractionScaleContract): readonly FractionScaleRational[] {
    if (contract !== 'comparison' && contract !== 'analogy')
        throw new GeneratorValidationError('fraction-scaling', 'Choose a supported scaling contract.');
    const {q, a, b} = frame;
    return [{numerator: q, denominator: 1}, {numerator: a, denominator: b},
        {numerator: q, denominator: b}, {numerator: a, denominator: 1},
        {numerator: b, denominator: 1}, {numerator: 1, denominator: 1},
        ...(contract === 'analogy' ? [{numerator: 2, denominator: 1}, {numerator: 2 * q, denominator: 1}] : [])];
}

const rangedDomains = new Map<string, readonly WeightedFractionScaleFrame[]>();
export function fractionScaleDomain(contract: FractionScaleContract, profile: FractionScaleProfile,
    range: CanonicalNumericRange): readonly WeightedFractionScaleFrame[] {
    const allowed = fractionScaleUpperBounds(profile);
    if (!range || range.min !== 0 || !allowed.includes(range.max))
        throw new GeneratorValidationError('fraction-scaling', 'Choose a feasible canonical scaling range.');
    const canonical = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== canonical.maximumAbove || range.minimumBelow !== canonical.minimumBelow)
        throw new GeneratorValidationError('fraction-scaling', 'Canonical scaling witnesses must agree with the bounds.');
    const key = `${contract}:${profile}:${range.max}`;
    const cached = rangedDomains.get(key);
    if (cached) return cached;
    const rows = fractionScaleNativeDomain(profile).filter(frame => {
        const quantities = fractionScaleQuantities(frame, contract);
        return quantities.every(({numerator, denominator}) => numerator <= range.max * denominator)
            && quantities.some(({numerator, denominator}) => numerator > range.maximumAbove * denominator)
            && quantities.some(({numerator, denominator}) => numerator < range.minimumBelow * denominator);
    });
    if (!rows.length)
        throw new GeneratorValidationError('fraction-scaling', 'The canonical scaling range has no native support.');
    rangedDomains.set(key, rows);
    return rows;
}

function weightedValue(rows: readonly WeightedFractionScaleFrame[], field: 'q' | 'b' | 'a', draw: number): number {
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1 || !rows.length)
        throw new GeneratorValidationError('fraction-scaling', 'A scaling draw must lie in the half-open unit interval.');
    const weights = new Map<number, number>();
    for (const row of rows) weights.set(row[field], (weights.get(row[field]) ?? 0) + row.weight);
    let remaining = draw * rows.reduce((sum, row) => sum + row.weight, 0);
    for (const [value, weight] of weights) {
        remaining -= weight;
        if (remaining < 0) return value;
    }
    throw new GeneratorValidationError('fraction-scaling', 'A scaling draw must lie in the half-open unit interval.');
}

/** Condition each original draw on the chosen band; equality still consumes only q and b. */
export function selectFractionScaleFrame(rows: readonly WeightedFractionScaleFrame[], profile: FractionScaleProfile,
    draw: () => number): FractionScaleFrame {
    fractionScaleUpperBounds(profile);
    const q = weightedValue(rows, 'q', draw());
    const qRows = rows.filter(row => row.q === q);
    const b = weightedValue(qRows, 'b', draw());
    const a = profile === 'equal' ? b : weightedValue(qRows.filter(row => row.b === b), 'a', draw());
    return {q, a, b};
}

const rational = (numerator: number, denominator: number): FractionScaleRational => ({numerator, denominator});
function common({q, a, b}: FractionScaleFrame, profile: FractionScaleProfile) {
    return {reference: rational(q, 1), scaleFactor: rational(a, b), product: rational(q * a, b),
        relation: profile, onePart: rational(q, b), partDifferenceCount: a - b};
}

export function buildFractionScaleRelation(frame: FractionScaleFrame, profile: FractionScaleProfile): FractionScaleRelationProblem {
    return {kind: 'fraction-scale-relation', ...common(frame, profile)};
}

export function buildFractionScaleComparison(frame: FractionScaleFrame, profile: FractionScaleProfile): FractionScaleComparisonProblem {
    return {kind: 'fraction-scale-comparison', ...common(frame, profile),
        wholeNumberAnalogy: {factor: 2, product: rational(2 * frame.q, 1)}};
}
