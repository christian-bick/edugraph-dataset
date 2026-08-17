import {
    LegacyComparisonProblem,
    MultiDigitComparisonProblem,
    WholeNumberPlaceName
} from '../../../../types/problems.ts';

export function getComparisonSymbol(relation: string): string {
    if (relation === 'greater' || relation === 'A') return '>';
    if (relation === 'less' || relation === 'B') return '<';
    if (relation === 'equal') return '=';
    return relation;
}

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

function resolvedRelation(num1: number, num2: number): LegacyComparisonProblem['relation'] {
    if (num1 < num2) return 'less';
    if (num1 > num2) return 'greater';
    return 'equal';
}

function displayPlaceName(name: WholeNumberPlaceName): string {
    return name.replaceAll('-', ' ');
}

export function displayPlaceHeading(name: WholeNumberPlaceName): string {
    return displayPlaceName(name)
        .split(' ')
        .map(word => `${word[0].toUpperCase()}${word.slice(1)}`)
        .join(' ');
}

export function isValidLegacyComparisonProblem(data: LegacyComparisonProblem): boolean {
    return Number.isSafeInteger(data.num1)
        && Number.isSafeInteger(data.num2)
        && data.relation === resolvedRelation(data.num1, data.num2);
}

export function isValidMultiDigitComparisonProblem(data: MultiDigitComparisonProblem): boolean {
    if (data.task !== 'multi-digit-place-value-comparison'
        || !Number.isSafeInteger(data.num1)
        || !Number.isSafeInteger(data.num2)
        || data.num1 <= 1000
        || data.num1 >= 1000000
        || data.num2 <= 1000
        || data.num2 >= 1000000
        || data.relation !== resolvedRelation(data.num1, data.num2)
        || data.leftNumeral !== numberFormatter.format(data.num1)
        || data.rightNumeral !== numberFormatter.format(data.num2)
        || data.symbol !== getComparisonSymbol(data.relation)
        || data.prompt !== 'Compare the two multi-digit whole numbers using <, >, or =.'
        || data.comparisonEquation !== `${data.leftNumeral} ${data.symbol} ${data.rightNumeral}`
        || data.conclusion !== `${data.leftNumeral} is ${data.relation === 'equal' ? 'equal to' : `${data.relation} than`} ${data.rightNumeral}.`
        || typeof data.evidence !== 'object'
        || data.evidence === null) {
        return false;
    }

    if (data.evidence.kind === 'all-equal') {
        return data.relation === 'equal'
            && data.num1 === data.num2
            && data.evidence.explanation === 'Every corresponding place has the same digit, so the numbers are equal.';
    }
    if (data.evidence.kind !== 'first-difference' || data.relation === 'equal') return false;

    const highestExponent = Math.floor(Math.log10(Math.max(data.num1, data.num2)));
    let firstExponent = -1;
    let leftDigit = -1;
    let rightDigit = -1;
    for (let exponent = highestExponent; exponent >= 0; exponent--) {
        const magnitude = 10 ** exponent;
        const candidateLeft = Math.floor(data.num1 / magnitude) % 10;
        const candidateRight = Math.floor(data.num2 / magnitude) % 10;
        if (candidateLeft === candidateRight) continue;
        firstExponent = exponent;
        leftDigit = candidateLeft;
        rightDigit = candidateRight;
        break;
    }
    if (firstExponent < 0) return false;

    const relationWord = leftDigit < rightDigit ? 'less than' : 'greater than';
    const placeName = PLACE_NAMES[firstExponent];
    return data.evidence.exponent === firstExponent
        && data.evidence.placeName === placeName
        && data.evidence.leftDigit === leftDigit
        && data.evidence.rightDigit === rightDigit
        && data.evidence.leftPlaceValue === leftDigit * (10 ** firstExponent)
        && data.evidence.rightPlaceValue === rightDigit * (10 ** firstExponent)
        && data.evidence.explanation === `The first differing place is the ${displayPlaceName(placeName)} place: ${leftDigit} is ${relationWord} ${rightDigit}.`;
}
