import {ArithmeticEstimationProblem} from '../../../../types/problems.ts';

const MINIMUM_PROPOSAL = 0;
const MAXIMUM_PROPOSAL = 1000;

export type EstimationClaim = {
    proposedAnswer: number;
    estimateDifference: number;
    tolerance: number;
    isReasonable: boolean;
};

/** Derives the learner-facing claim deterministically from the canonical estimate. */
export function resolveEstimationClaim(
    data: ArithmeticEstimationProblem,
    seed: number
): EstimationClaim {
    const normalizedSeed = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0;
    const shouldBeReasonable = normalizedSeed % 2 === 0;
    const tolerance = Math.max(10, Math.ceil(Math.abs(data.estimatedAnswer) * 0.1));
    const distanceOffset = Math.floor(normalizedSeed / 2) % tolerance;
    const distance = shouldBeReasonable
        ? 1 + distanceOffset
        : tolerance + 1 + distanceOffset;
    const preferredDirection = Math.floor(normalizedSeed / 2) % 2 === 0 ? 1 : -1;
    const proposedAnswer = [
        data.estimatedAnswer + preferredDirection * distance,
        data.estimatedAnswer - preferredDirection * distance
    ].find(value =>
        Number.isInteger(value)
        && value >= MINIMUM_PROPOSAL
        && value <= MAXIMUM_PROPOSAL
    );

    if (proposedAnswer === undefined) {
        throw new Error('The estimate has no bounded reasonableness proposal.');
    }

    const estimateDifference = Math.abs(proposedAnswer - data.estimatedAnswer);
    return {
        proposedAnswer,
        estimateDifference,
        tolerance,
        isReasonable: estimateDifference <= tolerance
    };
}
