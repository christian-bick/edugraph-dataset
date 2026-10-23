import {buildPolygonAreaDissectionProblem, type PolygonAreaBuildInput} from '../../../generators/shape/polygon-area-helpers.ts';
import type {AlgebraicScalar, PolygonAreaDissectionProblem, PolygonAreaIsometry, PolygonAreaPoint} from '../../../types/problems.ts';

export const areaValue = (numerator: number, denominator = 1): AlgebraicScalar => ({numerator, denominator});
const q = areaValue;
const point = (id: string, x: number, y: number): PolygonAreaPoint => ({id, x: q(x), y: q(y)});
const identity: PolygonAreaIsometry = {matrix: [[q(1), q(0)], [q(0), q(1)]], translation: {x: q(0), y: q(0)}};
type Cell = readonly [vertices: readonly [string, string, string], base: readonly [string, string, number], height: readonly [string, string, number]];
export type AreaFixture = 'right' | 'acute' | 'obtuse' | 'parallelogram' | 'rhombus' | 'trapezoid' | 'kite' | 'polygon' | 'concave';

/** Literal independent geometry/areas; no random sampling or generator template is used. */
export function areaBlueprint(kind: AreaFixture): PolygonAreaBuildInput {
    let points: PolygonAreaPoint[], boundary: [string, string, string, ...string[]], literals: Cell[];
    if (kind === 'right') {
        points = [point('A', 0, 0), point('B', 4, 0), point('C', 0, 3), point('P', 2, 0)]; boundary = ['A', 'B', 'C'];
        literals = [[['A', 'P', 'C'], ['A', 'P', 2], ['C', 'A', 3]], [['P', 'B', 'C'], ['P', 'B', 2], ['C', 'A', 3]]];
    } else if (kind === 'acute' || kind === 'obtuse') {
        const height = kind === 'acute' ? 4 : 1;
        points = [point('A', 0, 0), point('B', 6, 0), point('C', 3, height), point('H', 3, 0)]; boundary = ['A', 'B', 'C'];
        literals = [[['A', 'H', 'C'], ['A', 'H', 3], ['C', 'H', height]], [['H', 'B', 'C'], ['H', 'B', 3], ['C', 'H', height]]];
    } else if (kind === 'parallelogram') {
        points = [point('A', 0, 0), point('B', 4, 0), point('C', 5, 2), point('D', 1, 2), point('E', 1, 0), point('F', 5, 0)]; boundary = ['A', 'B', 'C', 'D'];
        literals = [[['A', 'E', 'D'], ['A', 'E', 1], ['D', 'E', 2]], [['E', 'B', 'C'], ['E', 'B', 3], ['C', 'F', 2]], [['E', 'C', 'D'], ['D', 'C', 4], ['E', 'D', 2]]];
    } else if (kind === 'rhombus' || kind === 'kite') {
        const radius = kind === 'rhombus' ? 3 : 2, bottom = kind === 'rhombus' ? 2 : 1, top = kind === 'rhombus' ? 2 : 3;
        points = [point('A', -radius, 0), point('B', 0, -bottom), point('C', radius, 0), point('D', 0, top), point('O', 0, 0)]; boundary = ['A', 'B', 'C', 'D'];
        literals = [[['O', 'A', 'B'], ['O', 'A', radius], ['B', 'O', bottom]], [['O', 'B', 'C'], ['O', 'C', radius], ['B', 'O', bottom]], [['O', 'C', 'D'], ['O', 'C', radius], ['D', 'O', top]], [['O', 'D', 'A'], ['O', 'A', radius], ['D', 'O', top]]];
    } else if (kind === 'trapezoid') {
        points = [point('A', 0, 0), point('B', 6, 0), point('C', 4, 3), point('D', 1, 3), point('E', 1, 0), point('F', 4, 0)]; boundary = ['A', 'B', 'C', 'D'];
        literals = [[['A', 'E', 'D'], ['A', 'E', 1], ['D', 'E', 3]], [['E', 'F', 'C'], ['E', 'F', 3], ['C', 'F', 3]], [['E', 'C', 'D'], ['D', 'C', 3], ['E', 'D', 3]], [['F', 'B', 'C'], ['F', 'B', 2], ['C', 'F', 3]]];
    } else if (kind === 'polygon') {
        points = [point('A', 0, 0), point('B', 4, 0), point('C', 5, 2), point('D', 2, 5), point('E', 0, 3), point('L', 2, 0), point('M', 4, 3), point('F', 0, 5), point('G', 2, 3), point('H', 4, 2)]; boundary = ['A', 'B', 'C', 'D', 'E'];
        literals = [[['A', 'L', 'D'], ['L', 'D', 5], ['A', 'L', 2]], [['A', 'D', 'E'], ['A', 'E', 3], ['D', 'F', 2]], [['L', 'B', 'M'], ['B', 'M', 3], ['L', 'B', 2]], [['L', 'M', 'D'], ['L', 'D', 5], ['M', 'G', 2]], [['B', 'C', 'M'], ['B', 'M', 3], ['C', 'H', 1]]];
    } else {
        points = [point('A', 0, 0), point('B', 6, 0), point('C', 6, 5), point('D', 4, 5), point('E', 4, 2), point('F', 2, 2), point('G', 2, 5), point('H', 0, 4), point('I', 2, 0), point('J', 4, 0), point('K', 0, 5)]; boundary = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        literals = [[['A', 'I', 'G'], ['I', 'G', 5], ['A', 'I', 2]], [['A', 'G', 'H'], ['A', 'H', 4], ['G', 'K', 2]], [['I', 'J', 'E'], ['J', 'E', 2], ['I', 'J', 2]], [['I', 'E', 'F'], ['I', 'F', 2], ['E', 'F', 2]], [['J', 'B', 'C'], ['B', 'C', 5], ['J', 'B', 2]], [['J', 'C', 'D'], ['J', 'D', 5], ['C', 'D', 2]]];
    }
    const cells = literals.map(([vertices, base, height], index) => ({cellId: `cell-${index}`, vertices, base: {firstId: base[0], secondId: base[1], measureId: `base-${index}`}, height: {apexId: height[0], footId: height[1], measureId: `height-${index}`}}));
    const measures = literals.flatMap(([, base, height], index) => [
        {measureId: `base-${index}`, kind: 'measured-length' as const, segment: {fromId: base[0], toId: base[1]}, value: q(base[2]), notation: {kind: 'integer' as const, numeral: String(base[2])}},
        {measureId: `height-${index}`, kind: 'measured-length' as const, segment: {fromId: height[0], toId: height[1]}, value: q(height[2]), notation: {kind: 'integer' as const, numeral: String(height[2])}}
    ]);
    const placements = cells.map((cell, index) => ({placementId: `placement-${index}`, sourceCellId: cell.cellId, copyIndex: 0, transform: identity, pointMap: [...new Set([...cell.vertices, cell.height.footId])].map(id => ({sourceId: id, targetId: id}))}));
    const dimensions = cells.flatMap(cell => [{measureId: cell.base.measureId, meaning: 'base-span' as const}, {measureId: cell.height.measureId, meaning: 'perpendicular-height' as const}]);
    return {source: {regionId: 'original', points: [points[0]!, ...points.slice(1)], boundary, cells: [cells[0]!, cells[1]!, ...cells.slice(2)]},
        units: {length: {subject: 'length', name: 'meters', dimensions: {length: 1, currency: 0, time: 0, count: 0}}, area: {subject: 'area', name: 'square meters', dimensions: {length: 2, currency: 0, time: 0, count: 0}}},
        measures: [measures[0]!, ...measures.slice(1)], assembly: {copyCount: 1, targetBoundary: boundary, placements: [placements[0]!, placements[1]!, ...placements.slice(2)], areaDerivation: {kind: 'triangle-area-sum'}},
        context: {kind: 'garden-bed', sourceRegionId: 'original', dimensions: [dimensions[0]!, ...dimensions.slice(1)]}};
}

