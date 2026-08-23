import {
    ShapePatternProblem,
    ShapePatternTerm
} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const DEFAULT_VIEW_ID = 'shape-patterns';
const GIVEN_TERM_COUNT = 4;

export type ShapePatternTask = 'generate' | 'identify' | 'explain';

export type ShapePatternPresentation = {
    rule: string;
    sequence: Array<ShapePatternTerm & {caption: string}>;
    givenTermCount: 4;
    feature: string;
    evidence: Array<{positions: number[]; observation: string}>;
    explanation: string;
    prompt: string;
    featureOptions: [string, string, string];
};

function validateTerm(viewId: string, term: ShapePatternTerm, expectedPosition: number) {
    if (
        term.position !== expectedPosition
        || !Array.isArray(term.tokens)
        || term.tokens.length === 0
    ) {
        throw new ViewValidationError(viewId, `Invalid figure at position ${expectedPosition}.`);
    }

    for (const token of term.tokens) {
        if (
            !['square', 'triangle'].includes(token.shape)
            || ![0, 90, 180, 270].includes(token.orientation)
        ) {
            throw new ViewValidationError(viewId, `Invalid geometry token at position ${expectedPosition}.`);
        }
    }
}

export function validateShapePattern(data: ShapePatternProblem, viewId = DEFAULT_VIEW_ID) {
    if (!['growth-parity', 'rotation-axis'].includes(data.patternKind)) {
        throw new ViewValidationError(viewId, `Unsupported pattern kind: ${data.patternKind}`);
    }
    if (!Array.isArray(data.sequence) || data.sequence.length !== 6) {
        throw new ViewValidationError(viewId, 'Expected a complete six-term pattern witness.');
    }
    data.sequence.forEach((term, index) => validateTerm(viewId, term, index + 1));

    if (data.patternKind === 'growth-parity') {
        if (
            data.recurrence?.kind !== 'add-square'
            || data.recurrence.initialSquareCount !== 1
            || data.recurrence.squareCountIncrease !== 1
            || data.emergentFeature?.kind !== 'position-count-parity'
        ) {
            throw new ViewValidationError(viewId, 'Growth recurrence and emergent feature must agree.');
        }
        for (const term of data.sequence) {
            if (
                term.tokens.length !== term.position
                || term.tokens.some(token => token.shape !== 'square' || token.orientation !== 0)
            ) {
                throw new ViewValidationError(viewId, 'Growth figures must supply one square per position count.');
            }
        }
        return;
    }

    if (
        data.recurrence?.kind !== 'quarter-turn-clockwise'
        || data.recurrence.initialOrientation !== 0
        || data.recurrence.quarterTurnsPerTerm !== 1
        || data.emergentFeature?.kind !== 'position-axis-parity'
    ) {
        throw new ViewValidationError(viewId, 'Rotation recurrence and emergent feature must agree.');
    }
    const expectedOrientations = [0, 90, 180, 270, 0, 90];
    data.sequence.forEach((term, index) => {
        if (
            term.tokens.length !== 1
            || term.tokens[0].shape !== 'triangle'
            || term.tokens[0].orientation !== expectedOrientations[index]
        ) {
            throw new ViewValidationError(viewId, 'Rotation figures must supply the complete quarter-turn triangle sequence.');
        }
    });
}

function shuffled<T>(values: readonly T[], seed: number): T[] {
    const result = [...values];
    let state = (seed ^ 0x9E3779B9) >>> 0;
    for (let index = result.length - 1; index > 0; index--) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        const swapIndex = state % (index + 1);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

const DIRECTION_NAMES = {
    0: 'up',
    90: 'right',
    180: 'down',
    270: 'left'
} as const;

export function buildShapePatternPresentation(
    data: ShapePatternProblem,
    task: ShapePatternTask,
    seed: number,
    viewId = DEFAULT_VIEW_ID
): ShapePatternPresentation {
    validateShapePattern(data, viewId);
    if (!Number.isSafeInteger(seed)) {
        throw new ViewValidationError(viewId, 'Render seed must be a safe integer.');
    }

    const growth = data.patternKind === 'growth-parity';
    const rule = growth
        ? 'Start with 1 square. Add 1 square to make each new figure.'
        : 'Start with an upward-pointing triangle. Turn it one quarter-turn clockwise to make each new term.';
    const feature = growth
        ? 'Odd-positioned figures contain an odd number of squares, and even-positioned figures contain an even number.'
        : 'Triangles in odd positions point vertically, and triangles in even positions point horizontally.';
    const sequence = data.sequence.map(term => ({
        ...term,
        caption: growth
            ? `${term.tokens.length} ${term.tokens.length === 1 ? 'square' : 'squares'}`
            : `Triangle points ${DIRECTION_NAMES[term.tokens[0].orientation]}`
    }));
    const evidence = growth
        ? [
            {positions: [1, 3, 5], observation: 'The square counts are 1, 3, and 5.'},
            {positions: [2, 4, 6], observation: 'The square counts are 2, 4, and 6.'}
        ]
        : [
            {positions: [1, 3, 5], observation: 'The triangles point up, down, and up.'},
            {positions: [2, 4, 6], observation: 'The triangles point right, left, and right.'}
        ];
    const explanation = growth
        ? 'The pattern starts with 1 square and adds 1 each time. Adding 1 switches odd to even and even to odd, so the square-count parity continues to match the position parity.'
        : 'Each quarter-turn switches the triangle between a vertical and a horizontal direction. Because the first triangle is vertical, odd positions stay vertical and even positions stay horizontal.';
    const distractors = growth
        ? [
            'Every figure contains an even number of squares.',
            'The number of squares stays the same from one figure to the next.'
        ]
        : [
            'Triangles in odd positions point horizontally, and triangles in even positions point vertically.',
            'Every triangle points in the same direction.'
        ];

    return {
        rule,
        sequence,
        givenTermCount: GIVEN_TERM_COUNT,
        feature,
        evidence,
        explanation,
        prompt: task === 'generate'
            ? 'Use the rule to build figures 5 and 6.'
            : task === 'identify'
                ? 'Which feature is true even though the rule does not state it directly?'
                : `Explain why this feature continues: ${feature}`,
        featureOptions: shuffled([feature, ...distractors], seed) as [string, string, string]
    };
}

export function isTermWithheld(
    task: ShapePatternTask,
    position: number,
    isSolutionView: boolean
): boolean {
    return task === 'generate' && !isSolutionView && position > GIVEN_TERM_COUNT;
}

export function shouldRevealEvidence(task: ShapePatternTask, isSolutionView: boolean): boolean {
    return isSolutionView && task !== 'generate';
}

export function shouldRevealExplanation(task: ShapePatternTask, isSolutionView: boolean): boolean {
    return isSolutionView && task === 'explain';
}
