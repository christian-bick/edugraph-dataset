import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {
    ShapeCategoryHierarchyProblem,
    ShapeHierarchyClassificationCases,
    ShapeHierarchyVertex
} from '../../../types/problems.ts';
import {ShapeCategoryHierarchyGenerator} from './generator.ts';

const expectedAttributes = {
    quadrilateral: ['four-straight-sides'],
    rectangle: ['four-straight-sides', 'four-right-angles'],
    rhombus: ['four-straight-sides', 'four-equal-sides'],
    square: ['four-straight-sides', 'four-right-angles', 'four-equal-sides']
};

const expectedInclusions = [
    {narrower: 'rectangle', broader: 'quadrilateral'},
    {narrower: 'rhombus', broader: 'quadrilateral'},
    {narrower: 'square', broader: 'rectangle'},
    {narrower: 'square', broader: 'rhombus'}
];

function assertHierarchy(data: ShapeCategoryHierarchyProblem): void {
    expect(data.kind).toBe('shape-category-hierarchy');
    expect(data.categoryAttributes).toEqual(expectedAttributes);
    expect(data.directInclusions).toEqual(expectedInclusions);
    const {broader, narrower, property} = data.inheritance;
    expect(narrower).toBe('square');
    expect(data.directInclusions).toContainEqual({narrower, broader});
    expect(data.categoryAttributes[broader]).toContain(property);
    expect(data.categoryAttributes[narrower]).toContain(property);

    const parents = new Map<string, string[]>();
    for (const inclusion of data.directInclusions) {
        parents.set(inclusion.narrower, [...(parents.get(inclusion.narrower) ?? []), inclusion.broader]);
    }
    const ancestors = (
        node: string,
        path = new Set<string>(),
        result = new Set<string>()
    ): Set<string> => {
        for (const parent of parents.get(node) ?? []) {
            expect(path.has(parent)).toBe(false);
            result.add(parent);
            ancestors(parent, new Set([...path, parent]), result);
        }
        return result;
    };
    expect(ancestors('square')).toEqual(new Set(['rectangle', 'rhombus', 'quadrilateral']));
    expect(ancestors('rectangle')).toEqual(new Set(['quadrilateral']));
    expect(ancestors('rhombus')).toEqual(new Set(['quadrilateral']));
}

const subtract = (to: ShapeHierarchyVertex, from: ShapeHierarchyVertex) => ({
    x: to.x - from.x,
    y: to.y - from.y
});

function assertClassification(cases: ShapeHierarchyClassificationCases): void {
    expect(cases.map(item => item.kind)).toEqual([
        'other-quadrilateral', 'rectangle-only', 'rhombus-only', 'square'
    ]);
    for (const item of cases) {
        const vertices = item.vertices;
        expect(vertices).toHaveLength(4);
        expect(new Set(vertices.map(vertex => `${vertex.x},${vertex.y}`)).size).toBe(4);
        for (const vertex of vertices) {
            expect(Number.isSafeInteger(vertex.x)).toBe(true);
            expect(Number.isSafeInteger(vertex.y)).toBe(true);
            expect(vertex.x).toBeGreaterThanOrEqual(1);
            expect(vertex.x).toBeLessThanOrEqual(11);
            expect(vertex.y).toBeGreaterThanOrEqual(1);
            expect(vertex.y).toBeLessThanOrEqual(11);
        }
        const sideSquares = vertices.map((vertex, index) => {
            const edge = subtract(vertices[(index + 1) % 4]!, vertex);
            return edge.x * edge.x + edge.y * edge.y;
        });
        expect(sideSquares.every(length => length > 0)).toBe(true);
        const rightAngles = vertices.filter((vertex, index) => {
            const previous = subtract(vertices[(index + 3) % 4]!, vertex);
            const next = subtract(vertices[(index + 1) % 4]!, vertex);
            return previous.x * next.x + previous.y * next.y === 0;
        }).length;
        expect(rightAngles).toBe(item.rightAngleCount);
        const allSidesEqual = sideSquares.every(length => length === sideSquares[0]);
        expect(allSidesEqual).toBe(item.allSidesEqual);

        const turns = vertices.map((vertex, index) => {
            const first = subtract(vertices[(index + 1) % 4]!, vertex);
            const second = subtract(vertices[(index + 2) % 4]!, vertices[(index + 1) % 4]!);
            return first.x * second.y - first.y * second.x;
        });
        expect(turns.every(turn => turn > 0) || turns.every(turn => turn < 0)).toBe(true);

        const expectedMemberships = [
            ...(rightAngles === 4 && allSidesEqual ? ['square'] : []),
            ...(rightAngles === 4 ? ['rectangle'] : []),
            ...(allSidesEqual ? ['rhombus'] : []),
            'quadrilateral'
        ];
        expect(item.memberships).toEqual(expectedMemberships);
    }
}

describe('ShapeCategoryHierarchyGenerator', () => {
    const generator = new ShapeCategoryHierarchyGenerator();

    it('keeps the diamond and true inheritance witness in both mathematical profiles', () => {
        const witnesses = new Set<string>();
        for (let seed = 0; seed < 120; seed++) {
            setSeed(`shape-hierarchy-${seed}`);
            const inheritance = generator.generate({classificationModel: 'inheritance'}).data;
            assertHierarchy(inheritance);
            expect(inheritance).not.toHaveProperty('classificationCases');
            witnesses.add(inheritance.inheritance.property);

            setSeed(`shape-hierarchy-${seed}`);
            const classification = generator.generate({classificationModel: 'classification'}).data;
            assertHierarchy(classification);
            expect(classification.inheritance).toEqual(inheritance.inheritance);
            assertClassification(classification.classificationCases!);

            setSeed(`shape-hierarchy-${seed}`);
            expect(generator.generate({classificationModel: 'classification'}).data).toEqual(classification);
        }
        expect(witnesses).toEqual(new Set(['four-right-angles', 'four-equal-sides']));
    });

    it('varies exact classified figures across seeds', () => {
        const rectangleShapes = new Set<string>();
        const rhombusShapes = new Set<string>();
        for (let seed = 0; seed < 80; seed++) {
            setSeed(`shape-figures-${seed}`);
            const [_, rectangle, rhombus] = generator.generate({classificationModel: 'classification'})
                .data.classificationCases!;
            rectangleShapes.add(JSON.stringify(rectangle.vertices));
            rhombusShapes.add(JSON.stringify(rhombus.vertices));
        }
        expect(rectangleShapes.size).toBeGreaterThanOrEqual(30);
        expect(rhombusShapes.size).toBeGreaterThanOrEqual(30);
    });

    it('rejects missing or unsupported mathematical profiles', () => {
        expect(() => generator.generate({} as never)).toThrow('Required field "classificationModel" is missing.');
        expect(() => generator.generate({classificationModel: 'other'} as never)).toThrow('Unsupported classification model');
        expect(() => generator.generate(null as never)).toThrow('Configuration object is missing or null.');
    });
});
