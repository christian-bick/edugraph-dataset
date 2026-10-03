import type {DecimalRoundingPlace, DecimalRoundingProblem} from '../../../../types/problems.ts';

export function roundingCase(
    roundingPlace: DecimalRoundingPlace,
    lowerCandidateInTenThousandths: number,
    inputInTenThousandths: number
): DecimalRoundingProblem {
    const q = roundingPlace.quantumInTenThousandths;
    const upperCandidateInTenThousandths = lowerCandidateInTenThousandths + q;
    const midpointInTenThousandths = lowerCandidateInTenThousandths + q / 2;
    const direction = inputInTenThousandths < midpointInTenThousandths ? 'down' : 'up';
    return {
        kind: 'decimal-place-rounding',
        inputInTenThousandths,
        roundingPlace,
        lowerCandidateInTenThousandths,
        upperCandidateInTenThousandths,
        midpointInTenThousandths,
        roundedInTenThousandths: direction === 'down'
            ? lowerCandidateInTenThousandths : upperCandidateInTenThousandths,
        direction,
        isMidpointTie: inputInTenThousandths === midpointInTenThousandths,
        distanceToLowerInTenThousandths: inputInTenThousandths - lowerCandidateInTenThousandths,
        distanceToUpperInTenThousandths: upperCandidateInTenThousandths - inputInTenThousandths
    };
}
