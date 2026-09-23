import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {TenthsToHundredthsProblem} from '../../../types/problems.ts';
import {FractionTenthsEquivalenceGeneratorConfig, FractionTenthsEquivalenceGeneratorSchema} from './spec.ts';
import {random} from '../../../lib/random.ts';
import {toDecimalFraction} from '../tenths-hundredths.ts';

export class FractionTenthsEquivalenceGenerator implements ProblemGenerator<TenthsToHundredthsProblem, FractionTenthsEquivalenceGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionTenthsEquivalenceGeneratorSchema;
    generate(_config: FractionTenthsEquivalenceGeneratorConfig): ProblemStub<TenthsToHundredthsProblem> {
        const numerator = Math.floor(random() * 10) + 1;
        return {data: {
            task: 'tenths-to-hundredths',
            tenths: toDecimalFraction(numerator, 10),
            hundredths: toDecimalFraction(numerator * 10, 100),
            scaleFactor: 10, sharedWhole: 1, relation: 'equal'
        }};
    }
}