export const areaFixture = (kind: AreaFixture): PolygonAreaDissectionProblem => buildPolygonAreaDissectionProblem(areaBlueprint(kind));

export function areaDoublingBlueprint(): PolygonAreaBuildInput {
    const input = areaBlueprint('right'), reverse: PolygonAreaIsometry = {matrix: [[q(-1), q(0)], [q(0), q(-1)]], translation: {x: q(4), y: q(3)}};
    const copies = input.assembly.placements.map((placement, index) => ({...placement, placementId: `reverse-${index}`, copyIndex: 1, transform: reverse, pointMap: placement.pointMap.map(row => ({sourceId: row.sourceId, targetId: `reverse-${row.sourceId}`}))}));
    return {...input, measures: [...input.measures, {measureId: 'full-width', kind: 'sum-or-difference', operation: 'addition', firstMeasureId: 'base-0', secondMeasureId: 'base-1', segment: {fromId: 'A', toId: 'B'}}, {measureId: 'full-height', kind: 'scaled-length', sourceMeasureId: 'height-0', factor: q(1), segment: {fromId: 'A', toId: 'C'}}], assembly: {...input.assembly, copyCount: 2, targetBoundary: ['A', 'B', 'reverse-A', 'reverse-B'], placements: [...input.assembly.placements, ...copies], areaDerivation: {kind: 'rectangle-product', firstMeasureId: 'full-width', secondMeasureId: 'full-height'}}};
}

