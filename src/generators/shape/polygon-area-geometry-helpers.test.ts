import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicScalar, PolygonAreaBoundary, PolygonAreaIsometry, PolygonAreaPoint} from '../../types/problems.ts';
import {buildPolygonAreaCuts as cuts, buildPolygonAreaShapeFacts as facts, exactPolygonArea as area,
    isExactTrianglePartition as partition, isPolygonAreaIsometry as isometry, isPolygonAreaSegmentLength as lengthMatches, polygonAreaSquaredDistance as distance,
    projectPolygonAreaHeight as project, transformPolygonAreaPoint as transform, type PolygonAreaCellBoundary as Cell} from './polygon-area-geometry-helpers.ts';

const q = (numerator: number, denominator = 1): AlgebraicScalar => {
    let a = Math.abs(numerator), b = denominator;
    while (b) [a, b] = [b, a % b];
    return {numerator: numerator / a, denominator: denominator / a};
};
const p = (id: string, x: number, y: number): PolygonAreaPoint => ({id, x: q(x), y: q(y)});
type Fixture = {name: string; points: PolygonAreaPoint[]; boundary: PolygonAreaBoundary; cells: Cell[]; twiceArea: number};
function fixture(name: string, points: readonly (readonly [number, number])[], boundary: readonly number[], triangles: readonly (readonly [number, number, number])[], twiceArea: number): Fixture {
    return {name, points: points.map(([x, y], index) => p(`p${index}`, x, y)),
        boundary: boundary.map(index => `p${index}`) as unknown as PolygonAreaBoundary,
        cells: triangles.map((vertices, index) => ({cellId: `cell${index}`, vertices: vertices.map(point => `p${point}`) as unknown as Cell['vertices']})), twiceArea};
}
const right = fixture('right', [[0, 0], [4, 0], [0, 3], [2, 0]], [0, 1, 2], [[0, 3, 2], [3, 1, 2]], 12);
const acute = fixture('acute', [[0, 0], [6, 0], [3, 4], [3, 0]], [0, 1, 2], [[0, 3, 2], [3, 1, 2]], 24);
const obtuse = fixture('obtuse', [[0, 0], [6, 0], [3, 1], [3, 0]], [0, 1, 2], [[0, 3, 2], [3, 1, 2]], 6);
const parallelogram = fixture('parallelogram', [[0, 0], [4, 0], [5, 2], [1, 2], [1, 0]], [0, 1, 2, 3], [[0, 4, 3], [4, 1, 2], [4, 2, 3]], 16);
const rhombus = fixture('rhombus', [[-3, 0], [0, -2], [3, 0], [0, 2], [0, 0]], [0, 1, 2, 3], [[4, 0, 1], [4, 1, 2], [4, 2, 3], [4, 3, 0]], 24);
const kite = fixture('kite', [[-2, 0], [0, -1], [2, 0], [0, 3], [0, 0]], [0, 1, 2, 3], [[4, 0, 1], [4, 1, 2], [4, 2, 3], [4, 3, 0]], 16);
const trapezoid = fixture('trapezoid', [[0, 0], [6, 0], [4, 3], [1, 3], [1, 0], [4, 0]], [0, 1, 2, 3], [[0, 4, 3], [4, 5, 2], [4, 2, 3], [5, 1, 2]], 27);
const convex = fixture('convex', [[0, 0], [4, 0], [5, 2], [2, 5], [0, 3], [2, 0], [4, 3]], [0, 1, 2, 3, 4], [[0, 5, 3], [0, 3, 4], [5, 1, 6], [5, 6, 3], [1, 2, 6]], 35);
const star = fixture('star', [[-4, 0], [-1, -1], [0, -4], [1, -1], [4, 0], [1, 1], [0, 4], [-1, 1], [0, 0]], [0, 1, 2, 3, 4, 5, 6, 7], Array.from({length: 8}, (_, index) => [8, index, (index + 1) % 8] as const), 32);
const u = fixture('non-star oblique U', [[0, 0], [6, 0], [6, 5], [4, 5], [4, 2], [2, 2], [2, 5], [0, 4], [2, 0], [4, 0]], [0, 1, 2, 3, 4, 5, 6, 7], [[0, 8, 6], [0, 6, 7], [8, 9, 4], [8, 4, 5], [9, 1, 2], [9, 2, 3]], 46);
const all = [right, acute, obtuse, parallelogram, rhombus, kite, trapezoid, convex, star, u];
const boundaryPoints = (data: Fixture) => data.boundary.map(id => data.points.find(point => point.id === id)!);
const cellPoints = (data: Fixture, cell: Cell) => cell.vertices.map(id => data.points.find(point => point.id === id)!);
const coordinateKey = (point: PolygonAreaPoint) => `${point.x.numerator}/${point.x.denominator},${point.y.numerator}/${point.y.denominator}`;
const segmentKey = (a: PolygonAreaPoint, b: PolygonAreaPoint) => [coordinateKey(a), coordinateKey(b)].sort().join('|');
/** Integer-only independent shoelace; this oracle never calls production geometry/arithmetic. */
function integerTwiceArea(points: readonly PolygonAreaPoint[]): bigint {
    const result = points.reduce((sum, first, index) => {
        const second = points[(index + 1) % points.length]!;
        return sum + BigInt(first.x.numerator) * BigInt(second.y.numerator) - BigInt(first.y.numerator) * BigInt(second.x.numerator);
    }, 0n);
    return result < 0n ? -result : result;
}
const identity: PolygonAreaIsometry = {matrix: [[q(1), q(0)], [q(0), q(1)]], translation: {x: q(0), y: q(0)}};

