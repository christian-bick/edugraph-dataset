import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {TenthsToHundredthsProblem} from '../../../types/problems.ts';
import {FractionTenthsEquivalenceGeneratorConfig, FractionTenthsEquivalenceGeneratorSchema} from './spec.ts';
import {random} from '../../../lib/random.ts';
import {toDecimalFraction} from '../tenths-hundredths.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';

export class FractionTenthsEquivalenceGenerator implements ProblemGenerator<TenthsToHundredthsProblem, FractionTenthsEquivalenceGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionTenthsEquivalenceGeneratorSchema;
    generate(config: FractionTenthsEquivalenceGeneratorConfig): ProblemStub<TenthsToHundredthsProblem> {
        validateConfigFields('fraction-tenths-equivalence', config, ['fractionMagnitude']);
        if (config.fractionMagnitude !== 'proper' && config.fractionMagnitude !== 'equal-whole') {
            throw new GeneratorValidationError('fraction-tenths-equivalence', 'Unsupported fraction magnitude.');
        }
        const first = config.fractionMagnitude === 'proper' ? 1 : 10;
        const count = config.fractionMagnitude === 'proper' ? 9 : 1;
        const numerator = first + Math.floor(random() * count);
        return {data: {
            task: 'tenths-to-hundredths',
            tenths: toDecimalFraction(numerator, 10),
            hundredths: toDecimalFraction(numerator * 10, 100),
            scaleFactor: 10, sharedWhole: 1, relation: 'equal'
        }};
    }
}
