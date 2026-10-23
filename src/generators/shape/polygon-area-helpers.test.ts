import {describe, expect, it} from 'vitest';
import type {AlgebraicScalar, ExactCoefficientArithmetic, PolygonAreaDissectionProblem} from '../../types/problems.ts';
import {affineScalar} from '../algebra/algebra-affine-helpers.ts';
import {buildPolygonAreaDissectionProblem as build, isPolygonAreaDissectionProblem as valid,
    type PolygonAreaBuildInput} from './polygon-area-helpers.ts';
import {makePolygonAreaSamplerBlueprint, type PolygonAreaSamplerFamily} from './polygon-area-sampler-helpers.ts';

const q = (n: number, d = 1): AlgebraicScalar => affineScalar(BigInt(n), BigInt(d));
const given = (measureId: string, fromId: string, toId: string, n: number) => ({kind: 'measured-length' as const,
    measureId, segment: {fromId, toId}, value: q(n), notation: {kind: 'integer' as const, numeral: String(n)}});
const work = (operation: ExactCoefficientArithmetic['operation'], first: number, second: number, result: number): ExactCoefficientArithmetic =>
    ({kind: 'binary', operation, operands: [q(first), q(second)], result: q(result)});

/** Independent3-4 triangle, literal2+2 base partition, two half-turn copies. No generator fixture. */
function right(): PolygonAreaBuildInput {
    const identity = {matrix: [[q(1), q(0)], [q(0), q(1)]], translation: {x: q(0), y: q(0)}} as const;
    const turn = {matrix: [[q(-1), q(0)], [q(0), q(-1)]], translation: {x: q(4), y: q(3)}} as const;
    return {source: {regionId: 'triangle', points: [{id: 'A', x: q(0), y: q(0)}, {id: 'B', x: q(4), y: q(0)},
        {id: 'C', x: q(0), y: q(3)}, {id: 'P', x: q(2), y: q(0)}], boundary: ['A', 'B', 'C'],
        cells: [{cellId: 'left', vertices: ['A', 'P', 'C'], base: {firstId: 'A', secondId: 'P', measureId: 'b1'}, height: {apexId: 'C', footId: 'A', measureId: 'h'}},
            {cellId: 'right', vertices: ['P', 'B', 'C'], base: {firstId: 'P', secondId: 'B', measureId: 'b2'}, height: {apexId: 'C', footId: 'A', measureId: 'h'}}]},
        units: {length: {subject: 'length', name: 'meters', dimensions: {currency: 0, time: 0, count: 0, length: 1}},
            area: {subject: 'area', name: 'square meters', dimensions: {currency: 0, time: 0, count: 0, length: 2}}},
        measures: [given('b1', 'A', 'P', 2), given('b2', 'P', 'B', 2), given('h', 'C', 'A', 3),
            {kind: 'sum-or-difference', measureId: 'width', segment: {fromId: 'A', toId: 'B'}, operation: 'addition', firstMeasureId: 'b1', secondMeasureId: 'b2'},
            {kind: 'scaled-length', measureId: 'height', segment: {fromId: 'B', toId: 'T'}, sourceMeasureId: 'h', factor: q(1)}],
        assembly: {copyCount: 2, targetBoundary: ['A', 'B', 'T', 'C'], areaDerivation: {kind: 'rectangle-product', firstMeasureId: 'width', secondMeasureId: 'height'},
            placements: [{placementId: 'l0', sourceCellId: 'left', copyIndex: 0, transform: identity, pointMap: [{sourceId: 'A', targetId: 'A'}, {sourceId: 'P', targetId: 'P'}, {sourceId: 'C', targetId: 'C'}]},
                {placementId: 'r0', sourceCellId: 'right', copyIndex: 0, transform: identity, pointMap: [{sourceId: 'P', targetId: 'P'}, {sourceId: 'B', targetId: 'B'}, {sourceId: 'C', targetId: 'C'}, {sourceId: 'A', targetId: 'A'}]},
                {placementId: 'l1', sourceCellId: 'left', copyIndex: 1, transform: turn, pointMap: [{sourceId: 'A', targetId: 'T'}, {sourceId: 'P', targetId: 'Q'}, {sourceId: 'C', targetId: 'B'}]},
                {placementId: 'r1', sourceCellId: 'right', copyIndex: 1, transform: turn, pointMap: [{sourceId: 'P', targetId: 'Q'}, {sourceId: 'B', targetId: 'C'}, {sourceId: 'C', targetId: 'B'}, {sourceId: 'A', targetId: 'T'}]}]},
        context: {kind: 'garden-bed', sourceRegionId: 'triangle', dimensions: [{measureId: 'b1', meaning: 'base-span'}, {measureId: 'b2', meaning: 'base-span'}, {measureId: 'h', meaning: 'perpendicular-height'}]}};
}
/** Boundary-edge squares fit safe storage although the unprinted full-base square does not. */
function wideRectangle(): PolygonAreaBuildInput {
    const identity = {matrix: [[q(1), q(0)], [q(0), q(1)]], translation: {x: q(0), y: q(0)}} as const;
    return {source: {regionId: 'wide', points: [{id: 'A', x: q(0), y: q(0)}, {id: 'B', x: q(50000000), y: q(0)},
        {id: 'C', x: q(100000000), y: q(0)}, {id: 'D', x: q(100000000), y: q(1)}, {id: 'E', x: q(50000000), y: q(1)}, {id: 'F', x: q(0), y: q(1)}],
        boundary: ['A', 'B', 'C', 'D', 'E', 'F'], cells: [
            {cellId: 'lower', vertices: ['A', 'C', 'F'], base: {firstId: 'A', secondId: 'C', measureId: 'base-low'}, height: {apexId: 'F', footId: 'A', measureId: 'height-left'}},
            {cellId: 'upper', vertices: ['C', 'D', 'F'], base: {firstId: 'F', secondId: 'D', measureId: 'base-high'}, height: {apexId: 'C', footId: 'D', measureId: 'height-right'}}]},
        units: right().units, measures: [given('base-low', 'A', 'C', 100000000), given('base-high', 'F', 'D', 100000000), given('height-left', 'F', 'A', 1), given('height-right', 'C', 'D', 1)],
        assembly: {copyCount: 1, targetBoundary: ['A', 'B', 'C', 'D', 'E', 'F'], areaDerivation: {kind: 'triangle-area-sum'}, placements: [
            {placementId: 'p-lower', sourceCellId: 'lower', copyIndex: 0, transform: identity, pointMap: [{sourceId: 'A', targetId: 'A'}, {sourceId: 'C', targetId: 'C'}, {sourceId: 'F', targetId: 'F'}]},
            {placementId: 'p-upper', sourceCellId: 'upper', copyIndex: 0, transform: identity, pointMap: [{sourceId: 'C', targetId: 'C'}, {sourceId: 'D', targetId: 'D'}, {sourceId: 'F', targetId: 'F'}]}]},
        context: {kind: 'floor-region', sourceRegionId: 'wide', dimensions: [{measureId: 'base-low', meaning: 'base-span'}, {measureId: 'base-high', meaning: 'base-span'},
            {measureId: 'height-left', meaning: 'perpendicular-height'}, {measureId: 'height-right', meaning: 'perpendicular-height'}]}};
}
type Mutable = any;
const changed = (problem: PolygonAreaDissectionProblem, change: (value: Mutable) => void) => {
    const copy = structuredClone(problem); change(copy); return copy;
};

