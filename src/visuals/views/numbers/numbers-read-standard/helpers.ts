const ONES = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine'
] as const;

const TEENS = [
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

const TENS = [
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

function nameUnderHundred(number: number): string {
    if (number < 10) return ONES[number];
    if (number < 20) return TEENS[number - 10];

    const tens = TENS[Math.floor(number / 10)];
    const ones = ONES[number % 10];
    return ones ? `${tens}-${ones}` : tens;
}

export function numberToEnglishName(number: number): string {
    if (!Number.isInteger(number) || number < 0 || number > 1000) {
        throw new RangeError('Number names are supported for integers from 0 through 1000.');
    }

    if (number === 0) return 'zero';
    if (number < 100) return nameUnderHundred(number);

    if (number === 1000) return 'one thousand';

    const hundreds = Math.floor(number / 100);
    const remainder = number % 100;
    const prefix = `${ONES[hundreds]} hundred`;
    return remainder === 0 ? prefix : `${prefix} ${nameUnderHundred(remainder)}`;
}
