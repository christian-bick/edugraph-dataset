import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapePatternProblem, ShapePatternTerm} from '../../../types/problems.ts';
import {ShapePatternsGeneratorConfig, ShapePatternsGeneratorSchema} from './spec.ts';

type PatternContent = Pick<
    ShapePatternProblem,
    'patternKind' | 'rule' | 'sequence' | 'givenTermCount' | 'feature' | 'evidence' | 'explanation'
>;

const GENERATOR_ID = 'shape-patterns';
const SEQUENCE_LENGTH = 6;

function createGrowthParityPattern(): PatternContent {
    const sequence: ShapePatternTerm[] = Array.from({length: SEQUENCE_LENGTH}, (_, index) => {
        const position = index + 1;
        return {
            position,
            tokens: Array.from({length: position}, () => ({
                shape: 'square' as const,
                orientation: 0 as const
            })),
            caption: `${position} ${position === 1 ? 'square' : 'squares'}`
        };
    });

    return {
        patternKind: 'growth-parity',
        rule: 'Start with 1 square. Add 1 square to make each new figure.',
        sequence,
        givenTermCount: 4,
        feature: 'Odd-positioned figures contain an odd number of squares, and even-positioned figures contain an even number.',
        evidence: [
            {positions: [1, 3, 5], observation: 'The square counts are 1, 3, and 5.'},
            {positions: [2, 4, 6], observation: 'The square counts are 2, 4, and 6.'}
        ],
        explanation: 'The pattern starts with 1 square and adds 1 each time. Adding 1 switches odd to even and even to odd, so the square-count parity continues to match the position parity.'
    };
}

function createRotationAxisPattern(): PatternContent {
    const orientations = [0, 90, 180, 270, 0, 90] as const;
    const directionNames = ['up', 'right', 'down', 'left', 'up', 'right'] as const;
    const sequence: ShapePatternTerm[] = orientations.map((orientation, index) => ({
        position: index + 1,
        tokens: [{shape: 'triangle', orientation}],
        caption: `Triangle points ${directionNames[index]}`
    }));

    return {
        patternKind: 'rotation-axis',
        rule: 'Start with an upward-pointing triangle. Turn it one quarter-turn clockwise to make each new term.',
        sequence,
        givenTermCount: 4,
        feature: 'Triangles in odd positions point vertically, and triangles in even positions point horizontally.',
        evidence: [
            {positions: [1, 3, 5], observation: 'The triangles point up, down, and up.'},
            {positions: [2, 4, 6], observation: 'The triangles point right, left, and right.'}
        ],
        explanation: 'Each quarter-turn switches the triangle between a vertical and a horizontal direction. Because the first triangle is vertical, odd positions stay vertical and even positions stay horizontal.'
    };
}

function shuffleOptions(options: [string, string, string]): [string, string, string] {
    const shuffled: [string, string, string] = [...options];
    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}

function createFeatureOptions(content: PatternContent): [string, string, string] {
    const distractors = content.patternKind === 'growth-parity'
        ? [
            'Every figure contains an even number of squares.',
            'The number of squares stays the same from one figure to the next.'
        ] as const
        : [
            'Triangles in odd positions point horizontally, and triangles in even positions point vertically.',
            'Every triangle points in the same direction.'
        ] as const;
    return shuffleOptions([content.feature, ...distractors]);
}

function resolveTask(config: ShapePatternsGeneratorConfig): ShapePatternProblem['task'] | null {
    if (
        config.articulateVisually
        && !config.classifyFeature
        && !config.understandProcedure
        && !config.articulateTextually
    ) return 'generate';

    if (
        !config.articulateVisually
        && config.classifyFeature
        && !config.understandProcedure
        && !config.articulateTextually
    ) return 'identify';

    if (
        !config.articulateVisually
        && !config.classifyFeature
        && config.understandProcedure
        && config.articulateTextually
    ) return 'explain';

    return null;
}

export class ShapePatternsGenerator implements ProblemGenerator<
    ShapePatternProblem,
    ShapePatternsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapePatternsGeneratorSchema;

    generate(config: ShapePatternsGeneratorConfig): ProblemStub<ShapePatternProblem> | null {
        validateConfigFields(GENERATOR_ID, config, [
            'articulateVisually',
            'classifyFeature',
            'understandProcedure',
            'articulateTextually'
        ]);
        if ([
            config.articulateVisually,
            config.classifyFeature,
            config.understandProcedure,
            config.articulateTextually
        ].some(value => typeof value !== 'boolean')) return null;

        const task = resolveTask(config);
        if (!task) return null;

        const content = random() < 0.5
            ? createGrowthParityPattern()
            : createRotationAxisPattern();

        if (task === 'generate') {
            return {
                data: {
                    ...content,
                    task,
                    prompt: 'Use the rule to build figures 5 and 6.',
                    responsePositions: [5, 6]
                }
            };
        }

        if (task === 'identify') {
            return {
                data: {
                    ...content,
                    task,
                    prompt: 'Which feature is true even though the rule does not state it directly?',
                    featureOptions: createFeatureOptions(content)
                }
            };
        }

        return {
            data: {
                ...content,
                task,
                prompt: `Explain why this feature continues: ${content.feature}`
            }
        };
    }
}
