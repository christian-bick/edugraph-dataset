import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {
    ComparisonProblem,
    MultiDigitComparisonEvidence,
    WholeNumberPlaceValue
} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {
    createWholeNumberPlaceValues,
    displayWholeNumberPlaceName,
    formatStandardNumeral
} from '../../lib/whole-number-notation.ts';
import {ComparisonGeneratorConfig, ComparisonGeneratorSchema} from "./spec.ts";
import {Scope} from 'edugraph-ts';
import {validateConfigFields} from "../../lib/errors.ts";

const symbolForRelation = (relation: 'less' | 'greater' | 'equal'): '<' | '>' | '=' => {
    if (relation === 'less') return '<';
    if (relation === 'greater') return '>';
    return '=';
};

const conclusionForRelation = (
    leftNumeral: string,
    rightNumeral: string,
    relation: 'less' | 'greater' | 'equal'
): string => {
    if (relation === 'less') return `${leftNumeral} is less than ${rightNumeral}.`;
    if (relation === 'greater') return `${leftNumeral} is greater than ${rightNumeral}.`;
    return `${leftNumeral} is equal to ${rightNumeral}.`;
};

const createComparisonEvidence = (
    num1: number,
    num2: number
): MultiDigitComparisonEvidence => {
    if (num1 === num2) {
        return {
            kind: 'all-equal',
            explanation: 'Every corresponding place has the same digit, so the numbers are equal.'
        };
    }

    const highestExponent = Math.max(
        createWholeNumberPlaceValues(num1)[0]!.exponent,
        createWholeNumberPlaceValues(num2)[0]!.exponent
    );

    let exponent = highestExponent;
    let magnitude = 10 ** exponent;
    let leftDigit = Math.floor(num1 / magnitude) % 10;
    let rightDigit = Math.floor(num2 / magnitude) % 10;
    while (leftDigit === rightDigit) {
        exponent--;
        magnitude = 10 ** exponent;
        leftDigit = Math.floor(num1 / magnitude) % 10;
        rightDigit = Math.floor(num2 / magnitude) % 10;
    }

    const placeName = createWholeNumberPlaceValues(magnitude)[0]!.name;
    const relationWord = leftDigit < rightDigit ? 'less than' : 'greater than';
    return {
        kind: 'first-difference',
        placeName,
        exponent: exponent as WholeNumberPlaceValue['exponent'],
        leftDigit,
        rightDigit,
        leftPlaceValue: leftDigit * magnitude,
        rightPlaceValue: rightDigit * magnitude,
        explanation: `The first differing place is the ${displayWholeNumberPlaceName(placeName)} place: ${leftDigit} is ${relationWord} ${rightDigit}.`
    };
};

export class ComparisonGenerator implements ProblemGenerator<ComparisonProblem, ComparisonGeneratorConfig> {
    type: AbstractProblem['type'] = 'comparison';
    schema = ComparisonGeneratorSchema;

    generate(config: ComparisonGeneratorConfig): ProblemStub<ComparisonProblem> | null {
        validateConfigFields('comparison', config, ['range', 'relation', 'requireNegative', 'requireZero']);
        const resolvedRange = config.range!;
        const minMagnitude = Math.max(1, Math.ceil(resolvedRange.min));
        const maxMagnitude = Math.floor(resolvedRange.max);
        if (resolvedRange.min > resolvedRange.max || maxMagnitude < minMagnitude) return null;

        const requireNegative = config.requireNegative!;
        const requireZero = config.requireZero!;

        if (maxMagnitude > 1000 && !requireNegative && !requireZero) {
            const count = maxMagnitude - minMagnitude + 1;
            if (count < 1 || (config.relation !== Scope.Equal && count < 2)) return null;

            const first = minMagnitude + Math.floor(random() * count);
            const offset = config.relation === Scope.Equal
                ? 0
                : 1 + Math.floor(random() * (count - 1));
            const second = minMagnitude + ((first - minMagnitude + offset) % count);
            const lower = Math.min(first, second);
            const higher = Math.max(first, second);
            const [num1, num2] = config.relation === Scope.Less
                ? [lower, higher]
                : config.relation === Scope.Greater
                    ? [higher, lower]
                    : [first, first];
            const relation = config.relation === Scope.Less
                ? 'less'
                : config.relation === Scope.Greater
                    ? 'greater'
                    : 'equal';
            const leftNumeral = formatStandardNumeral(num1);
            const rightNumeral = formatStandardNumeral(num2);
            const symbol = symbolForRelation(relation);

            return {
                data: {
                    task: 'multi-digit-place-value-comparison',
                    num1,
                    num2,
                    relation,
                    leftNumeral,
                    rightNumeral,
                    symbol,
                    prompt: 'Compare the two multi-digit whole numbers using <, >, or =.',
                    comparisonEquation: `${leftNumeral} ${symbol} ${rightNumeral}`,
                    conclusion: conclusionForRelation(leftNumeral, rightNumeral, relation),
                    evidence: createComparisonEvidence(num1, num2)
                }
            };
        }

        const magnitude = Math.floor(random() * (maxMagnitude - minMagnitude + 1)) + minMagnitude;

        let num1 = 0;
        let num2 = 0;

        if (config.relation === Scope.Equal) {
            if (requireZero && requireNegative) return null;
            num1 = requireZero ? 0 : requireNegative ? -magnitude : magnitude;
            num2 = num1;
        } else if (config.relation === Scope.Less) {
            if (requireZero && requireNegative) {
                [num1, num2] = [-magnitude, 0];
            } else if (requireZero) {
                [num1, num2] = [0, magnitude];
            } else if (requireNegative) {
                [num1, num2] = [-magnitude, magnitude];
            } else {
                if (minMagnitude === maxMagnitude) return null;
                [num1, num2] = [minMagnitude, maxMagnitude];
            }
        } else if (config.relation === Scope.Greater) {
            if (requireZero && requireNegative) {
                [num1, num2] = [0, -magnitude];
            } else if (requireZero) {
                [num1, num2] = [magnitude, 0];
            } else if (requireNegative) {
                [num1, num2] = [magnitude, -magnitude];
            } else {
                if (minMagnitude === maxMagnitude) return null;
                [num1, num2] = [maxMagnitude, minMagnitude];
            }
        } else {
            return null;
        }

        let resolvedRelation: 'less' | 'greater' | 'equal';
        if (num1 > num2) {
            resolvedRelation = 'greater';
        } else if (num1 < num2) {
            resolvedRelation = 'less';
        } else {
            resolvedRelation = 'equal';
        }

        return {
            data: {
                num1,
                num2,
                relation: resolvedRelation
            }
        };
    }
}
