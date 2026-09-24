import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticWordProblemLetterEquation} from '../../../types/problems.ts';
import {ArithmeticWordProblemsLetterEquationGeneratorConfig, ArithmeticWordProblemsLetterEquationGeneratorSchema} from './spec.ts';
import {operationNames} from '../helpers.ts';
import {generateGrade4Values, buildLetterEquation} from '../word-problem-evidence.ts';
export class ArithmeticWordProblemsLetterEquationGenerator implements ProblemGenerator<ArithmeticWordProblemLetterEquation, ArithmeticWordProblemsLetterEquationGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticWordProblemsLetterEquationGeneratorSchema;

    generate(config: ArithmeticWordProblemsLetterEquationGeneratorConfig): ProblemStub<ArithmeticWordProblemLetterEquation> | null {
        validateConfigFields('arithmetic-word-problems-letter-equation', config, ['operations', 'range']);
        const operations = config.operations!;
        if (operations === 'unsupported') return null;
        const namedOperations = [operationNames[operations[0]], operationNames[operations[1]]] as const;
        const minimum = Math.max(1, Math.ceil(config.range!.min));
        const maximum = Math.min(999_999, Math.floor(config.range!.max));
        if (minimum > maximum) return null;
        const values = generateGrade4Values(namedOperations, minimum, maximum);
        return values ? {data: buildLetterEquation(values, namedOperations)} : null;
    }
}