describe('complete polygon area mathematical model', () => {
    it('derives exact feet, four rigid cells, independent6source/12whole work and square units from literal premises', () => {
        const input = right(), before = structuredClone(input), model = build(input);
        expect(input).toEqual(before); expect(valid(model)).toBe(true);
        expect(model.source.area).toEqual(q(6)); expect(model.source.cells.map(cell => cell.area)).toEqual([q(3), q(3)]);
        expect(model.source.cells[1]!.height.footLocation).toBe('base-line-extension');
        expect(model.source.shapeFacts.angles.find(angle => angle.vertexId === 'A')!.kind).toBe('right');
        expect(model.source.cuts).toHaveLength(1);
        expect(new Set(model.source.cuts[0]!.adjacentCellIds)).toEqual(new Set(['left', 'right']));
        expect(model.points.find(point => point.id === 'T')).toEqual({id: 'T', x: q(4), y: q(3)});
        expect(model.points.find(point => point.id === 'Q')).toEqual({id: 'Q', x: q(2), y: q(3)});
        expect(model.assembly.areaSum.total).toEqual(q(12));
        expect(model.assembly.copyAreaProduct).toEqual(work('multiplication', 6, 2, 12));
        expect(model.assembly.sourceAreaNormalization).toEqual(work('division', 12, 2, 6));
        expect(model.context.dimensions.map(row => row.measureId)).toEqual(['b1', 'b2', 'h']);
    });
    it('adopts every literal source family, all three generic variants, fractional scales and physical contexts', () => {
        const areas: [PolygonAreaSamplerFamily, number, number][] = [['right-triangle', 6, 1], ['acute-triangle', 12, 1], ['obtuse-triangle', 3, 1],
            ['parallelogram', 8, 1], ['rhombus', 12, 1], ['trapezoid', 27, 2], ['kite', 8, 1], ['polygon', 35, 2]];
        for (const [family, n, d] of areas) for (const scale of [0, 1, 2, 3] as const) {
            const model = build(makePolygonAreaSamplerBlueprint(family, scale, scale % 2 ? 'fabric-panel' : 'floor-region', 'convex'));
            const [sn, sd] = [[1, 2], [1, 1], [3, 2], [2, 1]][scale]!;
            expect(model.source.area).toEqual(q(n * sn! * sn!, d * sd! * sd!)); expect(valid(model)).toBe(true);
        }
        for (const [variant, area, cuts] of [['star', 16, 8], ['nonstar', 23, 5]] as const) {
            const model = build(makePolygonAreaSamplerBlueprint('polygon', 1, 'garden-bed', variant));
            expect(model.source.area).toEqual(q(area)); expect(model.source.cuts).toHaveLength(cuts);
        }
    });
    it('admits a rationally rotated rectangle assembly with original exact3-4 lengths', () => {
        const input: Mutable = right();
        input.source.points = [{id: 'A', x: q(0), y: q(0)}, {id: 'B', x: q(12, 5), y: q(16, 5)},
            {id: 'C', x: q(-12, 5), y: q(9, 5)}, {id: 'P', x: q(6, 5), y: q(8, 5)}];
        for (const entry of input.assembly.placements.filter((row: Mutable) => row.copyIndex === 1)) entry.transform.translation = {x: q(0), y: q(5)};
        const model = build(input);
        expect(valid(model)).toBe(true); expect(model.source.area).toEqual(q(6));
        expect(model.points.find(point => point.id === 'T')).toEqual({id: 'T', x: q(0), y: q(5)});
    });
    it('accepts derived source lengths in arbitrary graph order, exact original spelling, and explicit question closure', () => {
        const input: Mutable = right();
        input.measures[0] = {kind: 'scaled-length', measureId: 'b1', segment: {fromId: 'A', toId: 'P'}, sourceMeasureId: 'full', factor: q(1, 2), notation: {kind: 'fraction', numerator: 4, denominator: 2}};
        input.measures[1] = {kind: 'sum-or-difference', measureId: 'b2', segment: {fromId: 'P', toId: 'B'}, operation: 'subtraction', firstMeasureId: 'full', secondMeasureId: 'b1'};
        input.measures.push(given('full', 'A', 'B', 4));
        input.context.dimensions.push({measureId: 'full', meaning: 'base-span'});
        const model = build(input);
        expect(valid(model)).toBe(true); expect(model.measures[0]!.notation).toEqual({kind: 'fraction', numerator: 4, denominator: 2});
        expect(model.measures[1]!.value).toEqual(q(2)); expect(model.context.dimensions).toHaveLength(4);
        expect(model.measures.find(row => row.measureId === 'full')!.kind).toBe('measured-length');
        expect(valid(changed(model, p => {p.measures[0].arithmetic.operands.reverse();}))).toBe(true);
        expect(valid(changed(model, p => {p.measures[1].arithmetic.operands.reverse();}))).toBe(false);
    });
    it.each(['addition', 'multiplication'])('accepts swapped %s evidence for a derived length with distinct operands', operation => {
        const input: Mutable = right(); input.source.points[3].x = q(1);
        input.measures[0].value = q(1); input.measures[0].notation.numeral = '1';
        input.measures[1].value = q(3); input.measures[1].notation.numeral = '3';
        const model = build(input);
        expect(valid(changed(model, p => {p.measures.find((entry: Mutable) => entry.arithmetic?.operation === operation).arithmetic.operands.reverse();}))).toBe(true);
    });
    it('retains genuine zero offsets and zero scale factors without allowing a zero triangle height', () => {
        for (const scaled of [false, true]) {
            const input: Mutable = right();
            input.measures[0] = {kind: 'sum-or-difference', measureId: 'b1', segment: {fromId: 'A', toId: 'P'}, operation: 'addition', firstMeasureId: 'half', secondMeasureId: 'zero'};
            input.measures.push(given('half', 'A', 'P', 2), scaled
                ? {kind: 'scaled-length', measureId: 'zero', segment: {fromId: 'A', toId: 'A'}, sourceMeasureId: 'half', factor: q(0)} : given('zero', 'A', 'A', 0));
            input.context.dimensions.push({measureId: 'half', meaning: 'base-span'}, {measureId: 'zero', meaning: 'offset-span'});
            const model = build(input); expect(valid(model)).toBe(true);
            expect(model.measures.find(row => row.measureId === 'zero')!.value).toEqual(q(0));
        }
    });
    it('accepts independent sum/work/list orders, swapped commutative products, aliases and collinear target subdivisions', () => {
        const model: Mutable = build(makePolygonAreaSamplerBlueprint('parallelogram', 1, 'garden-bed', 'convex'));
        model.source.areaSum = {pieceIds: ['t3', 't1', 't2'], additions: [work('addition', 1, 4, 5), work('addition', 3, 5, 8)], total: q(8)};
        model.source.cells.reverse(); model.points.reverse(); model.measures.reverse(); model.context.dimensions.reverse(); model.assembly.placements.reverse();
        for (const entry of model.assembly.placements) {entry.pointMap.reverse(); entry.vertices.reverse();}
        model.source.cells[0].baseHeightProduct.operands.reverse(); model.assembly.copyAreaProduct.operands.reverse();
        const cut = model.source.cuts[0], original = model.points.find((entry: Mutable) => entry.id === cut.fromId);
        model.points.push({...original, id: 'coincident-cut-alias'}); cut.fromId = 'coincident-cut-alias'; cut.adjacentCellIds.reverse();
        expect(valid(model)).toBe(true);
        const subdivided: Mutable = build(right()); subdivided.assembly.targetBoundary.splice(1, 0, 'P');
        expect(valid(subdivided)).toBe(true);
        subdivided.measures.find((entry: Mutable) => entry.measureId === 'height').segment = {fromId: 'C', toId: 'A'};
        expect(valid(subdivided)).toBe(true);
        const rhombus: Mutable = build(makePolygonAreaSamplerBlueprint('rhombus', 1, 'floor-region', 'convex'));
        rhombus.source.shapeFacts.parallelEdgePairs.reverse().forEach((pair: Mutable) => [pair.firstEdgeIndex, pair.secondEdgeIndex] = [pair.secondEdgeIndex, pair.firstEdgeIndex]);
        rhombus.source.shapeFacts.equalLengthEdgeGroups[0].reverse(); expect(valid(rhombus)).toBe(true);
    });
    it('supports clockwise boundaries and integer magnitudes outside the local sampler scales', () => {
        const clockwise: Mutable = right(); clockwise.source.boundary.reverse(); expect(build(clockwise).source.shapeFacts.orientation).toBe('clockwise');
        const input: Mutable = right();
        for (const point of input.source.points) {point.x = q(point.x.numerator * 1000); point.y = q(point.y.numerator * 1000);}
        for (const measure of input.measures) if (measure.kind === 'measured-length') {measure.value = q(measure.value.numerator * 1000); measure.notation.numeral = String(measure.value.numerator);}
        for (const entry of input.assembly.placements) if (entry.copyIndex === 1) entry.transform.translation = {x: q(4000), y: q(3000)};
        expect(build(input).source.area).toEqual(q(6000000));
    });
    it('accepts full100million bases when only unprinted intermediate squares exceed safe storage', () => {
        const model = build(wideRectangle());
        expect(valid(model)).toBe(true); expect(model.source.area).toEqual(q(100000000));
        expect(model.source.cells.map(cell => cell.area)).toEqual([q(50000000), q(50000000)]);
        expect(model.source.shapeFacts.sides.map(side => side.squaredLength)).toEqual([q(2500000000000000), q(2500000000000000), q(1), q(2500000000000000), q(2500000000000000), q(1)]);
        expect(model.source.shapeFacts.angles.filter(angle => angle.kind === 'straight')).toHaveLength(2);
        expect(model.assembly.areaSum.total).toEqual(q(100000000));
        expect(model.source.cells[0]!.baseHeightProduct).toEqual(work('multiplication', 100000000, 1, 100000000));
        expect(valid(changed(model, p => {p.measures[0].value = q(99999999); p.measures[0].notation.numeral = '99999999';}))).toBe(false);
    });
    it('validates genuine source diagonal and offset roles rather than arbitrary prose tags', () => {
        const model: Mutable = build(makePolygonAreaSamplerBlueprint('rhombus', 1, 'floor-region', 'convex'));
        model.context.dimensions[0].meaning = 'offset-span'; expect(valid(model)).toBe(true);
        const bad = changed(model, value => {value.context.dimensions[0].meaning = 'diagonal-span';}); expect(valid(bad)).toBe(false);
    });

    const mutations: [string, (value: Mutable) => void][] = [
        ['wrong kind', p => {p.kind = 'other';}], ['missing source', p => {delete p.source;}],
        ['wrong unit subject', p => {p.units.length.subject = 'time';}], ['wrong named square', p => {p.units.area.name = 'square centimeters';}],
        ['wrong unit dimensions', p => {p.units.area.dimensions.currency = 1;}], ['wrong square power', p => {p.units.area.dimensions.length = 3;}],
        ['duplicate point ID', p => {p.points.push(p.points[0]);}], ['unsafe coordinate', p => {p.points[0].x.numerator = Number.MAX_SAFE_INTEGER + 1;}],
        ['unreduced coordinate', p => {p.points[0].x = {numerator: 0, denominator: 2};}], ['negative zero coordinate', p => {p.points[0].x.numerator = -0;}],
        ['missing boundary point', p => {p.source.boundary[0] = 'missing';}], ['repeated boundary vertex', p => {p.source.boundary[1] = p.source.boundary[0];}],
        ['self crossing target', p => {[p.assembly.targetBoundary[1], p.assembly.targetBoundary[2]] = [p.assembly.targetBoundary[2], p.assembly.targetBoundary[1]];}],
        ['duplicate cell', p => {p.source.cells[1].cellId = p.source.cells[0].cellId;}], ['wrong apex', p => {p.source.cells[0].height.apexId = 'A';}],
        ['wrong foot coordinate', p => {p.source.cells[0].height.footId = 'B';}], ['wrong foot class', p => {p.source.cells[1].height.footLocation = 'base-segment';}],
        ['wrong base measure', p => {p.source.cells[0].base.measureId = 'h';}], ['wrong height measure', p => {p.source.cells[0].height.measureId = 'b1';}],
        ['wrong triangle product', p => {p.source.cells[0].baseHeightProduct.result = q(9);}], ['wrong half divisor', p => {p.source.cells[0].halfProduct.operands[1] = q(3);}],
        ['wrong triangle area', p => {p.source.cells[0].area = q(9);}], ['wrong whole area', p => {p.source.area = q(12);}],
        ['overlap and missing cell', p => {p.source.cells[1] = {...p.source.cells[0], cellId: 'right'};}],
        ['wrong shape side square', p => {p.source.shapeFacts.sides[0].squaredLength = q(5);}], ['negative zero side index', p => {p.source.shapeFacts.sides[0].edgeIndex = -0;}], ['wrong angle', p => {p.source.shapeFacts.angles[0].kind = 'acute';}],
        ['wrong shape orientation', p => {p.source.shapeFacts.orientation = 'clockwise';}], ['wrong angle dot', p => {p.source.shapeFacts.angles[0].dotProduct = q(2);}],
        ['fake equal side class', p => {p.source.shapeFacts.equalLengthEdgeGroups = [[0, 1]];}], ['fake parallel pair', p => {p.source.shapeFacts.parallelEdgePairs.push({firstEdgeIndex: 0, secondEdgeIndex: 1});}],
        ['missing cut', p => {p.source.cuts = [];}], ['extra external cut', p => {p.source.cuts.push({...p.source.cuts[0], cutId: 'extra', fromId: 'A', toId: 'B'});}],
        ['same cut twice', p => {p.source.cuts.push({...p.source.cuts[0], cutId: 'again'});}], ['wrong cut adjacency', p => {p.source.cuts[0].adjacentCellIds[1] = 'missing';}],
        ['incomplete sum', p => {p.source.areaSum.pieceIds.pop();}], ['wrong cumulative sum', p => {p.source.areaSum.additions[0].operands[0] = q(4);}],
        ['duplicate sum term', p => {p.assembly.areaSum.pieceIds[1] = p.assembly.areaSum.pieceIds[0];}], ['wrong target total', p => {p.assembly.areaSum.total = q(6);}],
        ['duplicate measure ID', p => {p.measures.push(p.measures[0]);}], ['wrong given length', p => {p.measures[0].value = q(4); p.measures[0].notation.numeral = '4';}],
        ['wrong length spelling', p => {p.measures[0].notation.numeral = '9';}], ['negative factor', p => {p.measures[4].factor = q(-1);}],
        ['negative length', p => {p.measures[0].value = q(-2);}], ['wrong scaled value', p => {p.measures[4].value = q(2);}],
        ['wrong measure arithmetic', p => {p.measures[3].arithmetic.operands[0] = q(4);}], ['missing measure arithmetic', p => {delete p.measures[3].arithmetic;}], ['missing measure dependency', p => {p.measures[3].firstMeasureId = 'missing';}],
        ['measure cycle', p => {p.measures[4].sourceMeasureId = 'height';}], ['unknown measure kind', p => {p.measures[0].kind = 'mystery';}],
        ['copy count zero', p => {p.assembly.copyCount = 0;}], ['huge copy count', p => {p.assembly.copyCount = Number.MAX_SAFE_INTEGER;}],
        ['missing placement', p => {p.assembly.placements.pop();}], ['duplicate source copy', p => {p.assembly.placements[1].sourceCellId = 'left';}],
        ['duplicate placement ID', p => {p.assembly.placements[1].placementId = 'l0';}], ['wrong copy index', p => {p.assembly.placements[0].copyIndex = 2;}],
        ['determinant-one shear', p => {p.assembly.placements[0].transform.matrix[0][1] = q(1);}],
        ['wrong transformed point', p => {p.assembly.placements[2].pointMap[0].targetId = 'A';}], ['incomplete foot map', p => {p.assembly.placements[1].pointMap.pop();}],
        ['duplicate point map source', p => {p.assembly.placements[0].pointMap.push(p.assembly.placements[0].pointMap[0]);}],
        ['wrong placement vertices', p => {p.assembly.placements[0].vertices[0] = 'B';}], ['wrong placement foot', p => {p.assembly.placements[1].heightFootId = 'B';}],
        ['wrong placement area', p => {p.assembly.placements[0].area = q(6);}], ['wrong copy product', p => {p.assembly.copyAreaProduct.result = q(6);}],
        ['wrong normalization', p => {p.assembly.sourceAreaNormalization.operands[1] = q(1);}], ['wrong rectangle dimension', p => {p.assembly.areaDerivation.firstMeasureId = 'b1';}],
        ['opposite rectangle edges', p => {p.measures[4].segment = {fromId: 'C', toId: 'T'};}], ['unknown area derivation', p => {p.assembly.areaDerivation.kind = 'guess';}],
        ['interior rectangle height', p => {p.measures[4].segment = {fromId: 'P', toId: 'Q'};}],
        ['genuine opposite full rectangle edges', p => {p.measures[4].segment = {fromId: 'C', toId: 'T'}; p.measures[4].factor = q(4, 3);
            p.measures[4].value = q(4); p.measures[4].notation = {kind: 'integer', numeral: '4'};
            p.measures[4].arithmetic = {kind: 'binary', operation: 'multiplication', operands: [q(3), q(4, 3)], result: q(4)};}],
        ['wrong context region', p => {p.context.sourceRegionId = 'elsewhere';}], ['unknown context kind', p => {p.context.kind = 'magic';}],
        ['missing source closure', p => {p.context.dimensions.pop();}], ['extra target premise', p => {p.context.dimensions.push({measureId: 'width', meaning: 'base-span'});}],
        ['duplicate dimension', p => {p.context.dimensions.push(p.context.dimensions[0]);}], ['wrong semantic role', p => {p.context.dimensions[0].meaning = 'perpendicular-height';}],
        ['unknown role', p => {p.context.dimensions[0].meaning = 'answer';}],
    ];
    it.each(mutations)('rejects %s independently of the constructor', (_name, change) => {
        expect(valid(changed(build(right()), change))).toBe(false);
    });
    it('rejects unknown, sparse, cyclic and throwing data totally before geometry allocation', () => {
        for (const input of [null, undefined, {}, [], 'area', 0]) expect(valid(input)).toBe(false);
        for (const field of ['points', 'measures']) {
            const problem: Mutable = build(right()); problem[field] = new Array(1000000000); expect(valid(problem)).toBe(false);
        }
        const cyclic: Mutable = build(right()); cyclic.source.cells = [cyclic, cyclic]; expect(valid(cyclic)).toBe(false);
        const accessor = {get kind(): never {throw Error('accessor');}}; expect(valid(accessor)).toBe(false);
        const sparse: Mutable = build(right()); delete sparse.assembly.placements[1]; expect(valid(sparse)).toBe(false);
    });
    it('fails malformed literal input clearly without accepting caller-supplied answers', () => {
        expect(() => build({} as PolygonAreaBuildInput)).toThrow();
        expect(() => build({get source(): never {throw 'non-Error accessor';}} as unknown as PolygonAreaBuildInput)).toThrow('Invalid polygon-area blueprint.');
        for (const change of [
            (p: Mutable) => {p.source.points.push({id: 'A', x: q(8), y: q(3)});},
            (p: Mutable) => {p.source.cells[0].height.footId = 'B';},
            (p: Mutable) => {p.assembly.placements[2].pointMap[0].targetId = 'A';},
            (p: Mutable) => {p.measures[3].operation = 'multiplication';},
            (p: Mutable) => {p.measures[4].factor = q(-1);},
            (p: Mutable) => {p.context.dimensions[0].meaning = 'perpendicular-height';},
        ]) {const input = structuredClone(right()); change(input); expect(() => build(input)).toThrow();}
    });
});