/** Every stored side square is safe; a full triangle base square is not a payload fact. */
export function areaWideBlueprint(): PolygonAreaBuildInput {
    const original = areaBlueprint('right');
    const points = [point('A', 0, 0), point('B', 50_000_000, 0), point('C', 100_000_000, 0), point('D', 100_000_000, 1), point('E', 50_000_000, 1), point('F', 0, 1)];
    const boundary = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
    const cells = [
        {cellId: 'lower', vertices: ['A', 'C', 'D'] as const, base: {firstId: 'A', secondId: 'C', measureId: 'bottom'}, height: {apexId: 'D', footId: 'C', measureId: 'right'}},
        {cellId: 'upper', vertices: ['A', 'D', 'F'] as const, base: {firstId: 'F', secondId: 'D', measureId: 'top'}, height: {apexId: 'A', footId: 'F', measureId: 'left'}}
    ] as const;
    const placements = cells.map(cell => ({placementId: cell.cellId, sourceCellId: cell.cellId, copyIndex: 0, transform: identity, pointMap: [...new Set([...cell.vertices, cell.height.footId])].map(id => ({sourceId: id, targetId: id}))}));
    return {source: {regionId: 'wide-original', points: [points[0]!, ...points.slice(1)], boundary, cells}, units: original.units,
        measures: [
            {measureId: 'bottom', kind: 'measured-length', segment: {fromId: 'A', toId: 'C'}, value: q(100_000_000), notation: {kind: 'integer', numeral: '100000000'}},
            {measureId: 'right', kind: 'measured-length', segment: {fromId: 'D', toId: 'C'}, value: q(1), notation: {kind: 'integer', numeral: '1'}},
            {measureId: 'top', kind: 'measured-length', segment: {fromId: 'F', toId: 'D'}, value: q(100_000_000), notation: {kind: 'integer', numeral: '100000000'}},
            {measureId: 'left', kind: 'measured-length', segment: {fromId: 'A', toId: 'F'}, value: q(1), notation: {kind: 'integer', numeral: '1'}}
        ], assembly: {copyCount: 1, targetBoundary: boundary, placements: [placements[0]!, placements[1]!], areaDerivation: {kind: 'triangle-area-sum'}},
        context: {kind: 'fabric-panel', sourceRegionId: 'wide-original', dimensions: [{measureId: 'bottom', meaning: 'base-span'}, {measureId: 'right', meaning: 'perpendicular-height'}, {measureId: 'top', meaning: 'base-span'}, {measureId: 'left', meaning: 'perpendicular-height'}]}};
}

