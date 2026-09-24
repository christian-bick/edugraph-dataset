import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {generateFactorPairs, generateMultipleTest} from '../factor-evidence.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FactorPairsOrMultipleTestProblem
} from '../../../types/problems.ts';
import {
    FactorMultipleRelationsGeneratorConfig,
    FactorMultipleRelationsGeneratorSchema
} from './spec.ts';

export class FactorMultipleRelationsGenerator implements ProblemGenerator<
    FactorPairsOrMultipleTestProblem,
    FactorMultipleRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = FactorMultipleRelationsGeneratorSchema;

    generate(
        config: FactorMultipleRelationsGeneratorConfig
    ): ProblemStub<FactorPairsOrMultipleTestProblem> {
        validateConfigFields('factor-multiple-relations', config, ['task']);

        switch (config.task) {
            case 'factor-pairs':
                return {data: generateFactorPairs()};
            case 'one-digit-multiple-test':
                return {data: generateMultipleTest()};
            default:
                throw new GeneratorValidationError(
                    'factor-multiple-relations',
                    `Unsupported task "${config.task}".`
                );
        }
    }
}
