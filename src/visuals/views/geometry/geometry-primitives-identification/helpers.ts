import {
    GeometryPrimitiveCandidate,
    GeometryPrimitiveCandidateId,
    GeometryPrimitivesProblem
} from '../../../../types/problems.ts';
import {
    primitiveIdentificationCandidates,
    PrimitiveViewDescriptor,
    PRIMITIVE_VIEW_DESCRIPTORS
} from '../primitive-contract.ts';

export type GeometryPrimitivesIdentificationPresentation = PrimitiveViewDescriptor & {
    candidates: [
        GeometryPrimitiveCandidate,
        GeometryPrimitiveCandidate,
        GeometryPrimitiveCandidate,
        GeometryPrimitiveCandidate
    ];
    correctCandidateId: GeometryPrimitiveCandidateId;
    answer: string;
    answerStatement: string;
    explanation: string;
};

export const buildGeometryPrimitivesIdentificationPresentation = (
    data: GeometryPrimitivesProblem,
    seed: number
): GeometryPrimitivesIdentificationPresentation | null => {
    const descriptor = PRIMITIVE_VIEW_DESCRIPTORS[data.primitiveKind];
    if (!descriptor || !Number.isSafeInteger(seed)) return null;
    const {candidates, correctCandidateId} = primitiveIdentificationCandidates(data.primitiveKind, seed);
    const answer = `Diagram ${correctCandidateId}: ${descriptor.displayName}`;
    const answerStatement = `Diagram ${correctCandidateId} shows ${descriptor.indefiniteName}.`;
    return {
        ...descriptor,
        candidates,
        correctCandidateId,
        answer,
        answerStatement,
        explanation: `${answerStatement} ${descriptor.definition}`
    };
};
