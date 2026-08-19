import {random} from '../../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
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

    generate(config: AreaDecompositionGeneratorConfig): ProblemStub<AreaDecompositionProblem> | null {
        validateConfigFields('area-decomposition', config, ['useDistributiveModel']);

        if (!config.useDistributiveModel) {
            const leftWidth = randomInteger(2, 3);
            const rightWidth = randomInteger(2, 3);
            const totalHeight = randomInteger(3, 5);
            const bottomHeight = randomInteger(1, Math.min(2, totalHeight - 1));
            const leftArea = leftWidth * totalHeight;
            const rightArea = rightWidth * bottomHeight;
            return {
                data: {
                    kind: 'rectilinear',
                    leftWidth,
                    rightWidth,
                    totalHeight,
                    bottomHeight,
                    leftArea,
                    rightArea,
                    totalArea: leftArea + rightArea
                }
            };
        }

        const hasDistributiveFeatures = [Area.Multiplication, Scope.ThreeOperands]
            .every(label => config.distributiveFeatures?.includes(label));
        if (!hasDistributiveFeatures) return null;

        const height = randomInteger(2, 5);
        const leftWidth = randomInteger(2, 3);
        const rightWidth = randomInteger(2, 3);
        const totalWidth = leftWidth + rightWidth;
        const leftArea = height * leftWidth;
        const rightArea = height * rightWidth;

        return {
            data: {
                kind: 'distributive',
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
