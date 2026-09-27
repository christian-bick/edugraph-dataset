import type {CountingProblem} from '../../types/problems.ts';
import type {ParityConstraint} from './helpers.ts';

/** Samples a positive quantity from resolved integer bounds, consuming one draw when feasible. */
export function sampleCountingQuantity(
    range: {min: number; max: number},
    parity: ParityConstraint,
    draw: () => number
): CountingProblem | null {
    const maxCount = range.max;
    let minCount = range.min;
    if (minCount < 1) minCount = 1;
    if (minCount > maxCount) return null;

    const requiredRemainder = parity === 'even' ? 0 : parity === 'odd' ? 1 : null;
    if (requiredRemainder !== null && minCount % 2 !== requiredRemainder) minCount += 1;
    if (minCount > maxCount) return null;

    const step = requiredRemainder === null ? 1 : 2;
    const candidateCount = Math.floor((maxCount - minCount) / step) + 1;
    const numObjects = minCount + Math.floor(draw() * candidateCount) * step;
    const resolvedParity = numObjects % 2 === 0 ? 'even' as const : 'odd' as const;
    return {
        numObjects,
        simpleAnswer: numObjects,
        ...(parity === 'any' ? {} : {parity: resolvedParity})
    };
}
