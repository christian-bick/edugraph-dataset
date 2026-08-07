import {ViewValidationError} from '../../../helpers/validation.ts';
import {PlaceValueBundlesProblem} from '../../../../types/problems.ts';

export function validateBundleProblem(data: PlaceValueBundlesProblem): void {
    if (!Number.isInteger(data.tens) || data.tens < 1 || data.tens > 9
        || data.ones !== 0 || data.target !== data.tens * 10) {
        throw new ViewValidationError(
            'place-value-tens-bundles',
            'Expected 1-9 complete tens and no leftover ones.'
        );
    }
}
