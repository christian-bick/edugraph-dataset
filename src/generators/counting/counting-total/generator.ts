import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CountingTotalProblem} from '../../../types/problems.ts';
import {buildCountingTotal, sampleBasicCountingQuantity} from '../basic-counting-domain.ts';
import {CountingTotalGeneratorSchema, type CountingTotalGeneratorConfig} from './spec.ts';

export class CountingTotalGenerator implements ProblemGenerator<CountingTotalProblem, CountingTotalGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingTotalGeneratorSchema;

    generate(config: CountingTotalGeneratorConfig): ProblemStub<CountingTotalProblem> {
        validateConfigFields('counting-total', config, ['range', 'parity']);
        return {data: buildCountingTotal(sampleBasicCountingQuantity('total', config.range!, config.parity!, random))};
    }
}
