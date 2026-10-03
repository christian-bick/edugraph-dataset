import type {DecimalRoundingPlace, DecimalRoundingProblem} from '../../../../types/problems.ts';

export const TEN_THOUSAND = 10000;
export const LINE_LEFT = 90;
export const LINE_RIGHT = 710;

const PLACE_QUANTA: Record<DecimalRoundingPlace['name'], number> = {
    hundreds: 1000000,
    tens: 100000,
    ones: 10000,
    tenths: 1000,
    hundredths: 100,
    thousandths: 10
};

const PLACE_DECIMALS: Record<DecimalRoundingPlace['name'], number> = {
    hundreds: 0,
    tens: 0,
    ones: 0,
    tenths: 1,
    hundredths: 2,
    thousandths: 3
};

/** Formats integer ten-thousandths exactly, preserving requested result places. */
export function formatTenThousandths(value: number, minimumFractionDigits = 0): string {
    const whole = Math.floor(value / TEN_THOUSAND);
    const fraction = String(value % TEN_THOUSAND).padStart(4, '0');
    let length = 4;
    while (length > minimumFractionDigits && fraction[length - 1] === '0') length--;
    return length > 0 ? `${whole}.${fraction.slice(0, length)}` : String(whole);
}

export function placeFractionDigits(place: DecimalRoundingPlace): number {
    return PLACE_DECIMALS[place.name];
}

/** Checks the generator's complete exact rounding witness before drawing it. */
export function validDecimalRounding(data: DecimalRoundingProblem): boolean {
    if (!data || data.kind !== 'decimal-place-rounding' || !data.roundingPlace) return false;
    const q = PLACE_QUANTA[data.roundingPlace.name];
    const values = [
        data.inputInTenThousandths,
        data.lowerCandidateInTenThousandths,
        data.upperCandidateInTenThousandths,
        data.midpointInTenThousandths,
        data.roundedInTenThousandths,
        data.distanceToLowerInTenThousandths,
        data.distanceToUpperInTenThousandths
    ];
    if (!q || q !== data.roundingPlace.quantumInTenThousandths
        || !values.every(value => Number.isSafeInteger(value) && value >= 0)
        || data.inputInTenThousandths % TEN_THOUSAND === 0
        || data.lowerCandidateInTenThousandths % q !== 0
        || data.upperCandidateInTenThousandths !== data.lowerCandidateInTenThousandths + q
        || data.inputInTenThousandths <= data.lowerCandidateInTenThousandths
        || data.inputInTenThousandths >= data.upperCandidateInTenThousandths
        || data.midpointInTenThousandths !== data.lowerCandidateInTenThousandths + q / 2
        || data.distanceToLowerInTenThousandths !== data.inputInTenThousandths - data.lowerCandidateInTenThousandths
        || data.distanceToUpperInTenThousandths !== data.upperCandidateInTenThousandths - data.inputInTenThousandths) {
        return false;
    }
    const tie = data.inputInTenThousandths === data.midpointInTenThousandths;
    const direction = data.inputInTenThousandths < data.midpointInTenThousandths ? 'down' : 'up';
    return data.isMidpointTie === tie
        && data.direction === direction
        && data.roundedInTenThousandths === (direction === 'down'
            ? data.lowerCandidateInTenThousandths
            : data.upperCandidateInTenThousandths);
}

export function linePosition(data: DecimalRoundingProblem, value: number): number {
    return LINE_LEFT + (value - data.lowerCandidateInTenThousandths)
        / data.roundingPlace.quantumInTenThousandths * (LINE_RIGHT - LINE_LEFT);
}

/** Keeps the source badge within the SVG while the leader remains tied to the exact point. */
export function sourceBadgeX(sourceX: number): number {
    return Math.max(190, Math.min(610, sourceX));
}

export function roundingExplanation(data: DecimalRoundingProblem): string {
    const input = formatTenThousandths(data.inputInTenThousandths);
    const rounded = formatTenThousandths(data.roundedInTenThousandths, placeFractionDigits(data.roundingPlace));
    const lower = formatTenThousandths(data.lowerCandidateInTenThousandths, placeFractionDigits(data.roundingPlace));
    const upper = formatTenThousandths(data.upperCandidateInTenThousandths, placeFractionDigits(data.roundingPlace));
    const lowerDistance = formatTenThousandths(data.distanceToLowerInTenThousandths);
    const upperDistance = formatTenThousandths(data.distanceToUpperInTenThousandths);
    return data.isMidpointTie
        ? `${input} is halfway between ${lower} and ${upper}, so round up to ${rounded}.`
        : `${input} is ${lowerDistance} from ${lower} and ${upperDistance} from ${upper}, so round ${data.direction} to ${rounded}.`;
}
