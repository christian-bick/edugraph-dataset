import {GeneratorValidationError} from '../../lib/errors.ts';
import type {NetPlanarFace, PolyhedralNetProblem} from '../../types/problems.ts';
import {affineCoefficientArithmetic, affineScalar} from '../algebra/algebra-affine-helpers.ts';
import {buildNetFaceMeasure, buildPolyhedralNetGeometry, type NetFaceGeometry,
    type PolyhedralNetGeometryInput} from './polyhedral-net-geometry-helpers.ts';
import {isPolyhedralNetProblem} from './polyhedral-net-validation.ts';

export {isPolyhedralNetProblem} from './polyhedral-net-validation.ts';
export type PolyhedralNetRelation = 'boundary-incidence' | 'surface-additivity';
export type NetFaceBlueprint = NetFaceGeometry & Readonly<{baseEdgeIndex: number; adjacentEdgeIndex?: number}>;
export type PolyhedralNetBuildInput = Omit<PolyhedralNetGeometryInput, 'planarFaces'> & Readonly<{
    unit: PolyhedralNetProblem['unit'];
    context: PolyhedralNetProblem['context'];
    planarFaces: readonly [NetFaceBlueprint, ...NetFaceBlueprint[]];
    mathematicalRelation: PolyhedralNetRelation;
}>;

const fail = (message: string): never => {throw new GeneratorValidationError('polyhedral-nets', message);};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Build complete exact certificates from a literal source/sheet blueprint, without entropy. */
export function buildPolyhedralNetProblem(input: PolyhedralNetBuildInput): PolyhedralNetProblem {
    if (!record(input) || !record(input.unit) || !record(input.context)
        || !(input.unit.length === 'centimeters' && input.unit.area === 'square-centimeters'
            || input.unit.length === 'meters' && input.unit.area === 'square-meters')
        || !['closed-carton', 'closed-solid-model'].includes(input.context.kind) || input.context.boundary !== 'all-external-faces'
        || !['boundary-incidence', 'surface-additivity'].includes(input.mathematicalRelation)) {
        return fail('Expected coherent original length/area units, closed-surface context and a mathematical relation.');
    }
    const geometry = buildPolyhedralNetGeometry(input);
    const descriptors = new Map(input.planarFaces.map((face: NetFaceBlueprint) => [face.faceId, face]));
    const faces = geometry.net.faces.map((face: NetFaceGeometry): NetPlanarFace => {
        const descriptor = descriptors.get(face.faceId);
        if (!descriptor) return fail('Every original face requires a measured base descriptor.');
        return {...face, measure: buildNetFaceMeasure(face, descriptor.baseEdgeIndex, descriptor.adjacentEdgeIndex)};
    });
    const first = faces[0];
    if (!first || faces.length !== descriptors.size) return fail('Expected unique complete source face descriptors.');
    const completeFaces = [first, ...faces.slice(1)] as const;
    // Boundary incidence does not store prefixes: keep those hidden values wide,
    // reducing each step, and impose safe storage only on the final total.
    let numerator = 0n, denominator = 1n;
    for (const face of completeFaces) {
        const area = face.measure.area;
        numerator = numerator * BigInt(area.denominator) + BigInt(area.numerator) * denominator;
        denominator *= BigInt(area.denominator);
        let gcd = numerator, divisor = denominator;
        while (divisor !== 0n) [gcd, divisor] = [divisor, gcd % divisor];
        numerator /= gcd; denominator /= gcd;
    }
    const surfaceArea = affineScalar(numerator, denominator);
    let prefix = {numerator: 0, denominator: 1};
    const additions = input.mathematicalRelation === 'surface-additivity' ? completeFaces.map(face => {
        const arithmetic = affineCoefficientArithmetic('addition', prefix, face.measure.area);
        prefix = arithmetic.result;
        return {faceId: face.faceId, arithmetic};
    }) : [];
    const data: PolyhedralNetProblem = {
        kind: 'polyhedral-net-relations', solidKind: geometry.solidKind,
        unit: {length: input.unit.length, area: input.unit.area},
        context: {kind: input.context.kind, boundary: input.context.boundary},
        solid: geometry.solid, net: {...geometry.net, faces: completeFaces}, surfaceArea,
        surfaceAdditivity: additions
    };
    if (!isPolyhedralNetProblem(data)) return fail('The supplied blueprint does not establish a coherent exact closed-solid net.');
    return data;
}
