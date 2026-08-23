import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapePatternProblem, ShapePatternTerm} from '../../../types/problems.ts';
import {ShapePatternsGeneratorConfig, ShapePatternsGeneratorSchema} from './spec.ts';

const GENERATOR_ID = 'shape-patterns';
const SEQUENCE_LENGTH = 6;

function createGrowthParityPattern(): ShapePatternProblem {
    const sequence: ShapePatternTerm[] = Array.from({length: SEQUENCE_LENGTH}, (_, index) => {
        const position = index + 1;
        return {
            position,
            tokens: Array.from({length: position}, () => ({
                shape: 'square' as const,
                orientation: 0 as const
            }))
        };
    });

    return {
        patternKind: 'growth-parity',
        recurrence: {
            kind: 'add-square',
            initialSquareCount: 1,
            squareCountIncrease: 1
        },
        sequence,
        emergentFeature: {kind: 'position-count-parity'}
    };
}

function createRotationAxisPattern(): ShapePatternProblem {
    const orientations = [0, 90, 180, 270, 0, 90] as const;
    return {
        patternKind: 'rotation-axis',
        recurrence: {
            kind: 'quarter-turn-clockwise',
            initialOrientation: 0,
            quarterTurnsPerTerm: 1
        },
        sequence: orientations.map((orientation, index) => ({
            position: index + 1,
            tokens: [{shape: 'triangle', orientation}]
        })),
        emergentFeature: {kind: 'position-axis-parity'}
    };
}

export class ShapePatternsGenerator implements ProblemGenerator<
    ShapePatternProblem,
    ShapePatternsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapePatternsGeneratorSchema;

    generate(config: ShapePatternsGeneratorConfig): ProblemStub<ShapePatternProblem> | null {
        validateConfigFields(GENERATOR_ID, config, [
            'generatesPattern',
            'recognizesEmergentFeature'
        ]);
        if ([config.generatesPattern, config.recognizesEmergentFeature].some(
            value => typeof value !== 'boolean'
        )) return null;
        if (!config.generatesPattern && !config.recognizesEmergentFeature) return null;

        return {
            data: random() < 0.5
                ? createGrowthParityPattern()
                : createRotationAxisPattern()
        };
    }
}
