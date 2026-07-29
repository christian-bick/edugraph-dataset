import {ViewValidationError} from '../../../helpers/validation.ts';

const MAX_COUNT = 20;
const MAX_ICON_SIZE = 35;
const MIN_ICON_SIZE = 20;
const MIN_FAR_GAP = 8;
const MAX_FAR_GAP = 24;
const MAX_CLOSE_GAP = 4;
export const CONSERVATION_ROW_WIDTH = 650;

export interface ConservationLayout {
    iconSize: number;
    closeGap: number;
    farGap: number;
}

export function getConservationLayout(number: number): ConservationLayout {
    if (!Number.isInteger(number) || number < 1 || number > MAX_COUNT) {
        throw new ViewValidationError(
            'counting-conservation',
            `numObjects must be an integer between 1 and ${MAX_COUNT}; received ${number}.`
        );
    }

    if (number === 1) {
        return {iconSize: MAX_ICON_SIZE, closeGap: 0, farGap: 0};
    }

    const iconSize = Math.min(
        MAX_ICON_SIZE,
        Math.floor((CONSERVATION_ROW_WIDTH - (number - 1) * MIN_FAR_GAP) / number)
    );

    if (iconSize < MIN_ICON_SIZE) {
        throw new ViewValidationError(
            'counting-conservation',
            `numObjects ${number} cannot fit within the ${CONSERVATION_ROW_WIDTH}px row.`
        );
    }

    const farGap = Math.min(
        MAX_FAR_GAP,
        Math.floor((CONSERVATION_ROW_WIDTH - number * iconSize) / (number - 1))
    );
    const closeGap = Math.min(MAX_CLOSE_GAP, Math.max(2, Math.floor(farGap / 3)));

    return {iconSize, closeGap, farGap};
}
