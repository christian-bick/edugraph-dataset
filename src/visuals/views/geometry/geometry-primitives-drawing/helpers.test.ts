import {describe, expect, it} from 'vitest';
import {GeometryPrimitivesGenerator} from '../../../../generators/geometry/geometry-primitives/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {GeometryPrimitiveKind, GeometryPrimitivesProblem} from '../../../../types/problems.ts';
import {GEOMETRY_PRIMITIVE_LABELS} from '../../../../generators/geometry/geometry-primitives/spec.ts';
import {isValidGeometryPrimitivesDrawingProblem} from './helpers.ts';

const generateAll = (): GeometryPrimitivesProblem[] => {
    const generator = new GeometryPrimitivesGenerator();
    return GEOMETRY_PRIMITIVE_LABELS.map((primitive, index) => {
        setSeed(8100 + index);
        return generator.generate({primitive})!.data;
    });
};

const byKind = (
    problems: GeometryPrimitivesProblem[],
    kind: GeometryPrimitiveKind
): GeometryPrimitivesProblem => problems.find(problem => problem.primitiveKind === kind)!;

describe('geometry primitives drawing validation', () => {
    it('accepts every generator-supplied primitive with the matching line-drawing configuration', () => {
        for (const problem of generateAll()) {
            expect(isValidGeometryPrimitivesDrawingProblem(
                problem,
                problem.primitiveKind !== 'point'
            )).toBe(true);
        }
    });

    it('rejects mismatched configuration, answer prose, and completed geometry leaked into a guide', () => {
        const problems = generateAll();
        const point = byKind(problems, 'point');
        const line = byKind(problems, 'line');
        expect(isValidGeometryPrimitivesDrawingProblem(point, true)).toBe(false);
        expect(isValidGeometryPrimitivesDrawingProblem({
            ...line,
            drawing: {...line.drawing, answerStatement: 'The completed construction shows a ray.'}
        }, true)).toBe(false);
        expect(isValidGeometryPrimitivesDrawingProblem({
            ...line,
            drawing: {...line.drawing, guideScene: line.drawing.solutionScene}
        }, true)).toBe(false);
    });

    it('rejects a parallel solution whose added line misses P', () => {
        const parallel = byKind(generateAll(), 'parallel-lines');
        const [lower, upper] = parallel.drawing.solutionScene.strokes;
        const invalid: GeometryPrimitivesProblem = {
            ...parallel,
            drawing: {
                ...parallel.drawing,
                solutionScene: {
                    ...parallel.drawing.solutionScene,
                    strokes: [lower, {
                        ...upper,
                        start: {x: 10, y: 38},
                        end: {x: 90, y: 28}
                    }]
                }
            }
        };
        expect(isValidGeometryPrimitivesDrawingProblem(invalid, true)).toBe(false);
    });
});
