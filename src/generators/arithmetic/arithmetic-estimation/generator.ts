import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {ArithmeticEstimationProblem, ArithmeticOperation} from '../../../types/problems.ts';
import {operationNames} from '../helpers.ts';
import {sampleCanonicalEstimation} from './canonical-domain.ts';
import {ArithmeticEstimationGeneratorConfig, ArithmeticEstimationGeneratorSchema} from './spec.ts';

export class ArithmeticEstimationGenerator implements ProblemGenerator<ArithmeticEstimationProblem, ArithmeticEstimationGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticEstimationGeneratorSchema;

    generate(config: ArithmeticEstimationGeneratorConfig): ProblemStub<ArithmeticEstimationProblem> | null {
        validateConfigFields('arithmetic-estimation', config, ['operation', 'range', 'zeroPresence']);
        if (!config.operation) return null;
        if (typeof config.zeroPresence !== 'boolean') {
            throw new GeneratorValidationError('arithmetic-estimation', 'Zero presence must be a boolean.');
        }
        const data = sampleCanonicalEstimation(operationNames[config.operation] as ArithmeticOperation,
            config.zeroPresence, config.range!);
        return data ? {data} : null;
    }
}
