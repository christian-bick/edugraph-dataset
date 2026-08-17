import {
    LegacyPlaceValueExpandedProblem,
    MultiDigitPlaceValueExpandedProblem,
    WholeNumberPlaceName
} from '../../../../types/problems.ts';

const PLACE_NAMES: readonly WholeNumberPlaceName[] = [
    'ones',
    'tens',
    'hundreds',
    'thousands',
    'ten-thousands',
    'hundred-thousands',
    'millions'
];
const numberFormatter = new Intl.NumberFormat('en-US');

export function displayPlaceName(name: WholeNumberPlaceName): string {
    return name
        .split('-')
        .map(word => `${word[0].toUpperCase()}${word.slice(1)}`)
        .join(' ');
}

export function isValidLegacyExpandedProblem(data: LegacyPlaceValueExpandedProblem): boolean {
    return Number.isInteger(data.number)
        && data.number >= 100
        && data.number <= 999
        && Array.isArray(data.terms)
        && [2, 3].includes(data.terms.length)
        && data.terms.every(term => Number.isInteger(term) && term > 0)
        && data.terms.reduce((sum, term) => sum + term, 0) === data.number;
}

export function isValidMultiDigitExpandedProblem(data: MultiDigitPlaceValueExpandedProblem): boolean {
    if (data.task !== 'multi-digit-expanded-form'
        || !Number.isInteger(data.number)
        || data.number <= 1000
        || data.number >= 1000000
        || !Array.isArray(data.terms)
        || data.terms.length < 2
        || data.terms.length > 6
        || data.terms.some(term => !Number.isInteger(term) || term <= 0)
        || !Array.isArray(data.placeValues)
        || data.placeValues.length < 4
        || data.placeValues.length > 6
        || typeof data.prompt !== 'string'
        || data.prompt !== 'Write the numeral as a sum of its nonzero place values.'
        || typeof data.expandedEquation !== 'string'
        || data.expandedEquation !== `${numberFormatter.format(data.number)} = ${data.terms.map(term => numberFormatter.format(term)).join(' + ')}`) {
        return false;
    }

    const highestExponent = data.placeValues.length - 1;
    if (data.placeValues.some((place, index) => {
        const exponent = highestExponent - index;
        const digit = Math.floor(data.number / (10 ** exponent)) % 10;
        return place.exponent !== exponent
            || place.name !== PLACE_NAMES[exponent]
            || !Number.isInteger(place.digit)
            || place.digit !== digit
            || place.value !== digit * (10 ** exponent);
    })) {
        return false;
    }

    const expectedTerms = data.placeValues
        .filter(place => place.digit !== 0)
        .map(place => place.value);
    return expectedTerms.length === data.terms.length
        && expectedTerms.every((term, index) => term === data.terms[index])
        && data.terms.reduce((sum, term) => sum + term, 0) === data.number;
}
