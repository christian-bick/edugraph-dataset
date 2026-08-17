import {describe, expect, it} from 'vitest';
import {GeometryPrimitivesGenerator} from '../../../../generators/geometry/geometry-primitives/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {GeometryPrimitiveKind, GeometryPrimitivesProblem} from '../../../../types/problems.ts';
import {GEOMETRY_PRIMITIVE_LABELS} from '../../../../generators/geometry/geometry-primitives/spec.ts';
import {isValidGeometryPrimitivesIdentificationProblem} from './helpers.ts';

const generateAll = (): GeometryPrimitivesProblem[] => {
    const generator = new GeometryPrimitivesGenerator();
    return GEOMETRY_PRIMITIVE_LABELS.map((primitive, index) => {
        setSeed(9200 + index);
        return generator.generate({primitive})!.data;
    });
};

const byKind = (
    problems: GeometryPrimitivesProblem[],
    kind: GeometryPrimitiveKind
): GeometryPrimitivesProblem => problems.find(problem => problem.primitiveKind === kind)!;

describe('geometry primitives identification validation', () => {
    it('accepts every target across deterministic candidate orders', () => {
        for (const problem of generateAll()) {
            expect(isValidGeometryPrimitivesIdentificationProblem(problem)).toBe(true);
        }
    });

    it('rejects ambiguous legacy prompts and a mismatched selected answer', () => {
        const problems = generateAll();
        const point = byKind(problems, 'point');
        const line = byKind(problems, 'line');
        expect(isValidGeometryPrimitivesIdentificationProblem({
            ...point,
            identification: {...point.identification, prompt: 'Which diagram shows a point?'}
        })).toBe(false);
        expect(isValidGeometryPrimitivesIdentificationProblem({
            ...line,
            identification: {
                ...line.identification,
                correctCandidateId: line.identification.correctCandidateId === 'A' ? 'B' : 'A'
            }
        })).toBe(false);
    });

    it('rejects duplicate candidate kinds and contradictory candidate geometry', () => {
        const acute = byKind(generateAll(), 'acute-angle');
        const candidates = [...acute.identification.candidates] as GeometryPrimitivesProblem['identification']['candidates'];
        candidates[1] = {...candidates[1], kind: candidates[0].kind};
        expect(isValidGeometryPrimitivesIdentificationProblem({
            ...acute,
            identification: {...acute.identification, candidates}
        })).toBe(false);

        const incorrectSceneCandidates = [...acute.identification.candidates] as GeometryPrimitivesProblem['identification']['candidates'];
        incorrectSceneCandidates[0] = {
            ...incorrectSceneCandidates[0],
            scene: {...incorrectSceneCandidates[0].scene, markers: []}
        };
        expect(isValidGeometryPrimitivesIdentificationProblem({
            ...acute,
            identification: {...acute.identification, candidates: incorrectSceneCandidates}
        })).toBe(false);
    });
});
