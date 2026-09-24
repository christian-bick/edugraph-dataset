import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {SubtractionCountingBackProblem} from '../../../types/problems.ts';
import {IntegerSubtractionCountingBackGeneratorConfig, IntegerSubtractionCountingBackGeneratorSchema} from './spec.ts';
import {subtractionCountingBack, strategyBounds} from '../integer-strategy-evidence.ts';
export class IntegerSubtractionCountingBackGenerator implements ProblemGenerator<SubtractionCountingBackProblem, IntegerSubtractionCountingBackGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerSubtractionCountingBackGeneratorSchema;

    generate(config: IntegerSubtractionCountingBackGeneratorConfig): ProblemStub<SubtractionCountingBackProblem> | null {
        validateConfigFields('integer-subtraction-counting-back', config, ['range']);
        const bounds = strategyBounds(config.range!);
        if (!bounds) return null;
        const data = subtractionCountingBack(bounds);
        return data ? {data} : null;
    }
}
