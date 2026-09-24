import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PrimeClassificationProblem} from '../../../types/problems.ts';
import {generatePrimeClassification} from '../factor-evidence.ts';
import {NumbersPrimeClassificationGeneratorConfig, NumbersPrimeClassificationGeneratorSchema} from './spec.ts';

export class NumbersPrimeClassificationGenerator implements ProblemGenerator<PrimeClassificationProblem, NumbersPrimeClassificationGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = NumbersPrimeClassificationGeneratorSchema;

    generate(config: NumbersPrimeClassificationGeneratorConfig): ProblemStub<PrimeClassificationProblem> {
        validateConfigFields('numbers-prime-classification', config, []);
        return {data: generatePrimeClassification()};
    }
}