describe('exact Euclidean polygon facts and altitude projections', () => {
    it('matches independent literal shoelace and every positive partition across all eight families and three general variants', () => {
        for (const data of all) {
            expect(integerTwiceArea(boundaryPoints(data)), data.name).toBe(BigInt(data.twiceArea));
            expect(data.cells.reduce((sum, cell) => sum + integerTwiceArea(cellPoints(data, cell)), 0n)).toBe(BigInt(data.twiceArea));
            expect(area(boundaryPoints(data))).toEqual(q(data.twiceArea, 2));
            expect(partition(data.points, data.boundary, data.cells), data.name).toBe(true);
            expect(area([...boundaryPoints(data)].reverse())).toEqual(q(data.twiceArea, 2));
        }
    });
    it('keeps exact rational uniform scaling, off-axis rotations and reversed cell/boundary orders', () => {
        const rotation: PolygonAreaIsometry = {matrix: [[q(3, 5), q(-4, 5)], [q(4, 5), q(3, 5)]], translation: {x: q(1, 2), y: q(-2)}};
        for (const data of all) {
            const points = data.points.map(point => ({...transform({x: q(point.x.numerator, 2), y: q(point.y.numerator, 2)}, rotation), id: point.id}));
            expect(area(data.boundary.map(id => points.find(point => point.id === id)!))).toEqual(q(data.twiceArea, 8));
            expect(partition(points, [...data.boundary].reverse() as unknown as PolygonAreaBoundary,
                [...data.cells].reverse().map(cell => ({...cell, vertices: [...cell.vertices].reverse() as unknown as Cell['vertices']})))).toBe(true);
        }
    });
    it('proves triangle angle families, complete equal-length classes and opposite parallel side facts', () => {
        expect(facts(right.points, right.boundary).angles.map(angle => angle.kind)).toEqual(['right', 'acute', 'acute']);
        expect(facts(acute.points, acute.boundary).angles.every(angle => angle.kind === 'acute')).toBe(true);
        expect(facts(obtuse.points, obtuse.boundary).angles.map(angle => angle.kind)).toEqual(['acute', 'acute', 'obtuse']);
        const para = facts(parallelogram.points, parallelogram.boundary);
        expect(para.equalLengthEdgeGroups).toEqual([[0, 2], [1, 3]]);
        expect(para.parallelEdgePairs).toEqual([{firstEdgeIndex: 0, secondEdgeIndex: 2}, {firstEdgeIndex: 1, secondEdgeIndex: 3}]);
        expect(facts(rhombus.points, rhombus.boundary).equalLengthEdgeGroups).toEqual([[0, 1, 2, 3]]);
        expect(facts(kite.points, kite.boundary).equalLengthEdgeGroups).toEqual([[0, 1], [2, 3]]);
        expect(facts(trapezoid.points, trapezoid.boundary).parallelEdgePairs).toEqual([{firstEdgeIndex: 0, secondEdgeIndex: 2}]);
        expect(facts(star.points, star.boundary).angles.filter(angle => angle.kind === 'reflex')).toHaveLength(4);
        expect(facts(u.points, u.boundary).angles.filter(angle => angle.kind === 'reflex')).toHaveLength(2);
        const reversed = facts(acute.points, [...acute.boundary].reverse() as unknown as PolygonAreaBoundary);
        expect(reversed.orientation).toBe('clockwise'); expect(reversed.angles.every(angle => angle.kind === 'acute' && angle.crossProduct.numerator > 0)).toBe(true);
        expect(facts(acute.points, acute.boundary).angles.every(angle => angle.crossProduct.numerator < 0)).toBe(true);
    });
    it('retains harmless collinear subdivisions without confusing them with reflex angles or distinct lengths', () => {
        const data = fixture('straight subdivision', [[0, 0], [1, 0], [2, 0], [2, 2], [0, 2]], [0, 1, 2, 3, 4], [[0, 2, 3], [0, 3, 4]], 8);
        const result = facts(data.points, data.boundary);
        expect(result.angles[1]!.kind).toBe('straight'); expect(result.parallelEdgePairs).toContainEqual({firstEdgeIndex: 0, secondEdgeIndex: 1});
        expect(result.equalLengthEdgeGroups).toEqual([[0, 1], [2, 3, 4]]);
        expect(partition(data.points, data.boundary, data.cells)).toBe(true);
    });
    it('derives rational oblique and external altitude feet, without inventing an internal cut', () => {
        expect(project(p('C', 0, 5), p('A', 0, 0), p('B', 4, 3))).toEqual({foot: {x: q(12, 5), y: q(9, 5)}, footLocation: 'base-segment', area: q(10)});
        expect(project(p('C', 0, 3), p('P', 2, 0), p('B', 4, 0))).toEqual({foot: {x: q(0), y: q(0)}, footLocation: 'base-line-extension', area: q(3)});
        expect(project(p('C', 0, 3), p('A', 0, 0), p('P', 2, 0)).footLocation).toBe('base-segment');
        expect(project(p('C', 0, 5), p('B', 4, 3), p('A', 0, 0)).foot).toEqual({x: q(12, 5), y: q(9, 5)});
        expect(distance(p('a', -3, 0), p('b', 0, 2))).toEqual(q(13));
        expect(distance(p('a', 1, 1), p('b', 1, 1))).toEqual(q(0));
    });
    it('accepts safe stored large-region facts without requiring an unstored full-base or altitude square', () => {
        const data = fixture('wide subdivided rectangle', [[0, 0], [50000000, 0], [100000000, 0], [100000000, 1], [50000000, 1], [0, 1]],
            [0, 1, 2, 3, 4, 5], [[0, 2, 5], [2, 3, 5]], 200000000);
        expect(area(boundaryPoints(data))).toEqual(q(100000000)); expect(partition(data.points, data.boundary, data.cells)).toBe(true);
        expect(cuts(data.points, data.boundary, data.cells)).toHaveLength(1);
        expect(facts(data.points, data.boundary).sides.map(side => side.squaredLength)).toEqual([q(2500000000000000), q(2500000000000000), q(1), q(2500000000000000), q(2500000000000000), q(1)]);
        expect(project(data.points[5]!, data.points[0]!, data.points[2]!)).toEqual({foot: {x: q(0), y: q(0)}, footLocation: 'base-segment', area: q(50000000)});
        expect(project(p('apex', 0, 100000000), p('a', 0, 0), p('b', 1, 0))).toEqual({foot: {x: q(0), y: q(0)}, footLocation: 'base-segment', area: q(50000000)});
        expect(lengthMatches(data.points[0]!, data.points[2]!, q(100000000))).toBe(true);
        expect(lengthMatches(p('a', 0, 0), p('b', 0, 100000000), q(100000000))).toBe(true);
        expect(lengthMatches(data.points[0]!, data.points[2]!, q(99999999))).toBe(false);
        expect(lengthMatches(p('a', 0, 0), p('b', 0, 0), q(0))).toBe(true);
        expect(() => distance(data.points[0]!, data.points[2]!)).toThrow(GeneratorValidationError);
        for (const value of [q(-1), {numerator: 2, denominator: 2}, null]) expect(lengthMatches(data.points[0]!, data.points[2]!, value as never)).toBe(false);
        expect(lengthMatches(null as never, data.points[2]!, q(1))).toBe(false);
        expect(lengthMatches({get x() {throw Error('accessor');}, y: q(0)} as never, data.points[2]!, q(1))).toBe(false);
    });
});

