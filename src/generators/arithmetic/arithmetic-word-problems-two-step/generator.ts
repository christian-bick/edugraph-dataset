import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticWordProblemTwoStep} from '../../../types/problems.ts';
import {ArithmeticWordProblemsTwoStepGeneratorConfig, ArithmeticWordProblemsTwoStepGeneratorSchema} from './spec.ts';
import {operationNames} from '../helpers.ts';
import {generateLegacyValues} from '../word-problem-evidence.ts';
export class ArithmeticWordProblemsTwoStepGenerator implements ProblemGenerator<ArithmeticWordProblemTwoStep, ArithmeticWordProblemsTwoStepGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticWordProblemsTwoStepGeneratorSchema;

    generate(config: ArithmeticWordProblemsTwoStepGeneratorConfig): ProblemStub<ArithmeticWordProblemTwoStep> | null {
        validateConfigFields('arithmetic-word-problems-two-step', config, ['operations', 'range']);
        const operations = config.operations!;
        if (operations === 'unsupported') return null;
        const namedOperations = [operationNames[operations[0]], operationNames[operations[1]]] as const;
        const minimum = Math.max(1, Math.ceil(config.range!.min));
        const maximum = Math.min(100, Math.floor(config.range!.max));
        if (minimum > maximum) return null;
        const values = generateLegacyValues(namedOperations, minimum, maximum);
        return values ? {data: {kind: 'two-step', ...values, operations: namedOperations}} : null;
    }
}
