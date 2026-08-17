import {WholeNumberPlaceName, WholeNumberPlaceValue} from '../types/problems.ts';

const PLACE_NAMES: readonly WholeNumberPlaceName[] = [
    'ones',
    'tens',
    'hundreds',
    'thousands',
    'ten-thousands',
    'hundred-thousands',
    'millions'
];

const SMALL_NAMES = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen'
] as const;

const TENS_NAMES = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety'
] as const;

const validateWholeNumber = (number: number): void => {
    if (!Number.isSafeInteger(number) || number < 0 || number > 1_000_000) {
        throw new RangeError(`Expected a whole number from 0 through 1,000,000, received ${number}.`);
    }
};

const nameBelowOneThousand = (number: number): string => {
    if (number < 20) return SMALL_NAMES[number]!;
    if (number < 100) {
        const tens = Math.floor(number / 10);
        const ones = number % 10;
        return ones === 0 ? TENS_NAMES[tens]! : `${TENS_NAMES[tens]}-${SMALL_NAMES[ones]}`;
    }

    const hundreds = Math.floor(number / 100);
    const remainder = number % 100;
    const prefix = `${SMALL_NAMES[hundreds]} hundred`;
    return remainder === 0 ? prefix : `${prefix} ${nameBelowOneThousand(remainder)}`;
};

export function formatStandardNumeral(number: number): string {
    validateWholeNumber(number);
    return String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function wholeNumberToEnglishName(number: number): string {
    validateWholeNumber(number);
    if (number < 1000) return nameBelowOneThousand(number);
    if (number === 1_000_000) return 'one million';

    const thousands = Math.floor(number / 1000);
    const remainder = number % 1000;
    const prefix = `${nameBelowOneThousand(thousands)} thousand`;
    return remainder === 0 ? prefix : `${prefix} ${nameBelowOneThousand(remainder)}`;
}

export function createWholeNumberPlaceValues(number: number): WholeNumberPlaceValue[] {
    validateWholeNumber(number);
    const highestExponent = number === 0 ? 0 : Math.floor(Math.log10(number));

    return Array.from({length: highestExponent + 1}, (_, index) => {
        const exponent = (highestExponent - index) as WholeNumberPlaceValue['exponent'];
        const magnitude = 10 ** exponent;
        const digit = Math.floor(number / magnitude) % 10;
        return {
            name: PLACE_NAMES[exponent]!,
            exponent,
            digit,
            value: digit * magnitude
        };
    });
}

export function displayWholeNumberPlaceName(name: WholeNumberPlaceName): string {
    return name.replaceAll('-', ' ');
}
