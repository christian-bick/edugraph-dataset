import {GeometryPrimitiveScene, GeometryPrimitivesProblem} from '../../../../types/problems.ts';
import {
    primitiveGuideScene,
    completedPrimitiveScene,
    PrimitiveViewDescriptor,
    PRIMITIVE_VIEW_DESCRIPTORS
} from '../primitive-contract.ts';

export type GeometryPrimitivesDrawingPresentation = PrimitiveViewDescriptor & {
    guideScene: GeometryPrimitiveScene;
    solutionScene: GeometryPrimitiveScene;
};

export const buildGeometryPrimitivesDrawingPresentation = (
    data: GeometryPrimitivesProblem,
    usesLinearDrawing: boolean | undefined
): GeometryPrimitivesDrawingPresentation | null => {
    const descriptor = PRIMITIVE_VIEW_DESCRIPTORS[data.primitiveKind];
    if (!descriptor || usesLinearDrawing !== (data.primitiveKind !== 'point')) return null;
    return {
        ...descriptor,
        guideScene: primitiveGuideScene(data.primitiveKind),
        solutionScene: completedPrimitiveScene(data.primitiveKind)
    };
};
