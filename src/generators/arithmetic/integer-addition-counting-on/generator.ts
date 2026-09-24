import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {AdditionCountingOnProblem} from '../../../types/problems.ts';
import {IntegerAdditionCountingOnGeneratorConfig, IntegerAdditionCountingOnGeneratorSchema} from './spec.ts';
import {additionCountingOn, strategyBounds} from '../integer-strategy-evidence.ts';
export class IntegerAdditionCountingOnGenerator implements ProblemGenerator<AdditionCountingOnProblem, IntegerAdditionCountingOnGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerAdditionCountingOnGeneratorSchema;

    generate(config: IntegerAdditionCountingOnGeneratorConfig): ProblemStub<AdditionCountingOnProblem> | null {
        validateConfigFields('integer-addition-counting-on', config, ['range']);
        const bounds = strategyBounds(config.range!);
        if (!bounds) return null;
        const data = additionCountingOn(bounds);
        return data ? {data} : null;
    }
}
