import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {NumberArrayProblem} from '../../../types/problems.ts';
import {NumberArrayGeneratorConfig, NumberArrayGeneratorSchema} from './spec.ts';
import {arrayCandidates} from './profiles.ts';

export class NumberArrayGenerator implements ProblemGenerator<NumberArrayProblem, NumberArrayGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = NumberArrayGeneratorSchema;

    generate(config: NumberArrayGeneratorConfig): ProblemStub<NumberArrayProblem> | null {
        validateConfigFields('number-array', config, [
            'operation',
            'requireTwoOperands',
            'profile'
        ]);
        validateConfigFields('number-array', config.profile!, ['range', 'smallestDigits', 'largestDigits', 'iterated']);

        const candidates = arrayCandidates(config.operation!, config.requireTwoOperands!, config.profile!);
        if (!candidates.length) return null;
        return {data: candidates[Math.floor(random() * candidates.length)]!};
    }
}
