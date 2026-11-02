import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CountingClassifyCountProblem} from '../../../types/problems.ts';
import {random} from '../../../lib/random.ts';
import {CountingClassifyCountGeneratorConfig, CountingClassifyCountGeneratorSchema} from './spec.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {classificationRows, sampleClassificationAllocation} from '../canonical-classification-domains.ts';

export class CountingClassifyCountGenerator implements ProblemGenerator<CountingClassifyCountProblem, CountingClassifyCountGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingClassifyCountGeneratorSchema;

    generate(config: CountingClassifyCountGeneratorConfig): ProblemStub<CountingClassifyCountProblem> | null {
        validateConfigFields('counting-classify-count', config, ['range']);
        const allocation = sampleClassificationAllocation(classificationRows(config.range!), random);
        if (!allocation) return null;
        return {data: {categories: Object.fromEntries(allocation.counts.map((count, index) => [['A', 'B', 'C'][index]!, count])),
            numObjects: allocation.counts.reduce((sum, count) => sum + count, 0)}};
    }
}
