import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {formatStandardNumeral} from '../../../lib/whole-number-notation.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    StandardAlgorithmColumnStep,
    StandardAlgorithmOperation,
    StandardAlgorithmPlaceName,
    StandardAlgorithmProblem
} from '../../../types/problems.ts';
import {
    StandardAlgorithmAddSubtractGeneratorConfig,
    StandardAlgorithmAddSubtractGeneratorSchema
} from './spec.ts';

const placeColumns = [
    {placeValue: 1, placeName: 'ones'},
    {placeValue: 10, placeName: 'tens'},
    {placeValue: 100, placeName: 'hundreds'},
    {placeValue: 1000, placeName: 'thousands'},
    {placeValue: 10000, placeName: 'ten-thousands'},
    {placeValue: 100000, placeName: 'hundred-thousands'}
] as const satisfies readonly {
    placeValue: StandardAlgorithmColumnStep['placeValue'];
    placeName: StandardAlgorithmPlaceName;
}[];

const forcedRegroupingEndDigits = [5, 6, 7, 8, 9] as const;

/** Selects uniformly from all integers in the interval whose ones digit is 5 through 9. */
const randomRegroupingOperand = (minimum: number, maximum: number): number | null => {
    const progressions = forcedRegroupingEndDigits.map(endDigit => {
        const remainder = ((minimum % 10) + 10) % 10;
        const first = minimum + ((endDigit - remainder + 10) % 10);
        return {
            first,
            count: first <= maximum ? Math.floor((maximum - first) / 10) + 1 : 0
        };
    });
    const total = progressions.reduce((sum, progression) => sum + progression.count, 0);
    if (total === 0) return null;

    let selectedIndex = Math.floor(random() * total);
    for (const progression of progressions) {
        if (selectedIndex < progression.count) return progression.first + selectedIndex * 10;
        selectedIndex -= progression.count;
    }
    return null;
};

const digitAt = (value: number, placeValue: number): number =>
    Math.floor(value / placeValue) % 10;

const hasNoZeroDigit = (value: number): boolean => !String(value).includes('0');

const buildAdditionColumns = (
    topValue: number,
    bottomValue: number,
    columnCount: number
): StandardAlgorithmColumnStep[] => {
    let regroupIn: 0 | 1 = 0;

    return placeColumns.slice(0, columnCount).map((place, index) => {
        const topDigit = digitAt(topValue, place.placeValue);
        const bottomDigit = digitAt(bottomValue, place.placeValue);
        const workingValue = topDigit + bottomDigit + regroupIn;
        const resultDigit = workingValue % 10;
        const regroupOut = (workingValue >= 10 ? 1 : 0) as 0 | 1;
        const nextPlace = placeColumns[index + 1];
        const calculation = regroupIn === 1
            ? `${topDigit} + ${bottomDigit} + 1 = ${workingValue}`
            : `${topDigit} + ${bottomDigit} = ${workingValue}`;
        const regroupingRecord = regroupOut === 1
            ? `Write ${resultDigit} in the ${place.placeName} place and carry 1 to the ${nextPlace.placeName} place.`
            : regroupIn === 1
                ? `Include the carried 1, write ${resultDigit} in the ${place.placeName} place, and record no new carry.`
                : `No regrouping is needed; write ${resultDigit} in the ${place.placeName} place.`;

        const column: StandardAlgorithmColumnStep = {
            ...place,
            topDigit,
            bottomDigit,
            regroupIn,
            regroupOut,
            workingValue,
            resultDigit,
            calculation,
            regroupingRecord
        };
        regroupIn = regroupOut;
        return column;
    });
};

