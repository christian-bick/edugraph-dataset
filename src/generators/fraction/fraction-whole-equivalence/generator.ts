import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {WholeNumberFractionEquivalenceProblem} from '../../../types/problems.ts';
import {FractionWholeEquivalenceGeneratorConfig, FractionWholeEquivalenceGeneratorSchema} from './spec.ts';
import {random} from '../../../lib/random.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {wholeFractionCandidates} from './domain.ts';

export class FractionWholeEquivalenceGenerator implements ProblemGenerator<WholeNumberFractionEquivalenceProblem, FractionWholeEquivalenceGeneratorConfig> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionWholeEquivalenceGeneratorSchema;
    generate(config: FractionWholeEquivalenceGeneratorConfig): ProblemStub<WholeNumberFractionEquivalenceProblem> {
        validateConfigFields('fraction-whole-equivalence', config, ['range']);
        if (Object.keys(config).some(key => key !== 'range')) throw new GeneratorValidationError('fraction-whole-equivalence', 'Unexpected configuration field.');
        const candidates = wholeFractionCandidates(config.range!);
        const {wholeNumber, denominator} = candidates[Math.floor(random() * candidates.length)]!;
        return {data: {
            task: 'represent-whole-as-fraction', wholeNumber,
            fraction: {numerator: wholeNumber * denominator, denominator}, relation: 'equal'
        }};
    }
}
