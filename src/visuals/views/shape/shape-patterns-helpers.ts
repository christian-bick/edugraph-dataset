import {
    ShapePatternEvidence,
    ShapePatternProblem,
    ShapePatternTerm
} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const DEFAULT_VIEW_ID = 'shape-patterns';

function isNonEmptyText(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateTerm(viewId: string, term: ShapePatternTerm, expectedPosition: number) {
    if (
        term.position !== expectedPosition
        || !isNonEmptyText(term.caption)
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

function validateEvidence(viewId: string, evidence: ShapePatternEvidence[]) {
    if (!Array.isArray(evidence) || evidence.length === 0) {
        throw new ViewValidationError(viewId, 'Pattern evidence is missing.');
    }
    for (const item of evidence) {
        if (
            !isNonEmptyText(item.observation)
            || !Array.isArray(item.positions)
            || item.positions.length === 0
            || item.positions.some(position => !Number.isInteger(position) || position < 1 || position > 6)
        ) {
            throw new ViewValidationError(viewId, 'Pattern evidence contains an invalid observation.');
        }
    }
}

export function validateShapePattern(data: ShapePatternProblem, viewId = DEFAULT_VIEW_ID) {
    if (!['generate', 'identify', 'explain'].includes(data.task)) {
        throw new ViewValidationError(viewId, `Unsupported task: ${data.task}`);
    }
    if (!['growth-parity', 'rotation-axis'].includes(data.patternKind)) {
        throw new ViewValidationError(viewId, `Unsupported pattern kind: ${data.patternKind}`);
    }
    if (
        !isNonEmptyText(data.rule)
        || !isNonEmptyText(data.feature)
        || !isNonEmptyText(data.explanation)
        || !isNonEmptyText(data.prompt)
    ) {
        throw new ViewValidationError(viewId, 'Pattern text fields must be non-empty.');
    }
    if (!Array.isArray(data.sequence) || data.sequence.length !== 6 || data.givenTermCount !== 4) {
        throw new ViewValidationError(viewId, 'Expected six figures with the first four given.');
    }
    data.sequence.forEach((term, index) => validateTerm(viewId, term, index + 1));
    validateEvidence(viewId, data.evidence);

    if (data.patternKind === 'growth-parity') {
        for (const term of data.sequence) {
            if (
                term.tokens.length !== term.position
                || term.tokens.some(token => token.shape !== 'square' || token.orientation !== 0)
            ) {
                throw new ViewValidationError(viewId, 'Growth figures must supply one square per position count.');
            }
        }
    } else {
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

    if (data.task === 'generate') {
        if (
            data.responsePositions.length !== 2
            || data.responsePositions[0] !== 5
            || data.responsePositions[1] !== 6
        ) {
            throw new ViewValidationError(viewId, 'Generation must request figures 5 and 6.');
        }
    }
    if (data.task === 'identify') {
        if (
            data.featureOptions.length !== 3
            || new Set(data.featureOptions).size !== 3
            || data.featureOptions.some(option => !isNonEmptyText(option))
            || !data.featureOptions.includes(data.feature)
        ) {
            throw new ViewValidationError(viewId, 'Identification requires three distinct options including the supplied feature.');
        }
    }
}

export function isTermWithheld(
    data: ShapePatternProblem,
    position: number,
    isSolutionView: boolean
): boolean {
    return data.task === 'generate'
        && !isSolutionView
        && position > data.givenTermCount;
}

export function shouldRevealEvidence(data: ShapePatternProblem, isSolutionView: boolean): boolean {
    return isSolutionView && data.task !== 'generate';
}

export function shouldRevealExplanation(data: ShapePatternProblem, isSolutionView: boolean): boolean {
    return isSolutionView && data.task === 'explain';
}
