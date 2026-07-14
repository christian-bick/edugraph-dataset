import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";

export class GeometryGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'geometry';
    compatibleRenderers = ['geometry-viewer'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;
        const mode = constraints.mode || 'name-2d';

        if (mode === 'position') {
            const relation = constraints.relation || 'above'; // above, below, beside, nextTo
            const answer = relation; // The correct relation is the target
            return {
                id: `geometry-position-${relation}`,
                data: {
                    mode,
                    relation,
                    answer
                }
            };
        }

        if (mode === 'env-shapes') {
            const target = constraints.target || 'clock'; // clock, window, table
            const shapesMap: Record<string, string> = {
                clock: 'circle',
                window: 'square',
                table: 'rectangle'
            };
            const answer = shapesMap[target];
            return {
                id: `geometry-env-shapes-${target}`,
                data: {
                    mode,
                    target,
                    answer
                }
            };
        }

        if (mode === 'name-2d') {
            const shape = constraints.shape || 'triangle'; // square, circle, triangle, rectangle, hexagon
            const rotation = constraints.rotation !== undefined ? constraints.rotation : Math.floor(random() * 360);
            const scale = constraints.scale !== undefined ? constraints.scale : parseFloat((random() * 1.0 + 0.5).toFixed(1)); // 0.5 to 1.5
            return {
                id: `geometry-name-2d-${shape}-${rotation}-${scale}`.replace('.', '-'),
                data: {
                    mode,
                    shape,
                    rotation,
                    scale,
                    answer: shape
                }
            };
        }

        if (mode === 'name-3d') {
            const shape = constraints.shape || 'cube'; // cube, cone, cylinder, sphere
            const rotation = constraints.rotation !== undefined ? constraints.rotation : Math.floor(random() * 360);
            const scale = constraints.scale !== undefined ? constraints.scale : parseFloat((random() * 1.0 + 0.5).toFixed(1));
            return {
                id: `geometry-name-3d-${shape}-${rotation}-${scale}`.replace('.', '-'),
                data: {
                    mode,
                    shape,
                    rotation,
                    scale,
                    answer: shape
                }
            };
        }

        if (mode === 'classify-dim') {
            const shapeType = constraints.shapeType || '2d'; // 2d, 3d
            const shapes2D = ['circle', 'square', 'triangle', 'rectangle', 'hexagon'];
            const shapes3D = ['cube', 'cone', 'cylinder', 'sphere'];
            const list = shapeType === '2d' ? shapes2D : shapes3D;
            const shape = list[Math.floor(random() * list.length)];
            const answer = shapeType === '2d' ? 'Flat (2D)' : 'Solid (3D)';
            return {
                id: `geometry-classify-dim-${shapeType}-${shape}`,
                data: {
                    mode,
                    shapeType,
                    shape,
                    answer
                }
            };
        }

        if (mode === 'compare-attributes') {
            const attribute = constraints.attribute || 'sides'; // sides, corners
            const shape1 = constraints.shape1 || 'rectangle';
            const shape2 = constraints.shape2 || 'triangle';
            
            // Attributes counts
            const attrs: Record<string, Record<string, number>> = {
                rectangle: { sides: 4, corners: 4 },
                triangle: { sides: 3, corners: 3 },
                square: { sides: 4, corners: 4 },
                hexagon: { sides: 6, corners: 6 }
            };

            const val1 = attrs[shape1]?.[attribute] || 4;
            const val2 = attrs[shape2]?.[attribute] || 3;
            const answer = val1 > val2 ? shape1 : shape2;

            return {
                id: `geometry-compare-attr-${attribute}-${shape1}-${shape2}`,
                data: {
                    mode,
                    attribute,
                    shape1,
                    shape2,
                    val1,
                    val2,
                    answer
                }
            };
        }

        if (mode === 'same-attribute') {
            const attribute = constraints.attribute || 'can-roll'; // can-roll, can-stack, flat-faces
            // Options: Sphere, Cube, Cone
            // Sphere: can roll, cannot stack, no flat faces
            // Cube: cannot roll, can stack, has flat faces
            // Cone: can roll, can stack (on base), has flat face
            let answer = '';
            if (attribute === 'can-roll') answer = 'sphere'; // sphere rolls easily
            else if (attribute === 'can-stack') answer = 'cube'; // cube is stackable
            else if (attribute === 'flat-faces') answer = 'cube'; // or cone. Let's make the question "Which of these shapes has no flat faces?" -> answer: sphere.
            
            return {
                id: `geometry-same-attr-${attribute}`,
                data: {
                    mode,
                    attribute,
                    answer: attribute === 'flat-faces' ? 'sphere' : answer // if 'flat-faces' -> "no flat faces" -> answer is sphere
                }
            };
        }

        if (mode === 'build-shape') {
            const target = constraints.target || 'triangle'; // triangle, square, rectangle
            const sidesMap: Record<string, number> = { triangle: 3, square: 4, rectangle: 4 };
            const cornersMap: Record<string, number> = { triangle: 3, square: 4, rectangle: 4 };
            const sides = sidesMap[target];
            const corners = cornersMap[target];
            return {
                id: `geometry-build-${target}`,
                data: {
                    mode,
                    target,
                    sides,
                    corners,
                    answer: `${sides} sticks, ${corners} balls`
                }
            };
        }

        if (mode === 'draw-shape') {
            const target = constraints.target || 'circle'; // circle, triangle, square
            return {
                id: `geometry-draw-${target}`,
                data: {
                    mode,
                    target,
                    answer: target
                }
            };
        }

        if (mode === 'compose-shapes') {
            const target = constraints.target || 'rectangle'; // rectangle, square
            const components = constraints.components || ['triangles']; // triangles, rectangles
            const answer = 'Two triangles';
            return {
                id: `geometry-compose-${target}`,
                data: {
                    mode,
                    target,
                    components,
                    answer
                }
            };
        }

        return null;
    }
}
