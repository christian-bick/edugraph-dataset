import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticWordProblemRounding} from '../../../types/problems.ts';
import {ArithmeticWordProblemsRoundingGeneratorConfig, ArithmeticWordProblemsRoundingGeneratorSchema} from './spec.ts';
import {operationNames} from '../helpers.ts';
import {generateGrade4Values, buildRounding} from '../word-problem-evidence.ts';
export class ArithmeticWordProblemsRoundingGenerator implements ProblemGenerator<ArithmeticWordProblemRounding, ArithmeticWordProblemsRoundingGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticWordProblemsRoundingGeneratorSchema;

    generate(config: ArithmeticWordProblemsRoundingGeneratorConfig): ProblemStub<ArithmeticWordProblemRounding> | null {
        validateConfigFields('arithmetic-word-problems-rounding', config, ['operations', 'range']);
        const operations = config.operations!;
        if (operations === 'unsupported') return null;
        const namedOperations = [operationNames[operations[0]], operationNames[operations[1]]] as const;
        const minimum = Math.max(1, Math.ceil(config.range!.min));
        const maximum = Math.min(999_999, Math.floor(config.range!.max));
        if (minimum > maximum) return null;
        // The smallest supported rounding place is ten: answers below five round to zero.
        const values = generateGrade4Values(namedOperations, minimum, maximum, Math.max(5, minimum));
        return values ? {data: buildRounding(values, namedOperations)} : null;
    }
}
