import type {
    ShapeCategoryHierarchyProblem,
    ShapeHierarchyCategory,
    ShapeHierarchyClassificationCases,
    ShapeHierarchyVertex
} from '../../../types/problems.ts';

export const hierarchyCategories = ['quadrilateral', 'rectangle', 'rhombus', 'square'] as const;
export const figureLetters = ['A', 'B', 'C', 'D'] as const;

const expectedAttributes = {
    quadrilateral: ['four-straight-sides'],
    rectangle: ['four-straight-sides', 'four-right-angles'],
    rhombus: ['four-straight-sides', 'four-equal-sides'],
    square: ['four-straight-sides', 'four-right-angles', 'four-equal-sides']
} as const;

const expectedInclusions = [
    ['rectangle', 'quadrilateral'],
    ['rhombus', 'quadrilateral'],
    ['square', 'rectangle'],
    ['square', 'rhombus']
] as const;

const expectedCaseKinds = ['other-quadrilateral', 'rectangle-only', 'rhombus-only', 'square'] as const;
const expectedMemberships = [
    ['quadrilateral'],
    ['rectangle', 'quadrilateral'],
    ['rhombus', 'quadrilateral'],
    ['square', 'rectangle', 'rhombus', 'quadrilateral']
] as const;

const exactList = (actual: readonly unknown[] | undefined, expected: readonly unknown[]): boolean =>
    Array.isArray(actual) && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);

const cross = (a: {x: number; y: number}, b: {x: number; y: number}): number =>
    a.x * b.y - a.y * b.x;
const dot = (a: {x: number; y: number}, b: {x: number; y: number}): number =>
    a.x * b.x + a.y * b.y;
const vector = (from: ShapeHierarchyVertex, to: ShapeHierarchyVertex): {x: number; y: number} =>
    ({x: to.x - from.x, y: to.y - from.y});

const orientation = (a: ShapeHierarchyVertex, b: ShapeHierarchyVertex, c: ShapeHierarchyVertex): number =>
    cross(vector(a, b), vector(a, c));

function segmentsIntersect(a: ShapeHierarchyVertex, b: ShapeHierarchyVertex,
    c: ShapeHierarchyVertex, d: ShapeHierarchyVertex): boolean {
    const first = orientation(a, b, c);
    const second = orientation(a, b, d);
    const third = orientation(c, d, a);
    const fourth = orientation(c, d, b);
    const onSegment = (p: ShapeHierarchyVertex, q: ShapeHierarchyVertex, r: ShapeHierarchyVertex): boolean =>
        q.x >= Math.min(p.x, r.x) && q.x <= Math.max(p.x, r.x)
        && q.y >= Math.min(p.y, r.y) && q.y <= Math.max(p.y, r.y);
    if ((first === 0 && onSegment(a, c, b))
        || (second === 0 && onSegment(a, d, b))
        || (third === 0 && onSegment(c, a, d))
        || (fourth === 0 && onSegment(c, b, d))) return true;
    return Math.sign(first) * Math.sign(second) < 0
        && Math.sign(third) * Math.sign(fourth) < 0;
}

function validFigureGeometry(vertices: readonly ShapeHierarchyVertex[], rightAngleCount: number, allSidesEqual: boolean): boolean {
    if (!Array.isArray(vertices) || vertices.length !== 4
        || !vertices.every(vertex => vertex && Number.isSafeInteger(vertex.x) && Number.isSafeInteger(vertex.y))) return false;
    if (new Set(vertices.map(vertex => `${vertex.x},${vertex.y}`)).size !== 4
        || segmentsIntersect(vertices[0]!, vertices[1]!, vertices[2]!, vertices[3]!)
        || segmentsIntersect(vertices[1]!, vertices[2]!, vertices[3]!, vertices[0]!)) return false;
    const edges = vertices.map((vertex, index) => vector(vertex, vertices[(index + 1) % 4]!));
    const lengths = edges.map(edge => edge.x ** 2 + edge.y ** 2);
    if (lengths.some(length => !Number.isSafeInteger(length) || length <= 0)) return false;
    const turns = edges.map((edge, index) => cross(edge, edges[(index + 1) % 4]!));
    if (turns.some(turn => turn === 0)) return false;
    const actualRightAngles = edges.filter((edge, index) => dot(edge, edges[(index + 1) % 4]!) === 0).length;
    return actualRightAngles === rightAngleCount
        && lengths.every(length => length === lengths[0]) === allSidesEqual;
}

function validCases(cases: ShapeHierarchyClassificationCases): boolean {
    if (!Array.isArray(cases) || cases.length !== 4) return false;
    return cases.every((figure, index) => figure
        && figure.kind === expectedCaseKinds[index]
        && figure.rightAngleCount === (index === 1 || index === 3 ? 4 : 0)
        && figure.allSidesEqual === (index === 2 || index === 3)
        && exactList(figure.memberships, expectedMemberships[index]!)
        && validFigureGeometry(figure.vertices, figure.rightAngleCount, figure.allSidesEqual));
}

/** Checks category truth, both square parents, and any supplied visible witnesses. */
export function isValidShapeHierarchy(data: ShapeCategoryHierarchyProblem): boolean {
    if (!data || data.kind !== 'shape-category-hierarchy'
        || !data.categoryAttributes || !Array.isArray(data.directInclusions)
        || data.directInclusions.length !== 4 || !data.inheritance) return false;
    if (!hierarchyCategories.every(category =>
        exactList(data.categoryAttributes[category], expectedAttributes[category]))) return false;
    if (!data.directInclusions.every((edge, index) => edge
        && edge.narrower === expectedInclusions[index]![0]
        && edge.broader === expectedInclusions[index]![1])) return false;
    const inherited = data.inheritance;
    if (inherited.narrower !== 'square'
        || !((inherited.broader === 'rectangle' && inherited.property === 'four-right-angles')
            || (inherited.broader === 'rhombus' && inherited.property === 'four-equal-sides'))) return false;
    return data.classificationCases === undefined || validCases(data.classificationCases);
}

export const propertyPhrase = (property: ShapeCategoryHierarchyProblem['inheritance']['property']): string =>
    property === 'four-right-angles' ? 'four right angles' : 'four equal sides';

export function figureMembers(cases: ShapeHierarchyClassificationCases, category: ShapeHierarchyCategory): string {
    return cases.flatMap((figure, index) =>
        (figure.memberships as readonly ShapeHierarchyCategory[]).includes(category) ? [figureLetters[index]] : []).join(', ');
}

/** Fit the canonical cyclic polygon in one gallery tile without altering its angles. */
export function figurePoints(vertices: readonly ShapeHierarchyVertex[]): string {
    const minX = Math.min(...vertices.map(vertex => vertex.x));
    const maxX = Math.max(...vertices.map(vertex => vertex.x));
    const minY = Math.min(...vertices.map(vertex => vertex.y));
    const maxY = Math.max(...vertices.map(vertex => vertex.y));
    const scale = 64 / Math.max(maxX - minX, maxY - minY);
    const xPad = (96 - (maxX - minX) * scale) / 2;
    const yPad = (96 - (maxY - minY) * scale) / 2;
    return vertices.map(vertex => `${xPad + (vertex.x - minX) * scale},${yPad + (vertex.y - minY) * scale}`).join(' ');
}
