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

export type MultiDigitComparisonPresentation = {
    leftNumeral: string;
    rightNumeral: string;
    symbol: '<' | '>' | '=';
    prompt: string;
    comparisonEquation: string;
    conclusion: string;
    evidenceExplanation: string;
};

export function multiDigitComparisonPresentation(
    data: MultiDigitComparisonProblem
): MultiDigitComparisonPresentation {
    const leftNumeral = numberFormatter.format(data.num1);
    const rightNumeral = numberFormatter.format(data.num2);
    const symbol = getComparisonSymbol(data.relation) as '<' | '>' | '=';
    const comparisonEquation = `${leftNumeral} ${symbol} ${rightNumeral}`;
    const conclusion = `${leftNumeral} is ${data.relation === 'equal' ? 'equal to' : `${data.relation} than`} ${rightNumeral}.`;
    const evidenceExplanation = data.evidence.kind === 'all-equal'
        ? 'Every corresponding place has the same digit, so the numbers are equal.'
        : `The first differing place is the ${displayPlaceName(data.evidence.placeName)} place: ${data.evidence.leftDigit} is ${data.evidence.leftDigit < data.evidence.rightDigit ? 'less than' : 'greater than'} ${data.evidence.rightDigit}.`;
    return {
        leftNumeral,
        rightNumeral,
        symbol,
        prompt: 'Compare the two multi-digit whole numbers using <, >, or =.',
        comparisonEquation,
        conclusion,
        evidenceExplanation
    };
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
        || typeof data.evidence !== 'object'
        || data.evidence === null) {
        return false;
    }

    if (data.evidence.kind === 'all-equal') {
        return data.relation === 'equal'
            && data.num1 === data.num2;
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

    const placeName = PLACE_NAMES[firstExponent];
    return data.evidence.exponent === firstExponent
        && data.evidence.placeName === placeName
        && data.evidence.leftDigit === leftDigit
        && data.evidence.rightDigit === rightDigit
        && data.evidence.leftPlaceValue === leftDigit * (10 ** firstExponent)
        && data.evidence.rightPlaceValue === rightDigit * (10 ** firstExponent);
}
