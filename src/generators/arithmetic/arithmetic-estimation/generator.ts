import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {ArithmeticEstimationProblem, ArithmeticOperation} from '../../../types/problems.ts';
import {operationNames} from '../helpers.ts';
import {sampleEstimation} from './numeric-domain.ts';
import {ArithmeticEstimationGeneratorConfig, ArithmeticEstimationGeneratorSchema} from './spec.ts';

export class ArithmeticEstimationGenerator implements ProblemGenerator<ArithmeticEstimationProblem, ArithmeticEstimationGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticEstimationGeneratorSchema;

    generate(config: ArithmeticEstimationGeneratorConfig): ProblemStub<ArithmeticEstimationProblem> | null {
        validateConfigFields('arithmetic-estimation', config, ['operation', 'range', 'zeroPresence']);
        if (!config.operation || config.operation === 'unsupported') return null;
        if (typeof config.zeroPresence !== 'boolean') {
            throw new GeneratorValidationError('arithmetic-estimation', 'Zero presence must be a boolean.');
        }
        const data = sampleEstimation({operation: operationNames[config.operation] as ArithmeticOperation,
            minimum: Math.max(0, Math.ceil(config.range!.min)), maximum: Math.min(1000, Math.floor(config.range!.max))},
        config.zeroPresence);
        return data ? {data} : null;
    }
}
