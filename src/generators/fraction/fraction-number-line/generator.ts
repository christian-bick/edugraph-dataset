import {Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {FractionNumberLineProblem, FractionParts} from '../../../types/problems.ts';
import {
    FractionNumberLineGeneratorConfig,
    FractionNumberLineGeneratorSchema
} from './spec.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const FRACTION_TYPES = [
    Scope.UnitFractions,
    Scope.NonUnitFractions,
    Scope.ImproperFractions
] as const;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const randomItem = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)];

export class FractionNumberLineGenerator implements ProblemGenerator<
    FractionNumberLineProblem,
    FractionNumberLineGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionNumberLineGeneratorSchema;

    generate(config: FractionNumberLineGeneratorConfig): ProblemStub<FractionNumberLineProblem> {
        validateConfigFields('fraction-number-line', config, ['fractionType']);

        const fractionType = config.fractionType!;
        if (!FRACTION_TYPES.includes(fractionType)) {
            throw new GeneratorValidationError(
                'fraction-number-line',
                `Unsupported fractionType "${fractionType}".`
            );
        }

        const eligibleDenominators = fractionType === Scope.NonUnitFractions
            ? DENOMINATORS.filter(denominator => denominator > 2)
            : DENOMINATORS;
        const denominator = randomItem(eligibleDenominators);

        const numerator = fractionType === Scope.UnitFractions
            ? 1
            : fractionType === Scope.NonUnitFractions
                ? randomInteger(2, denominator - 1)
                : randomInteger(denominator + 1, 2 * denominator - 1);
        const unitFraction = `1/${denominator}`;
        const targetFraction = `${numerator}/${denominator}`;

        return {
            data: {
                task: 'locate-fraction',
                numerator,
                denominator,
                unitFraction,
                targetFraction,
                wholeCount: numerator > denominator ? 2 : 1,
                steps: Array.from({length: numerator}, (_, index) => ({
                    fromNumerator: index,
                    toNumerator: index + 1
                })),
                answer: targetFraction
            }
        };
    }
}
