import {PlaceValueHundredsBundlesProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

export function validateHundredsBundles(viewId: string, data: PlaceValueHundredsBundlesProblem): void {
    if (!Number.isInteger(data.hundreds) || data.hundreds < 1 || data.hundreds > 9
        || data.ones !== 0 || data.target !== data.hundreds * 100
        || (data.tens !== 0 && !(data.hundreds === 1 && data.tens === 10))) {
        throw new ViewValidationError(viewId, 'Expected 1-9 complete hundreds or ten tens forming one hundred.');
    }
}

/** Explain the supplied bundle relation without calculating intermediate values. */
export function explainHundredsBundles(data: PlaceValueHundredsBundlesProblem): readonly [string, string] {
    if (data.tens === 10) {
        return [
            `First check that each rod is a full ten, then group the ${data.tens} rods into one hundred.`,
            `Every original one is kept and counted once, so the regrouped bundle still represents ${data.target} ones.`
        ];
    }

    const bundles = data.hundreds === 1 ? 'flat represents' : 'flats represent';
    return [
        'Count each complete hundred flat once. Say one hundred for the first flat, then count on by hundreds for each further flat.',
        `Each flat represents one hundred ones. Counting each flat once counts every one once, so the ${data.hundreds} ${bundles} ${data.target} ones.`
    ];
}
