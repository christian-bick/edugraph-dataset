import {ArithmeticEstimationProblem} from '../../../../types/problems.ts';

const MINIMUM_PROPOSAL = 0;
const MAXIMUM_PROPOSAL = 1000;

export type EstimationClaim = {
    proposedAnswer: number;
    roundedProposedAnswer: number;
    roundedEstimatedAnswer: number;
    isReasonable: boolean;
};

const roundToPlace = (value: number, place: number): number =>
    Math.round(value / place) * place;

/** Derives the learner-facing claim deterministically from the canonical estimate. */
export function resolveEstimationClaim(
    data: ArithmeticEstimationProblem,
    seed: number
): EstimationClaim {
    const normalizedSeed = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0;
    const shouldBeReasonable = normalizedSeed % 2 === 0;
    const roundedEstimatedAnswer = roundToPlace(
        data.estimatedAnswer,
        data.roundingPlace
    );
    const distanceOffset = Math.floor(normalizedSeed / 2) % data.roundingPlace;
    const distance = shouldBeReasonable
        ? 1 + distanceOffset % Math.max(1, data.roundingPlace / 2 - 1)
        : data.roundingPlace + distanceOffset;
    const preferredDirection = Math.floor(normalizedSeed / 2) % 2 === 0 ? 1 : -1;
    const proposedAnswer = [
        data.estimatedAnswer + preferredDirection * distance,
        data.estimatedAnswer - preferredDirection * distance
    ].find(value =>
        Number.isInteger(value)
        && value >= MINIMUM_PROPOSAL
        && value <= MAXIMUM_PROPOSAL
        && (roundToPlace(value, data.roundingPlace) === roundedEstimatedAnswer)
            === shouldBeReasonable
    );

    if (proposedAnswer === undefined) {
        throw new Error('The estimate has no bounded reasonableness proposal.');
    }

    const roundedProposedAnswer = roundToPlace(proposedAnswer, data.roundingPlace);
    return {
        proposedAnswer,
        roundedProposedAnswer,
        roundedEstimatedAnswer,
        isReasonable: roundedProposedAnswer === roundedEstimatedAnswer
    };
}
