import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticWordProblemInterpretedRemainder} from '../../../types/problems.ts';
import {ArithmeticWordProblemsInterpretedRemainderGeneratorConfig, ArithmeticWordProblemsInterpretedRemainderGeneratorSchema} from './spec.ts';
import {generateInterpretedRemainder} from '../word-problem-evidence.ts';
export class ArithmeticWordProblemsInterpretedRemainderGenerator implements ProblemGenerator<ArithmeticWordProblemInterpretedRemainder, ArithmeticWordProblemsInterpretedRemainderGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticWordProblemsInterpretedRemainderGeneratorSchema;

    generate(config: ArithmeticWordProblemsInterpretedRemainderGeneratorConfig): ProblemStub<ArithmeticWordProblemInterpretedRemainder> | null {
        validateConfigFields('arithmetic-word-problems-interpreted-remainder', config, ['range']);
        const minimum = Math.max(1, Math.ceil(config.range!.min));
        return generateInterpretedRemainder(minimum, Math.floor(config.range!.max));
    }
}
