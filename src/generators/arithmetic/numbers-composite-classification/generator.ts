import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CompositeClassificationProblem} from '../../../types/problems.ts';
import {generateCompositeClassification} from '../factor-evidence.ts';
import {NumbersCompositeClassificationGeneratorConfig, NumbersCompositeClassificationGeneratorSchema} from './spec.ts';

export class NumbersCompositeClassificationGenerator implements ProblemGenerator<CompositeClassificationProblem, NumbersCompositeClassificationGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = NumbersCompositeClassificationGeneratorSchema;

    generate(config: NumbersCompositeClassificationGeneratorConfig): ProblemStub<CompositeClassificationProblem> {
        validateConfigFields('numbers-composite-classification', config, []);
        return {data: generateCompositeClassification()};
    }
}
