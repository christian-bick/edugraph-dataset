import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {CountingEnumerationProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {CountingBasicGeneratorConfig, CountingBasicGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";
import {buildCountingEnumeration, sampleBasicCountingQuantity} from '../basic-counting-domain.ts';

export class CountingBasicGenerator implements ProblemGenerator<CountingEnumerationProblem, CountingBasicGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingBasicGeneratorSchema;

    generate(config: CountingBasicGeneratorConfig): ProblemStub<CountingEnumerationProblem> {
        validateConfigFields('counting-basic', config, ['range', 'parity']);
        return {data: buildCountingEnumeration(sampleBasicCountingQuantity('enumeration', config.range!, config.parity!, random))};
    }
}
