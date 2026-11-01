import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {greatestCommonDivisor} from '../helpers.ts';

export type ComparisonRelation = 'less' | 'equal' | 'greater';
type Base = readonly [number, number];
export interface RatioComparisonFrame {
    readonly relation: ComparisonRelation;
    readonly leftBase: Base;
    readonly rightBase: Base;
    readonly consequent: number;
    readonly leftScale: number;
    readonly rightScale: number;
}

function frame(relation: ComparisonRelation, leftBase: Base, rightBase: Base): RatioComparisonFrame {
    const common = leftBase[1] * rightBase[1] / greatestCommonDivisor(leftBase[1], rightBase[1]);
    const multiplier = Math.ceil(4 / Math.min(common / leftBase[1], common / rightBase[1]));
    const consequent = common * multiplier;
    return {relation, leftBase, rightBase, consequent,
        leftScale: consequent / leftBase[1], rightScale: consequent / rightBase[1]};
}

/** Complete original support, without choosing labels from a generated table. */
const comparisonFrames: RatioComparisonFrame[] = [];
for (let numerator = 1; numerator <= 8; numerator++) for (let denominator = 1; denominator <= 4; denominator++) {
    for (const multiplier of [2, 3]) comparisonFrames.push(frame('equal',
        [numerator, denominator], [numerator * multiplier, denominator * multiplier]));
    for (let secondDenominator = 1; secondDenominator <= 4; secondDenominator++) for (let difference = 1; difference <= 3; difference++) {
        const smaller: Base = [numerator, denominator];
        const larger: Base = [Math.floor(numerator * secondDenominator / denominator) + difference, secondDenominator];
        comparisonFrames.push(frame('less', smaller, larger), frame('greater', larger, smaller));
    }
}

/** The common final row dominates rows with scales1,2,3; the first row fixes the minimum. */
export const comparisonValues = (value: RatioComparisonFrame): number[] => [
    ...value.leftBase, ...value.rightBase, value.consequent,
    value.leftBase[0] * value.leftScale, value.rightBase[0] * value.rightScale
];

export const comparisonRangeProfiles = canonicalRangeProfiles.filter(profile =>
    comparisonFrames.some(frame => hasCanonicalRangeWitness(comparisonValues(frame), profile.range))
);

export function comparisonFramesForRange(relation: string, range: CanonicalNumericRange) {
    const profile = comparisonRangeProfiles.find(profile =>
        Object.entries(profile.range).every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value)
    );
    return profile ? comparisonFrames.filter(frame => frame.relation === relation
        && hasCanonicalRangeWitness(comparisonValues(frame), profile.range)) : [];
}
