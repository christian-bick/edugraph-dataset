import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticWordProblemLetterEquation} from '../../../types/problems.ts';
import {ArithmeticWordProblemsLetterEquationGeneratorConfig, ArithmeticWordProblemsLetterEquationGeneratorSchema} from './spec.ts';
import {operationNames} from '../helpers.ts';
import {random} from '../../../lib/random.ts';
import {letterEquationDomain, letterEquationFrame} from './domain.ts';
export class ArithmeticWordProblemsLetterEquationGenerator implements ProblemGenerator<ArithmeticWordProblemLetterEquation, ArithmeticWordProblemsLetterEquationGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticWordProblemsLetterEquationGeneratorSchema;

    generate(config: ArithmeticWordProblemsLetterEquationGeneratorConfig): ProblemStub<ArithmeticWordProblemLetterEquation> | null {
        validateConfigFields('arithmetic-word-problems-letter-equation', config, ['operations', 'range']);
        const operations = config.operations!;
        if (operations === 'unsupported') return null;
        const namedOperations = [operationNames[operations[0]], operationNames[operations[1]]] as const;
        const domain = letterEquationDomain(namedOperations, config.range!);
        return domain.count ? {data: letterEquationFrame(domain, namedOperations, Math.floor(random() * domain.count))} : null;
    }
}
