import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {DimensionUnitPowers} from '../../../types/problems.ts';
import {rational} from '../../ratio/helpers.ts';

type Operation = 'multiplication' | 'division';
type UnitPair = readonly [Readonly<DimensionUnitPowers>, Readonly<DimensionUnitPowers>];
const length = {m: 1, s: 0, kg: 0}, area = {m: 2, s: 0, kg: 0};
const time = {m: 0, s: 1, kg: 0}, speed = {m: 1, s: -1, kg: 0};
const mass = {m: 0, s: 0, kg: 1}, massRate = {m: 0, s: -1, kg: 1};
const density = {m: -3, s: 0, kg: 1}, volume = {m: 3, s: 0, kg: 0};
const unitPairs: Record<Operation, readonly UnitPair[]> = {
    multiplication: [[length, length], [speed, time], [massRate, time], [density, volume]],
    division: [[length, time], [area, length], [length, length], [speed, speed], [mass, time], [mass, density]]
};

function hasCancellation(operation: Operation, [left, right]: UnitPair): boolean {
    const sign = operation === 'multiplication' ? 1 : -1;
    return (['m', 's', 'kg'] as const).some(symbol =>
        Math.max(0, left[symbol]) + Math.max(0, sign * right[symbol]) > 0
        && Math.max(0, -left[symbol]) + Math.max(0, -sign * right[symbol]) > 0);
}
function numericDraw(index: number) {
    const left = Math.floor(index / 48), right = index % 48;
    return {leftNumerator: Math.floor(left / 4) + 1, leftDenominator: left % 4 + 1,
        rightNumerator: Math.floor(right / 4) + 1, rightDenominator: right % 4 + 1};
}

const numericCache = new Map<string, number[]>();
function numericCases(operation: Operation, cancellation: boolean, range: CanonicalNumericRange) {
    const key = JSON.stringify([operation, cancellation, range]);
    const cached = numericCache.get(key);
    if (cached) return cached;
    const cases: number[] = [];
    for (let index = 0; index < 2304; index++) {
        const draw = numericDraw(index);
        const values: [number, number][] = [[draw.leftNumerator, draw.leftDenominator], [draw.rightNumerator, draw.rightDenominator],
            operation === 'multiplication'
                ? [draw.leftNumerator * draw.rightNumerator, draw.leftDenominator * draw.rightDenominator]
                : [draw.leftNumerator * draw.rightDenominator, draw.leftDenominator * draw.rightNumerator]];
        // The question requires explaining cancellation; the solution explicitly assesses quotient1.
        // An empty unit denominator or storage exponent alone is ordinary notation and is excluded.
        if (cancellation) values.push([1, 1]);
        // Integer cross products keep inclusive endpoints exact (for example,(5/3)÷(1/3)=5).
        if (values.every(([numerator, denominator]) => numerator >= range.min * denominator
            && numerator <= range.max * denominator)
            && values.some(([numerator, denominator]) => numerator > range.maximumAbove * denominator)
            && values.some(([numerator, denominator]) => numerator < range.minimumBelow * denominator)) cases.push(index);
    }
    numericCache.set(key, cases);
    return cases;
}
function operationDomain(operation: Operation, range: CanonicalNumericRange) {
    const blocks = unitPairs[operation].map(units => ({units,
        cases: numericCases(operation, hasCancellation(operation, units), range)
    })).filter(block => block.cases.length > 0);
    return {blocks, count: blocks.reduce((sum, block) => sum + block.cases.length, 0)};
}
const profileDomains = canonicalRangeProfiles.map(profile => ({...profile,
    multiplication: operationDomain('multiplication', profile.range), division: operationDomain('division', profile.range)
})).filter(profile => profile.multiplication.count + profile.division.count > 0);

export const dimensionRelationRangeProfiles = profileDomains.map(({labels, range}) => ({labels, range}));
function domainForRange(operation: string, range: CanonicalNumericRange) {
    const profile = profileDomains.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    return operation === 'multiplication' || operation === 'division' ? profile?.[operation] : undefined;
}
export const dimensionRelationCaseCount = (operation: string, range: CanonicalNumericRange): number =>
    domainForRange(operation, range)?.count ?? 0;

/** Decode one original unit-pair/numerator/denominator draw from a preselected finite profile. */
export function dimensionRelationFrameAt(operation: string, range: CanonicalNumericRange, index: number) {
    const domain = domainForRange(operation, range);
    if (!domain || !Number.isSafeInteger(index) || index < 0 || index >= domain.count) {
        throw new RangeError('Unsupported unit-dimension profile or case index.');
    }
    let offset = index;
    for (const block of domain.blocks) {
        if (offset < block.cases.length) {
            const draw = numericDraw(block.cases[offset]!);
            return {units: block.units, leftValue: rational(draw.leftNumerator, draw.leftDenominator),
                rightValue: rational(draw.rightNumerator, draw.rightDenominator)};
        }
        offset -= block.cases.length;
    }
    throw new RangeError('Unit-dimension index exceeded its finite domain.');
}
