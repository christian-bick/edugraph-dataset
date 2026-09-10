import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapePartitionEquivalenceProblem} from '../../../types/problems.ts';
import {
    ShapePartitionEquivalenceGeneratorConfig,
    ShapePartitionEquivalenceGeneratorSchema
} from './spec.ts';

export class ShapePartitionEquivalenceGenerator implements ProblemGenerator<
    ShapePartitionEquivalenceProblem,
    ShapePartitionEquivalenceGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapePartitionEquivalenceGeneratorSchema;

    generate(
        config: ShapePartitionEquivalenceGeneratorConfig
    ): ProblemStub<ShapePartitionEquivalenceProblem> | null {
        validateConfigFields('shape-partition-equivalence', config, ['shape']);

        if (config.shape === 'rectangle') {
            return {data: {
                whole: {shape: 'rectangle', width: 19, height: 13},
                boundaries: [
                    {kind: 'segment', start: {x: 0, y: -6.5}, end: {x: 0, y: 6.5}},
                    {kind: 'segment', start: {x: -9.5, y: -6.5}, end: {x: 9.5, y: 6.5}}
                ]
            }};
        }
        if (config.shape === 'circle') {
            // The second divider is invariant under a half turn about the origin.
            // That rotation exchanges its two regions, proving equal area without integration.
            return {data: {
                whole: {shape: 'circle', radius: 1},
                boundaries: [
                    {kind: 'segment', start: {x: 0, y: -1}, end: {x: 0, y: 1}},
                    {kind: 'cubic', start: {x: 0, y: -1}, segments: [
                        {control1: {x: -14 / 25, y: -53 / 75}, control2: {x: -14 / 25, y: -22 / 75}, end: {x: 0, y: 0}},
                        {control1: {x: 14 / 25, y: 22 / 75}, control2: {x: 14 / 25, y: 53 / 75}, end: {x: 0, y: 1}}
                    ]}
                ]
            }};
        }
        return null;
    }
}
