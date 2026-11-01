import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {
    ComparisonProblem,
    MultiDigitComparisonEvidence,
    WholeNumberPlaceValue
} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {
    createWholeNumberPlaceValues
} from '../../lib/whole-number-notation.ts';
import {ComparisonGeneratorConfig, ComparisonGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";
import {comparisonIntervals} from './sampling.ts';
import {hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';

const createComparisonEvidence = (
    num1: number,
    num2: number
): MultiDigitComparisonEvidence => {
    if (num1 === num2) {
        return {kind: 'all-equal'};
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
    return {
        kind: 'first-difference',
        placeName,
        exponent: exponent as WholeNumberPlaceValue['exponent'],
        leftDigit,
        rightDigit,
        leftPlaceValue: leftDigit * magnitude,
        rightPlaceValue: rightDigit * magnitude
    };
};

export class ComparisonGenerator implements ProblemGenerator<ComparisonProblem, ComparisonGeneratorConfig> {
    type: AbstractProblem['type'] = 'comparison';
    schema = ComparisonGeneratorSchema;

    generate(config: ComparisonGeneratorConfig): ProblemStub<ComparisonProblem> | null {
        validateConfigFields('comparison', config, ['comparison']);
        const profile = config.comparison!;
        validateConfigFields('comparison', profile,
            ['range', 'maximumValue', 'relation', 'requireNegative', 'requireZero']);
        const intervals = comparisonIntervals(profile);
        if (!intervals) return null;
        const {range, relation, requireNegative, requireZero} = profile;
        const drawInteger = (min: number, max: number): number =>
            min + Math.floor(random() * (max - min + 1));
        const low = drawInteger(intervals.lowMinimum, intervals.lowMaximum);
        const high = relation === 'equal' ? low : drawInteger(
            Math.max(intervals.highMinimum, low + (requireNegative || requireZero ? 0 : 1)),
            intervals.highMaximum
        );
        const lower = requireNegative ? -high : low;
        const higher = relation === 'equal' ? lower : requireNegative && requireZero ? 0 : high;
        // A negative/nonzero comparison retains its smaller-magnitude positive witness.
        const largerValue = requireNegative && !requireZero && relation !== 'equal' ? low : higher;
        const [num1, num2] = relation === 'greater' ? [largerValue, lower] : [lower, largerValue];
        if (!hasCanonicalRangeWitness([num1, num2], range)) return null;

        if (range.max > 1000 && !requireNegative && !requireZero) {
            return {
                data: {
                    task: 'multi-digit-place-value-comparison',
                    num1,
                    num2,
                    relation,
                    evidence: createComparisonEvidence(num1, num2)
                }
            };
        }

        return {
            data: {
                num1,
                num2,
                relation
            }
        };
    }
}
