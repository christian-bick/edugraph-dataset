import {GeometryPrimitivesProblem} from '../../../../types/problems.ts';
import {PRIMITIVE_VIEW_DESCRIPTORS} from '../primitive-contract.ts';
import {isCompletedPrimitiveScene, isValidPrimitiveGuide} from '../primitive-validation.ts';

export const isValidGeometryPrimitivesDrawingProblem = (
    data: GeometryPrimitivesProblem,
    usesLinearDrawing: boolean | undefined
): boolean => {
    const descriptor = PRIMITIVE_VIEW_DESCRIPTORS[data.primitiveKind];
    return descriptor !== undefined
        && usesLinearDrawing === (data.primitiveKind !== 'point')
        && data.displayName === descriptor.displayName
        && data.definition === descriptor.definition
        && data.drawing.prompt === descriptor.drawingPrompt
        && data.drawing.answer === descriptor.drawingAnswer
        && data.drawing.answerStatement === descriptor.drawingAnswerStatement
        && data.drawing.explanation === descriptor.drawingExplanation
        && isValidPrimitiveGuide(data.primitiveKind, data.drawing.guideScene)
        && isCompletedPrimitiveScene(data.primitiveKind, data.drawing.solutionScene);
};
