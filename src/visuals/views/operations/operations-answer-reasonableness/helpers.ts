import {ArithmeticEstimationProblem} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';

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
    const {min, max} = data.numberDomain;
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max > 1000 || min > max) {
        throw new ViewValidationError('operations-answer-reasonableness', 'Invalid estimation number domain.');
    }
    const inDomain = (value: number): boolean => Number.isInteger(value) && value >= min && value <= max;
    const normalizedSeed = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0;
    const shouldBeReasonable = normalizedSeed % 2 === 0;
    const roundedEstimatedAnswer = roundToPlace(
        data.estimatedAnswer,
        data.roundingPlace
    );
    if (!inDomain(data.estimatedAnswer) || !inDomain(roundedEstimatedAnswer)) {
        throw new ViewValidationError('operations-answer-reasonableness', 'The rounded estimate lies outside its number domain.');
    }
    const distanceOffset = Math.floor(normalizedSeed / 2) % data.roundingPlace;
    const distance = shouldBeReasonable
        ? 1 + distanceOffset % Math.max(1, data.roundingPlace / 2 - 1)
        : data.roundingPlace + distanceOffset;
    const preferredDirection = Math.floor(normalizedSeed / 2) % 2 === 0 ? 1 : -1;
    const isAdmissible = (value: number): boolean => inDomain(value)
        && value !== data.estimatedAnswer
        && inDomain(roundToPlace(value, data.roundingPlace))
        && (roundToPlace(value, data.roundingPlace) === roundedEstimatedAnswer) === shouldBeReasonable;
    let proposedAnswer = [
        data.estimatedAnswer + preferredDirection * distance,
        data.estimatedAnswer - preferredDirection * distance
    ].find(isAdmissible);

    if (proposedAnswer === undefined) {
        const alternatives = Array.from({length: max - min + 1}, (_, index) => min + index).filter(isAdmissible);
        proposedAnswer = alternatives[normalizedSeed % alternatives.length];
    }

    if (proposedAnswer === undefined) {
        throw new ViewValidationError('operations-answer-reasonableness',
            'The estimate has no bounded proposal for the requested reasonableness classification.');
    }

    const roundedProposedAnswer = roundToPlace(proposedAnswer, data.roundingPlace);
    return {
        proposedAnswer,
        roundedProposedAnswer,
        roundedEstimatedAnswer,
        isReasonable: roundedProposedAnswer === roundedEstimatedAnswer
    };
}