const buildSubtractionColumns = (
    topValue: number,
    bottomValue: number,
    columnCount: number
): StandardAlgorithmColumnStep[] => {
    let regroupIn: 0 | 1 = 0;

    return placeColumns.slice(0, columnCount).map((place, index) => {
        const topDigit = digitAt(topValue, place.placeValue);
        const bottomDigit = digitAt(bottomValue, place.placeValue);
        const availableTopDigit = topDigit - regroupIn;
        const regroupOut = (availableTopDigit < bottomDigit ? 1 : 0) as 0 | 1;
        const workingValue = availableTopDigit + 10 * regroupOut;
        const resultDigit = workingValue - bottomDigit;
        const nextPlace = placeColumns[index + 1];
        const adjustedTop = regroupIn === 1 ? `${topDigit} - 1` : `${topDigit}`;
        const borrowedTen = regroupOut === 1 ? ' + 10' : '';
        const calculation = `${adjustedTop}${borrowedTen} - ${bottomDigit} = ${resultDigit}`;
        const regroupingRecord = regroupOut === 1
            ? `Borrow 1 from the ${nextPlace.placeName} place, then write ${resultDigit} in the ${place.placeName} place.`
            : regroupIn === 1
                ? `Account for the previous borrow, write ${resultDigit} in the ${place.placeName} place, and record no new borrow.`
                : `No regrouping is needed; write ${resultDigit} in the ${place.placeName} place.`;

        const column: StandardAlgorithmColumnStep = {
            ...place,
            topDigit,
            bottomDigit,
            regroupIn,
            regroupOut,
            workingValue,
            resultDigit,
            calculation,
            regroupingRecord
        };
        regroupIn = regroupOut;
        return column;
    });
};

const buildProblem = (
    operation: StandardAlgorithmOperation,
    firstOperand: number,
    secondOperand: number
): StandardAlgorithmProblem => {
    const additionResult = firstOperand + secondOperand;
    const topValue = operation === 'addition' ? firstOperand : additionResult;
    const bottomValue = operation === 'addition' ? secondOperand : firstOperand;
    const result = operation === 'addition' ? additionResult : secondOperand;
    const columnCount = String(Math.max(topValue, bottomValue, result)).length;
    const columns = operation === 'addition'
        ? buildAdditionColumns(topValue, bottomValue, columnCount)
        : buildSubtractionColumns(topValue, bottomValue, columnCount);
    const symbol = operation === 'addition' ? '+' : '−';
    const operationName = operation === 'addition' ? 'addition' : 'subtraction';
    const topText = formatStandardNumeral(topValue);
    const bottomText = formatStandardNumeral(bottomValue);
    const resultText = formatStandardNumeral(result);
    const questionEquation = `${topText} ${symbol} ${bottomText} = ?`;
    const solutionEquation = `${topText} ${symbol} ${bottomText} = ${resultText}`;

    return {
        task: 'standard-algorithm',
        operation,
        topValue,
        bottomValue,
        result,
        columns,
        prompt: `Use the standard ${operationName} algorithm to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        explanation: `Work from ones to the highest place, recording every carry or borrow. The completed algorithm gives ${solutionEquation}.`
    };
};

export class StandardAlgorithmAddSubtractGenerator implements ProblemGenerator<
    StandardAlgorithmProblem,
    StandardAlgorithmAddSubtractGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = StandardAlgorithmAddSubtractGeneratorSchema;

    generate(
        config: StandardAlgorithmAddSubtractGeneratorConfig
    ): ProblemStub<StandardAlgorithmProblem> | null {
        validateConfigFields('standard-algorithm-add-subtract', config, ['operation', 'range']);

        const operation = config.operation!;
        if (operation !== 'addition' && operation !== 'subtraction') {
            throw new GeneratorValidationError(
                'standard-algorithm-add-subtract',
                `Unsupported operation "${operation}".`
            );
        }

        const minimum = Math.max(1, Math.ceil(config.range!.min));
        const maximum = Math.floor(config.range!.max) - 1;
        if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum) {
            return null;
        }

        const maximumDigitCount = String(maximum).length;
        if (maximumDigitCount > placeColumns.length) return null;

        // Keeping both operands at the maximum permitted digit width prevents a leading
        // overflow column while still giving the view three to six aligned columns.
        const fullWidthMinimum = Math.max(minimum, 10 ** (maximumDigitCount - 1));
        for (let attempt = 0; attempt < 100; attempt++) {
            const firstOperand = randomRegroupingOperand(fullWidthMinimum, Math.floor(maximum / 2));
            if (firstOperand === null) return null;
            const secondOperand = randomRegroupingOperand(fullWidthMinimum, maximum - firstOperand);
            if (secondOperand === null) continue;
            const sum = firstOperand + secondOperand;

            // NumbersWithoutZero excludes zero as a number. Keeping every displayed
            // numeral zero-free also prevents a result-place zero from visually
            // suggesting that zero is an operand of the authored procedure.
            if ([firstOperand, secondOperand, sum].every(hasNoZeroDigit)) {
                return {data: buildProblem(operation, firstOperand, secondOperand)};
            }
        }
        return null;
    }
}
