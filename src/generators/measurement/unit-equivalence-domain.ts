import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {MeasurementConversionPair, MeasurementConversionPairId, UnitEquivalenceProblem} from '../../types/problems.ts';
import {measurementConversionPairSeeds} from './helpers.ts';

export type UnitEquivalenceContract = 'single' | 'sequence';
const range = createCanonicalNumericRange;
const ranges = {
    single: {1000: [range(10000)], 100: [range(1000)], 60: [range(120), range(1000)],
        16: [range(100), range(120), range(1000)]},
    sequence: {1000: [range(10000), range(10000, 5), range(100000, 5)],
        100: [range(1000), range(1000, 5), range(10000, 5)],
        60: [range(1000), range(1000, 5)], 16: [range(100), range(120), range(1000), range(1000, 5)]}
} as const;

/** Static feasible bounds; importing a catalog never constructs native sampling pools. */
export function unitEquivalenceRanges(contract: UnitEquivalenceContract, unitPair: MeasurementConversionPairId): readonly CanonicalNumericRange[] {
    if ((contract !== 'single' && contract !== 'sequence') || !Object.hasOwn(measurementConversionPairSeeds, unitPair))
        throw new GeneratorValidationError('measurement-unit-equivalences', 'Choose a supported equality contract and named unit pair.');
    return ranges[contract][measurementConversionPairSeeds[unitPair].factor];
}

/** Response-slot counts and layout dimensions are not quantities in the conversion mathematics. */
export function unitEquivalenceQuantities(contract: UnitEquivalenceContract, pair: MeasurementConversionPair, start: number): readonly number[] {
    if (contract !== 'single' && contract !== 'sequence')
        throw new GeneratorValidationError('measurement-unit-equivalences', 'Choose a supported equality contract.');
    return contract === 'single' ? [1, pair.factor, start, start * pair.factor]
        : [pair.factor, ...Array.from({length: 5}, (_, index) => [start + index, (start + index) * pair.factor]).flat()];
}

const domains = new Map<string, readonly number[]>();
export function unitEquivalenceStarts(contract: UnitEquivalenceContract, unitPair: MeasurementConversionPairId,
    selectedRange: CanonicalNumericRange): readonly number[] {
    const allowed = unitEquivalenceRanges(contract, unitPair);
    const canonical = selectedRange && allowed.find(candidate => candidate.min === selectedRange.min && candidate.max === selectedRange.max);
    if (!canonical || canonical.maximumAbove !== selectedRange.maximumAbove || canonical.minimumBelow !== selectedRange.minimumBelow)
        throw new GeneratorValidationError('measurement-unit-equivalences', 'Choose a feasible canonical equality range with exact witnesses.');
    const key = `${contract}:${unitPair}:${selectedRange.min}:${selectedRange.max}`, cached = domains.get(key);
    if (cached) return cached;
    const starts = Array.from({length: 8}, (_, index) => index + 2).filter(start =>
        hasCanonicalRangeWitness(unitEquivalenceQuantities(contract, measurementConversionPairSeeds[unitPair], start), selectedRange));
    if (!starts.length)
        throw new GeneratorValidationError('measurement-unit-equivalences', 'The canonical equality range has no native support.');
    domains.set(key, starts);
    return starts;
}

/** Every original start has weight 1/8; conditioning preserves uniformity and one draw. */
export function selectUnitEquivalenceStart(starts: readonly number[], draw: () => number): number {
    const value = draw();
    if (!starts.length || !Number.isFinite(value) || value < 0 || value >= 1)
        throw new GeneratorValidationError('measurement-unit-equivalences', 'An equality draw needs a nonempty domain and the half-open unit interval.');
    return starts[Math.floor(value * starts.length)]!;
}

export function buildSingleUnitEquivalence(pair: MeasurementConversionPair, start: number): UnitEquivalenceProblem {
    return {kind: 'unit-equivalence', pair, equivalent: {largerValue: start, smallerValue: start * pair.factor}};
}
