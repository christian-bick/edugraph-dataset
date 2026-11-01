import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {EqualGroupsCollectionProblem} from '../../../types/problems.ts';
import {
    EqualGroupsCollectionGeneratorConfig,
    EqualGroupsCollectionGeneratorSchema
} from './spec.ts';
import {equalGroupCollectionsWithin} from './collections.ts';

export class EqualGroupsCollectionGenerator implements ProblemGenerator<
    EqualGroupsCollectionProblem,
    EqualGroupsCollectionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = EqualGroupsCollectionGeneratorSchema;

    generate(config: EqualGroupsCollectionGeneratorConfig): ProblemStub<EqualGroupsCollectionProblem> {
        validateConfigFields('equal-groups-collection', config, ['operation', 'range']);

        const operation = config.operation!;
        if (!['multiplication', 'partitive-division', 'quotative-division'].includes(operation)) {
            throw new GeneratorValidationError('equal-groups-collection', 'Unsupported collection operation.');
        }
        const range = config.range!;
        let canonical;
        try {
            canonical = createCanonicalNumericRange(range.max, range.min);
        } catch {
            throw new GeneratorValidationError('equal-groups-collection', 'Invalid canonical range.');
        }
        if (range.maximumAbove !== canonical.maximumAbove || range.minimumBelow !== canonical.minimumBelow) {
            throw new GeneratorValidationError('equal-groups-collection', 'Invalid canonical range witnesses.');
        }
        const collections = equalGroupCollectionsWithin(range);
        if (!collections.length) {
            throw new GeneratorValidationError('equal-groups-collection', 'Unsupported collection range.');
        }
        const {groupCount, groupSize, total} = collections[Math.floor(random() * collections.length)]!;
        const answer = operation === 'partitive-division'
            ? groupSize
            : operation === 'quotative-division'
                ? groupCount
                : total;

        return {
            data: {
                operation,
                groupCount,
                groupSize,
                total,
                answer
            }
        };
    }
}
