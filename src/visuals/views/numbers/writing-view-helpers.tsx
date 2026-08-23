import type {
    MultiDigitWritingProblem,
    WholeNumberPlaceName,
    WholeNumberPlaceValue,
    WritingProblem
} from '../../../types/problems.ts';
import {
    formatStandardNumeral,
    wholeNumberToEnglishName
} from '../../../lib/whole-number-notation.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const PLACE_NAMES: readonly WholeNumberPlaceName[] = [
    'ones',
    'tens',
    'hundreds',
    'thousands',
    'ten-thousands',
    'hundred-thousands',
    'millions'
];

export function isMultiDigitWritingProblem(
    data: WritingProblem
): data is MultiDigitWritingProblem {
    return 'placeValues' in data;
}

export function presentMultiDigitWriting(data: MultiDigitWritingProblem) {
    return {
        standardNumeral: formatStandardNumeral(data.number),
        numberName: wholeNumberToEnglishName(data.number)
    };
}

function fail(viewId: string, message: string): never {
    throw new ViewValidationError(viewId, message);
}

function validatePlaceValues(
    viewId: string,
    number: number,
    placeValues: WholeNumberPlaceValue[]
): void {
    if (placeValues.length < 4 || placeValues.length > 7) {
        fail(viewId, 'Expected four through seven complete place-value entries.');
    }

    const highestExponent = placeValues.length - 1;
    let reconstructedNumber = 0;

    placeValues.forEach((place, index) => {
        const exponent = highestExponent - index;
        const expectedName = PLACE_NAMES[exponent];
        if (
            place.exponent !== exponent
            || place.name !== expectedName
            || !Number.isInteger(place.digit)
            || place.digit < 0
            || place.digit > 9
            || place.value !== place.digit * 10 ** exponent
        ) {
            fail(viewId, 'Expected ordered, internally consistent place-value evidence.');
        }
        reconstructedNumber += place.value;
    });

    if (placeValues[0]!.digit === 0 || reconstructedNumber !== number) {
        fail(viewId, 'Expected place-value evidence to reconstruct the supplied number.');
    }
}

export function validateMultiDigitWritingProblem(
    viewId: string,
    data: MultiDigitWritingProblem
): void {
    if (!Number.isInteger(data.number) || data.number <= 1000 || data.number > 1_000_000) {
        fail(viewId, 'Expected a multi-digit whole number greater than 1000 and at most 1000000.');
    }

    validatePlaceValues(viewId, data.number, data.placeValues);
}

export function PlaceValueStrip({placeValues}: {placeValues: WholeNumberPlaceValue[]}) {
    return (
        <div
            aria-label="Place-value map"
            className="grid w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            style={{gridTemplateColumns: `repeat(${placeValues.length}, minmax(0, 1fr))`}}
        >
            {placeValues.map(place => (
                <div
                    key={place.name}
                    className="flex min-w-0 flex-col items-center border-r border-slate-200 px-1 py-2 last:border-r-0"
                >
                    <span className="text-2xl font-extrabold text-slate-800">{place.digit}</span>
                    <span className="mt-1 text-center text-[0.62rem] font-bold uppercase leading-tight tracking-wide text-slate-500">
                        {place.name}
                    </span>
                </div>
            ))}
        </div>
    );
}
