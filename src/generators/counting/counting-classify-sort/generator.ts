import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CountingClassifySortProblem} from '../../../types/problems.ts';
import {random} from '../../../lib/random.ts';
import {CountingClassifySortGeneratorConfig, CountingClassifySortGeneratorSchema} from './spec.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {buildCategoryCountRelations} from '../category-count-relations.ts';
import {classificationRows, sampleClassificationAllocation} from '../canonical-classification-domains.ts';

export class CountingClassifySortGenerator implements ProblemGenerator<CountingClassifySortProblem, CountingClassifySortGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingClassifySortGeneratorSchema;

    generate(config: CountingClassifySortGeneratorConfig): ProblemStub<CountingClassifySortProblem> | null {
        validateConfigFields('counting-classify-sort', config, ['range', 'relation']);
        const relation = config.relation;
        if (relation !== 'least' && relation !== 'most' && relation !== 'ascending' && relation !== 'descending') {
            throw new GeneratorValidationError('counting-classify-sort', 'Unknown category-count relation.');
        }
        const allocation = sampleClassificationAllocation(classificationRows(config.range!, relation), random);
        if (!allocation) return null;
        const categories = Object.fromEntries(allocation.counts.map((count, index) => [['A', 'B', 'C'][index]!, count]));
        return {data: {categories, relation, numObjects: allocation.counts.reduce((sum, count) => sum + count, 0),
            ...buildCategoryCountRelations(categories)}};
    }
}
