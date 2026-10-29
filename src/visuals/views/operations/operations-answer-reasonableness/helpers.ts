import {ArithmeticEstimationProblem} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';

export type EstimationClaim = ArithmeticEstimationProblem['proposal'] & {
    roundedEstimatedAnswer: number;
    isReasonable: boolean;
};

/** Validate the canonical proposal and evaluate its displayed nearest-ten relation. */
export function resolveEstimationClaim(data: ArithmeticEstimationProblem): EstimationClaim {
    const fail = (message: string): never => {throw new ViewValidationError('operations-answer-reasonableness', message);};
    const {min, max} = data.numberDomain;
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max > 1000 || min > max) {
        return fail('Invalid estimation number domain.');
    }
    const inDomain = (value: number) => Number.isInteger(value) && value >= min && value <= max;
    const roundedEstimatedAnswer = Math.round(data.estimatedAnswer / data.roundingPlace) * data.roundingPlace;
    if (!inDomain(data.estimatedAnswer) || !inDomain(roundedEstimatedAnswer)) return fail('The rounded estimate lies outside its number domain.');
    const proposal = data.proposal;
    if (!proposal || typeof proposal !== 'object' || Object.keys(proposal)
        .some(key => key !== 'proposedAnswer' && key !== 'roundedProposedAnswer') || !inDomain(proposal.proposedAnswer)
        || proposal.proposedAnswer === data.estimatedAnswer || !inDomain(proposal.roundedProposedAnswer)
        || proposal.roundedProposedAnswer !== Math.round(proposal.proposedAnswer / data.roundingPlace) * data.roundingPlace) {
        return fail('Expected a canonical bounded proposal and its consistent nearest-ten rounding.');
    }
    return {...proposal, roundedEstimatedAnswer,
        isReasonable: proposal.roundedProposedAnswer === roundedEstimatedAnswer};
}