describe('full exact partitions and atomic internal cuts', () => {
    it('derives five U cut atoms with boundary/T-junction splits and four pentagon cuts', () => {
        const byId = new Map(u.points.map(point => [point.id, point]));
        const result = cuts(u.points, u.boundary, u.cells);
        const expected = [[0, 6], [8, 4], [9, 2], [8, 5], [9, 4]].map(([first, second]) => segmentKey(u.points[first!]!, u.points[second!]!)).sort();
        expect(result.map(cut => segmentKey(byId.get(cut.fromId)!, byId.get(cut.toId)!)).sort()).toEqual(expected);
        expect(result.every(cut => cut.adjacentCellIds.length === 2 && cut.adjacentCellIds[0] !== cut.adjacentCellIds[1])).toBe(true);
        expect(cuts(convex.points, convex.boundary, convex.cells)).toHaveLength(4);
        expect(cuts(star.points, star.boundary, star.cells)).toHaveLength(8);
        expect(cuts(right.points, right.boundary, right.cells)).toHaveLength(1);
    });
    it('accepts coherent coordinate aliases and one-triangle mathematical partitions without imposing leaf arity', () => {
        const points = [...right.points, {...right.points[3]!, id: 'alias'}];
        const cells: Cell[] = [right.cells[0]!, {...right.cells[1]!, vertices: ['alias', 'p1', 'p2']}];
        expect(partition(points, right.boundary, cells)).toBe(true);
        expect(cuts(points, right.boundary, cells)).toHaveLength(1);
        const triangle = [{cellId: 'single', vertices: right.boundary as Cell['vertices']}];
        expect(partition(right.points, right.boundary, triangle)).toBe(true);
        expect(cuts(right.points, right.boundary, triangle)).toEqual([]);
    });
    it('rejects equal-area overlap plus gaps, missing coverage, outside concave edges and degenerate cells', () => {
        const square = fixture('square', [[0, 0], [4, 0], [4, 4], [0, 4]], [0, 1, 2, 3], [[0, 1, 3], [0, 1, 3]], 32);
        expect(square.cells.reduce((sum, cell) => sum + integerTwiceArea(cellPoints(square, cell)), 0n)).toBe(32n);
        expect(partition(square.points, square.boundary, square.cells)).toBe(false);
        expect(partition(right.points, right.boundary, [right.cells[0]!])).toBe(false);
        expect(partition(u.points, u.boundary, [{cellId: 'notch', vertices: ['p6', 'p3', 'p0']}])).toBe(false);
        expect(partition(u.points, u.boundary, [{cellId: 'crossing', vertices: ['p7', 'p2', 'p0']}])).toBe(false);
        expect(partition(right.points, right.boundary, [{cellId: 'line', vertices: ['p0', 'p3', 'p1']}])).toBe(false);
        expect(() => cuts(square.points, square.boundary, square.cells)).toThrow(GeneratorValidationError);
    });
    it('keeps tiny safe-coordinate partitions valid when an unrendered midpoint is not a safe scalar', () => {
        const maximum = Number.MAX_SAFE_INTEGER;
        const points = [{id: 'a', x: q(0), y: q(0)}, {id: 'b', x: q(1, maximum), y: q(0)},
            {id: 'c', x: q(1, maximum), y: q(maximum)}, {id: 'd', x: q(0), y: q(maximum)}];
        const boundary: PolygonAreaBoundary = ['a', 'b', 'c', 'd'];
        const cells: Cell[] = [{cellId: 'one', vertices: ['a', 'b', 'c']}, {cellId: 'two', vertices: ['a', 'c', 'd']}];
        expect(area(points)).toEqual(q(1)); expect(partition(points, boundary, cells)).toBe(true);
        expect(cuts(points, boundary, cells)).toHaveLength(1);
    });
});

