import {GeometryPrimitiveCandidateId, GeometryPrimitivesProblem} from '../../../../types/problems.ts';
import {PRIMITIVE_DISTRACTORS, PRIMITIVE_VIEW_DESCRIPTORS} from '../primitive-contract.ts';
import {isCompletedPrimitiveScene} from '../primitive-validation.ts';

const CANDIDATE_IDS: readonly GeometryPrimitiveCandidateId[] = ['A', 'B', 'C', 'D'];

export const isValidGeometryPrimitivesIdentificationProblem = (
    data: GeometryPrimitivesProblem
): boolean => {
    const descriptor = PRIMITIVE_VIEW_DESCRIPTORS[data.primitiveKind];
    if (!descriptor
        || !Array.isArray(data.identification.candidates)
        || data.identification.candidates.some(candidate => typeof candidate !== 'object' || candidate === null)) {
        return false;
    }
    const candidateIds = data.identification.candidates.map(candidate => candidate.id);
    const candidateKinds = data.identification.candidates.map(candidate => candidate.kind);
    const correctCandidate = data.identification.candidates.find(
        candidate => candidate.id === data.identification.correctCandidateId
    );
    const expectedKinds = new Set([data.primitiveKind, ...PRIMITIVE_DISTRACTORS[data.primitiveKind]]);
    const answer = `Diagram ${data.identification.correctCandidateId}: ${descriptor.displayName}`;
    const answerStatement = `Diagram ${data.identification.correctCandidateId} shows ${descriptor.indefiniteName}.`;

    return data.displayName === descriptor.displayName
        && data.definition === descriptor.definition
        && data.identification.prompt === descriptor.identificationPrompt
        && candidateIds.length === CANDIDATE_IDS.length
        && candidateIds.every((id, index) => id === CANDIDATE_IDS[index])
        && new Set(candidateKinds).size === candidateKinds.length
        && candidateKinds.every(kind => expectedKinds.has(kind))
        && expectedKinds.size === candidateKinds.length
        && data.identification.candidates.every(candidate => isCompletedPrimitiveScene(candidate.kind, candidate.scene))
        && correctCandidate?.kind === data.primitiveKind
        && data.identification.answer === answer
        && data.identification.answerStatement === answerStatement
        && data.identification.explanation === `${answerStatement} ${descriptor.definition}`;
};
