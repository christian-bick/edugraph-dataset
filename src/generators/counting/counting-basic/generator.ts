import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {CountingProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {CountingBasicGeneratorConfig, CountingBasicGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";
import {sampleCountingQuantity} from '../counting-quantity.ts';

export class CountingBasicGenerator implements ProblemGenerator<CountingProblem, CountingBasicGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingBasicGeneratorSchema;

    generate(config: CountingBasicGeneratorConfig): ProblemStub<CountingProblem> | null {
        validateConfigFields('counting-basic', config, ['range', 'parity']);
        const data = sampleCountingQuantity(config.range!, config.parity!, random);
        return data ? {data} : null;
    }
}
