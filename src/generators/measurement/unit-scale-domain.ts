import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {GenericUnitCountRelationProblem, GenericUnitScaleRelationProblem} from '../../types/problems.ts';

export type UnitScaleContract = 'counts' | 'factor';
export type UnitScaleFrame = Readonly<GenericUnitScaleRelationProblem>;
let nativeDomain: readonly UnitScaleFrame[] | undefined;

/** The original uniform q in 3..6 and factor in 2..3, constructed only when generation needs it. */
export function unitScaleNativeDomain(): readonly UnitScaleFrame[] {
    if (!nativeDomain) nativeDomain = [3, 4, 5, 6].flatMap(largeUnitCount => [2, 3].map(unitsPerLarge =>
        ({largeUnitCount, smallUnitCount: largeUnitCount * unitsPerLarge, unitsPerLarge})));
    return nativeDomain;
}

export function unitScaleQuantities(frame: UnitScaleFrame, contract: UnitScaleContract): readonly number[] {
    if (contract !== 'counts' && contract !== 'factor')
        throw new GeneratorValidationError('measurement-unit-scale', 'Choose a supported unit relation contract.');
    return [frame.largeUnitCount, frame.smallUnitCount, ...(contract === 'factor' ? [frame.unitsPerLarge] : [])];
}

const domains = new Map<string, readonly UnitScaleFrame[]>();
export function unitScaleDomain(contract: UnitScaleContract, range: CanonicalNumericRange): readonly UnitScaleFrame[] {
    if (!range || ![10, 20].includes(range.max) || !(range.min === 0 || contract === 'counts' && range.min === 5))
        throw new GeneratorValidationError('measurement-unit-scale', 'Choose a feasible canonical unit relation range.');
    const canonical = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== canonical.maximumAbove || range.minimumBelow !== canonical.minimumBelow)
        throw new GeneratorValidationError('measurement-unit-scale', 'Canonical unit relation witnesses must agree with the bounds.');
    const key = `${contract}:${range.min}:${range.max}`, cached = domains.get(key);
    if (cached) return cached;
    const rows = unitScaleNativeDomain().filter(frame => hasCanonicalRangeWitness(unitScaleQuantities(frame, contract), range));
    if (!rows.length)
        throw new GeneratorValidationError('measurement-unit-scale', 'The canonical unit relation range has no native support.');
    domains.set(key, rows);
    return rows;
}

function checkedDraw(draw: () => number): number {
    const value = draw();
    if (!Number.isFinite(value) || value < 0 || value >= 1)
        throw new GeneratorValidationError('measurement-unit-scale', 'A unit relation draw must lie in the half-open unit interval.');
    return value;
}

/** Condition q on its feasible native factors, then draw its factor; always consumes two draws. */
export function selectUnitScaleFrame(rows: readonly UnitScaleFrame[], draw: () => number): UnitScaleFrame {
    if (!rows.length)
        throw new GeneratorValidationError('measurement-unit-scale', 'A unit relation domain must not be empty.');
    const largeUnitCount = rows[Math.floor(checkedDraw(draw) * rows.length)]!.largeUnitCount;
    const factors = rows.filter(frame => frame.largeUnitCount === largeUnitCount);
    return factors[Math.floor(checkedDraw(draw) * factors.length)]!;
}

export function buildGenericUnitCountRelation(frame: UnitScaleFrame): GenericUnitCountRelationProblem {
    return {kind: 'generic-unit-count-relation', largeUnitCount: frame.largeUnitCount, smallUnitCount: frame.smallUnitCount};
}
