import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {EqualGroupsCollectionProblem} from '../../../types/problems.ts';
import {
    EqualGroupsCollectionGeneratorConfig,
    EqualGroupsCollectionGeneratorSchema
} from './spec.ts';

const randomInteger = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

export class EqualGroupsCollectionGenerator implements ProblemGenerator<
    EqualGroupsCollectionProblem,
    EqualGroupsCollectionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = EqualGroupsCollectionGeneratorSchema;

    generate(config: EqualGroupsCollectionGeneratorConfig): ProblemStub<EqualGroupsCollectionProblem> {
        validateConfigFields('equal-groups-collection', config, ['operation']);

        const operation = config.operation!;
        const groupCount = randomInteger(2, 6);
        const groupSize = randomInteger(2, 6);
        const total = groupCount * groupSize;
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
