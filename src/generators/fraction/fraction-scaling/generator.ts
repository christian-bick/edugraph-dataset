import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionScaleComparisonProblem, FractionScaleRational} from '../../../types/problems.ts';
import {FractionScalingGeneratorSchema} from './spec.ts';
import type {FractionScalingGeneratorConfig} from './spec.ts';

type Profile = NonNullable<FractionScalingGeneratorConfig['comparisonProfile']>;

const integer = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const rational = (numerator: number, denominator: number): FractionScaleRational =>
    ({numerator, denominator});

/** The original a/b notation witnesses the fraction form even when a = b. */
const numeratorFor = (profile: Profile, denominator: number): number => {
    switch (profile) {
        case 'greater': return integer(denominator + 1, 2 * denominator - 1);
        case 'less': return integer(1, denominator - 1);
        case 'equal': return denominator;
    }
};

const createComparison = (profile: Profile): FractionScaleComparisonProblem => {
    const q = integer(2, 5);
    const b = integer(2, 6);
    const a = numeratorFor(profile, b);

    return {
        kind: 'fraction-scale-comparison',
        reference: rational(q, 1),
        scaleFactor: rational(a, b),
        product: rational(q * a, b),
        relation: profile,
        onePart: rational(q, b),
        partDifferenceCount: a - b,
        wholeNumberAnalogy: {factor: 2, product: rational(2 * q, 1)}
    };
};

export class FractionScalingGenerator implements ProblemGenerator<
    FractionScaleComparisonProblem,
    FractionScalingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionScalingGeneratorSchema;

    generate(config: FractionScalingGeneratorConfig): ProblemStub<FractionScaleComparisonProblem> {
        validateConfigFields('fraction-scaling', config, ['comparisonProfile']);
        switch (config.comparisonProfile) {
            case 'greater':
            case 'less':
            case 'equal':
                return {data: createComparison(config.comparisonProfile)};
            default:
                throw new GeneratorValidationError('fraction-scaling',
                    'Unsupported comparison profile.');
        }
    }
}