describe('genuine rational rigid motion and malformed geometry', () => {
    it('proves both complete synthesis assemblies with exact source-copy normalization oracles', () => {
        const halfTurn: PolygonAreaIsometry = {matrix: [[q(-1), q(0)], [q(0), q(-1)]], translation: {x: q(4), y: q(3)}};
        const rightPoints = [...right.points, ...right.points.map(point => ({...transform(point, halfTurn), id: `copy-${point.id}`}))];
        const rightCells = [...right.cells, ...right.cells.map(cell => ({cellId: `copy-${cell.cellId}`, vertices: cell.vertices.map(id => `copy-${id}`) as unknown as Cell['vertices']}))];
        expect(partition(rightPoints, ['p0', 'p1', 'copy-p0', 'p2'], rightCells)).toBe(true);
        expect(area(['p0', 'p1', 'copy-p0', 'p2'].map(id => rightPoints.find(point => point.id === id)!))).toEqual(q(12));
        expect(area(boundaryPoints(right))).toEqual(q(6));
        const shift: PolygonAreaIsometry = {...identity, translation: {x: q(4), y: q(0)}};
        const wedge = parallelogram.cells[0]!, moved = wedge.vertices.map(id => ({...transform(parallelogram.points.find(point => point.id === id)!, shift), id: `moved-${id}`}));
        const paraPoints = [...parallelogram.points, ...moved], paraCells = [{cellId: 'moved', vertices: moved.map(point => point.id) as unknown as Cell['vertices']}, ...parallelogram.cells.slice(1)];
        expect(partition(paraPoints, ['p4', 'moved-p4', 'p2', 'p3'], paraCells)).toBe(true);
        expect(area(['p4', 'moved-p4', 'p2', 'p3'].map(id => paraPoints.find(point => point.id === id)!))).toEqual(q(8));
    });
    it('accepts rational rotations/reflections and rejects a determinant-one shear, scaling and negative zero', () => {
        const rotation: PolygonAreaIsometry = {matrix: [[q(3, 5), q(-4, 5)], [q(4, 5), q(3, 5)]], translation: {x: q(1, 2), y: q(-2)}};
        const reflection: PolygonAreaIsometry = {matrix: [[q(0), q(1)], [q(1), q(0)]], translation: {x: q(0), y: q(0)}};
        expect(isometry(identity)).toBe(true); expect(isometry(rotation)).toBe(true); expect(isometry(reflection)).toBe(true);
        expect(transform(p('p', 5, 0), rotation)).toEqual({x: q(7, 2), y: q(2)});
        expect(transform(p('p', -3, 2), reflection)).toEqual({x: q(2), y: q(-3)});
        for (const matrix of [[[q(1), q(1)], [q(0), q(1)]], [[q(2), q(0)], [q(0), q(2)]], [[q(1), q(0)], [q(1), q(1)]]]) {
            const invalid = {...identity, matrix}; expect(isometry(invalid)).toBe(false); expect(() => transform(p('p', 1, 1), invalid as never)).toThrow(GeneratorValidationError);
        }
        expect(isometry({...identity, translation: {x: {numerator: -0, denominator: 1}, y: q(0)}})).toBe(false);
    });
    it('validates every public boundary and fails total guards on sparse, cyclic and throwing values', () => {
        for (const invalid of [undefined, null, [], {}, new Array(2 ** 32 - 1), {get x() {throw Error('accessor');}, y: q(0)}]) {
            expect(partition(invalid as never, right.boundary, right.cells)).toBe(false);
            expect(isometry(invalid)).toBe(false);
        }
        expect(partition(right.points, ['p0', 'missing', 'p2'], right.cells)).toBe(false);
        expect(partition(right.points, right.boundary, [right.cells[0]!, {...right.cells[1]!, cellId: right.cells[0]!.cellId}])).toBe(false);
        expect(partition([...right.points, right.points[0]!], right.boundary, right.cells)).toBe(false);
        expect(partition(right.points, right.boundary, new Array(2 ** 32 - 1))).toBe(false);
        expect(partition(right.points, right.boundary, [{cellId: 'sparse', vertices: new Array(3)}] as never)).toBe(false);
        const cyclic: any = {}; cyclic.matrix = cyclic;
        expect(isometry(cyclic)).toBe(false);
        expect(isometry({...identity, matrix: new Array(2 ** 32 - 1)})).toBe(false);
        for (const invalid of [[], [p('a', 0, 0), p('b', 1, 0), p('c', 2, 0)], [p('a', 0, 0), p('b', 2, 2), p('c', 0, 2), p('d', 2, 0)]]) {
            expect(() => area(invalid)).toThrow(GeneratorValidationError);
        }
        expect(() => area([{get x() {throw Error('accessor');}, y: q(0)}] as never)).toThrow(GeneratorValidationError);
        expect(() => facts(right.points, ['p0', 'p1', 'missing'])).toThrow(GeneratorValidationError);
        expect(() => project(p('c', 0, 0), p('a', 0, 0), p('b', 0, 0))).toThrow(GeneratorValidationError);
        expect(() => project(p('c', 2, 0), p('a', 0, 0), p('b', 1, 0))).toThrow(GeneratorValidationError);
        expect(() => project({x: q(1, 2), y: {numerator: 2, denominator: 2}}, p('a', 0, 0), p('b', 1, 0))).toThrow(GeneratorValidationError);
        expect(() => distance(null as never, p('b', 1, 0))).toThrow(GeneratorValidationError);
        expect(() => transform({x: q(Number.MAX_SAFE_INTEGER), y: q(0)}, {...identity, translation: {x: q(1), y: q(0)}})).toThrow(GeneratorValidationError);
    });
});
