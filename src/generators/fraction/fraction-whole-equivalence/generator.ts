import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {WholeNumberFractionEquivalenceProblem} from '../../../types/problems.ts';
import {FractionWholeEquivalenceGeneratorConfig, FractionWholeEquivalenceGeneratorSchema} from './spec.ts';
import {random} from '../../../lib/random.ts';

export class FractionWholeEquivalenceGenerator implements ProblemGenerator<WholeNumberFractionEquivalenceProblem, FractionWholeEquivalenceGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionWholeEquivalenceGeneratorSchema;
    generate(_config: FractionWholeEquivalenceGeneratorConfig): ProblemStub<WholeNumberFractionEquivalenceProblem> {
        const wholeNumber = [1, 2, 3][Math.floor(random() * 3)] as 1 | 2 | 3;
        const denominator = ([2, 3, 4, 6, 8] as const)[Math.floor(random() * 5)]!;
        return {data: {
            task: 'represent-whole-as-fraction', wholeNumber,
            fraction: {numerator: wholeNumber * denominator, denominator}, relation: 'equal'
        }};
    }
}
