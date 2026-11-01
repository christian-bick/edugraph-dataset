import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {EquationJudgmentProblem} from '../../../types/problems.ts';
import {ArithmeticEquationJudgmentGeneratorConfig, ArithmeticEquationJudgmentGeneratorSchema, spec} from './spec.ts';
import {judgmentDomain} from './domain.ts';

export class ArithmeticEquationJudgmentGenerator implements ProblemGenerator<EquationJudgmentProblem, ArithmeticEquationJudgmentGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticEquationJudgmentGeneratorSchema;
    readonly spec = spec;

    generate(config: ArithmeticEquationJudgmentGeneratorConfig): ProblemStub<EquationJudgmentProblem> {
        validateConfigFields('arithmetic-equation-judgment', config, ['profile']);
        const candidates = judgmentDomain(config.profile!);
        if (!candidates.length) {
            throw new GeneratorValidationError('arithmetic-equation-judgment', 'The selected profile has no mathematical claims.');
        }
        return {data: {...candidates[Math.floor(random() * candidates.length)]!}};
    }
}
