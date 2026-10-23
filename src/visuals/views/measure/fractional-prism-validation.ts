import type {RectangularPrismVolumeProblem} from '../../../types/problems.ts';
import {validateProblemData} from '../../helpers/validation.ts';

/** Additional fractional fields; each wrapper checks the common fields first. */
export function validateFractionalPrismPresence(viewId: string, data: RectangularPrismVolumeProblem): void {
    if (data.kind === 'fractional-rectangular-prism-volume') validateProblemData(viewId, data, [
        'partitionDenominator', 'unitCubeFaceAreaSquareUnits', 'unitCubeVolumeCubicUnits',
        'unitCubeProducts', 'packingBounds', 'cubesPerLayer', 'countProducts',
        'physicalProducts', 'packingVolumeProduct'
    ]);
}
