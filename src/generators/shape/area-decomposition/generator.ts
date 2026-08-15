import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {AreaDecompositionProblem} from '../../../types/problems.ts';
import {AreaDecompositionGeneratorConfig, AreaDecompositionGeneratorSchema} from './spec.ts';

const randomInteger = (min: number, max: number) =>
    min + Math.floor(random() * (max - min + 1));

export class AreaDecompositionGenerator implements ProblemGenerator<
    AreaDecompositionProblem,
    AreaDecompositionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = AreaDecompositionGeneratorSchema;

    generate(_config: AreaDecompositionGeneratorConfig): ProblemStub<AreaDecompositionProblem> {
        const height = randomInteger(2, 5);
        const leftWidth = randomInteger(2, 3);
        const rightWidth = randomInteger(2, 3);
        const totalWidth = leftWidth + rightWidth;
        const leftArea = height * leftWidth;
        const rightArea = height * rightWidth;

        return {
            data: {
                height,
                leftWidth,
                rightWidth,
                totalWidth,
                leftArea,
                rightArea,
                totalArea: leftArea + rightArea
            }
        };
    }
}