/** The scale-2 star matches the geometry of the observed crowded source panel. */
export function areaStarBlueprint(): PolygonAreaBuildInput {
    const sourcePoints = [point('A', -8, 0), point('B', -2, -2), point('C', 0, -8), point('D', 2, -2), point('E', 8, 0), point('F', 2, 2), point('G', 0, 8), point('H', -2, 2), point('I', 0, 0), point('J', -2, 0), point('K', 0, -2), point('L', 2, 0), point('M', 0, 2)];
    const boundary = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
    const roles = [['A', 'B', 'A', 'B', 'J'], ['B', 'C', 'C', 'B', 'K'], ['C', 'D', 'C', 'D', 'K'], ['D', 'E', 'E', 'D', 'L'], ['E', 'F', 'E', 'F', 'L'], ['F', 'G', 'G', 'F', 'M'], ['G', 'H', 'G', 'H', 'M'], ['H', 'A', 'A', 'H', 'J']] as const;
    const cells = roles.map(([first, second, baseEnd, apex, foot], index) => ({cellId: `star-${index}`, vertices: ['I', first, second] as const, base: {firstId: 'I', secondId: baseEnd, measureId: `base-${index}`}, height: {apexId: apex, footId: foot, measureId: `height-${index}`}}));
    const measures = cells.flatMap(cell => [{measureId: cell.base.measureId, kind: 'measured-length' as const, segment: {fromId: 'I', toId: cell.base.secondId}, value: q(8), notation: {kind: 'integer' as const, numeral: '8'}}, {measureId: cell.height.measureId, kind: 'measured-length' as const, segment: {fromId: cell.height.apexId, toId: cell.height.footId}, value: q(2), notation: {kind: 'integer' as const, numeral: '2'}}]);
    const placements = cells.map(cell => ({placementId: cell.cellId, sourceCellId: cell.cellId, copyIndex: 0, transform: identity, pointMap: [...new Set([...cell.vertices, cell.height.footId])].map(id => ({sourceId: id, targetId: id}))}));
    const dimensions = cells.flatMap(cell => [{measureId: cell.base.measureId, meaning: 'base-span' as const}, {measureId: cell.height.measureId, meaning: 'perpendicular-height' as const}]);
    return {source: {regionId: 'star', points: [sourcePoints[0]!, ...sourcePoints.slice(1)], boundary, cells: [cells[0]!, cells[1]!, ...cells.slice(2)]}, units: areaBlueprint('right').units, measures: [measures[0]!, ...measures.slice(1)], assembly: {copyCount: 1, targetBoundary: boundary, placements: [placements[0]!, placements[1]!, ...placements.slice(2)], areaDerivation: {kind: 'triangle-area-sum'}}, context: {kind: 'garden-bed', sourceRegionId: 'star', dimensions: [dimensions[0]!, ...dimensions.slice(1)]}};
}

/** Genuine wedge-to-rectangle assembly with a narrow rightmost placed triangle. */
export function areaWedgeBlueprint(): PolygonAreaBuildInput {
    const input = areaBlueprint('parallelogram');
    const placements = input.assembly.placements.map((placement, index) => index === 0 ? {...placement, transform: {...identity, translation: {x: q(4), y: q(0)}}, pointMap: placement.pointMap.map(row => ({sourceId: row.sourceId, targetId: `moved-${row.sourceId}`}))} : placement);
    return {...input, measures: [...input.measures, {measureId: 'target-width', kind: 'scaled-length', sourceMeasureId: 'base-2', factor: q(1), segment: {fromId: 'D', toId: 'C'}}, {measureId: 'target-height', kind: 'scaled-length', sourceMeasureId: 'height-1', factor: q(1), segment: {fromId: 'F', toId: 'C'}}], assembly: {copyCount: 1, targetBoundary: ['E', 'moved-E', 'C', 'D'], placements: [placements[0]!, placements[1]!, ...placements.slice(2)], areaDerivation: {kind: 'rectangle-product', firstMeasureId: 'target-width', secondMeasureId: 'target-height'}}};
}
