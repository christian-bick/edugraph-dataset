import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {FractionQuotientValue} from '../../../types/problems.ts';
import {divisionOperandDistribution, type DivisionGroupCountProfile, type DivisionOperandProfile, type WeightedDivisionOperands} from './operand-profiles.ts';

const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
const cache = new Map<string, readonly WeightedDivisionOperands[]>();
export const hasSharedDivisionRange = (profile: DivisionOperandProfile, group: DivisionGroupCountProfile): boolean =>
    divisionOperandDistribution(profile, group).length > 0;

/** The prescribed model assesses complete groups and the tick counts of a last
 * fractional group. Stored frame sizes and pure notation coefficients are not
 * standalone quantities. Numbered whole positions remain actual axis values. */
export function commonDivisionMaximum(dividend: Readonly<FractionQuotientValue>, divisor: Readonly<FractionQuotientValue>): number {
    const ticksPerWhole = dividend.denominator * divisor.denominator / gcd(dividend.denominator, divisor.denominator);
    const dividendTicks = dividend.numerator * ticksPerWhole / dividend.denominator;
    const divisorTicks = divisor.numerator * ticksPerWhole / divisor.denominator;
    const completeGroups = Math.floor(dividendTicks / divisorTicks), remainder = dividendTicks % divisorTicks;
    const coverage = Math.max(ticksPerWhole, divisorTicks, Math.ceil(dividendTicks / divisorTicks) * divisorTicks);
    return Math.max(dividend.numerator / dividend.denominator, divisor.numerator / divisor.denominator,
        dividendTicks / divisorTicks, completeGroups, Math.floor(coverage / ticksPerWhole),
        ...(remainder > 0 ? [remainder, divisorTicks] : []));
}

export function divisionRangeRows(profile: DivisionOperandProfile, group: DivisionGroupCountProfile,
    range: CanonicalNumericRange): readonly WeightedDivisionOperands[] {
    if (!range || range.min !== 0 || ![5, 10, 20, 100].includes(range.max))
        throw new GeneratorValidationError('fraction-division-relations', 'Choose a supported canonical common-group range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new GeneratorValidationError('fraction-division-relations', 'Division range witnesses must agree with the selected bounds.');
    if (!hasSharedDivisionRange(profile, group)) return [];
    const key = `${profile}:${group}:${range.max}`;
    const existing = cache.get(key);
    if (existing) return existing;
    const rows = divisionOperandDistribution(profile, group).filter(row => {
        const maximum = commonDivisionMaximum(row.dividend, row.divisor);
        return maximum <= range.max && maximum > range.maximumAbove;
    });
    cache.set(key, rows);
    return rows;
}

export function sampleDivisionRangeOperands(profile: DivisionOperandProfile, group: DivisionGroupCountProfile,
    range: CanonicalNumericRange, draw: () => number): {dividend: FractionQuotientValue; divisor: FractionQuotientValue} {
    const rows = divisionRangeRows(profile, group, range);
    if (!rows.length) throw new GeneratorValidationError('fraction-division-relations', 'No source operands support this shared model range.');
    let remaining = draw() * rows.reduce((sum, row) => sum + row.weight, 0);
    const selected = rows.find(row => (remaining -= row.weight) < 0) ?? rows[rows.length - 1]!;
    return {dividend: {...selected.dividend}, divisor: {...selected.divisor}};
}
