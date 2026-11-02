import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {ShapeCompareAttributesProblem, ShapeComparisonAttribute, ShapeComparisonName} from '../../../types/problems.ts';

type ShapeDefinition = {
    dimension: ShapeCompareAttributesProblem['dimension'];
    counts: Partial<Record<ShapeComparisonAttribute, number>>;
};

const definitions: Readonly<Record<ShapeComparisonName, ShapeDefinition>> = {
    triangle: {dimension: '2d', counts: {sides: 3, vertices: 3}},
    square: {dimension: '2d', counts: {sides: 4, vertices: 4}},
    rectangle: {dimension: '2d', counts: {sides: 4, vertices: 4}},
    hexagon: {dimension: '2d', counts: {sides: 6, vertices: 6}},
    circle: {dimension: '2d', counts: {sides: 0, vertices: 0}},
    cube: {dimension: '3d', counts: {faces: 6, vertices: 8, edges: 12}},
    cone: {dimension: '3d', counts: {faces: 1, vertices: 1, edges: 1}},
    cylinder: {dimension: '3d', counts: {faces: 2, vertices: 0, edges: 2}},
    sphere: {dimension: '3d', counts: {faces: 0, vertices: 0, edges: 0}}
};
const attributes = {
    '2d': ['sides', 'vertices'],
    '3d': ['faces', 'vertices', 'edges']
} as const;

export const comparisonRanges = [5, 10, 20].map(upper => createCanonicalNumericRange(upper));

/** Tickets retain uniform attributes followed by uniform unequal partners, conditioned on the band. */
export function comparisonTickets(shape: ShapeComparisonName, range?: CanonicalNumericRange): readonly ShapeCompareAttributesProblem[] {
    const definition = definitions[shape];
    if (!definition) return [];
    return attributes[definition.dimension].flatMap(attribute => {
        const count = definition.counts[attribute]!;
        const partners = (Object.keys(definitions) as ShapeComparisonName[]).filter(candidate =>
            candidate !== shape && definitions[candidate].dimension === definition.dimension
            && definitions[candidate].counts[attribute] !== count);
        return partners.flatMap(partner => {
            const otherCount = definitions[partner].counts[attribute]!;
            if (range && !hasCanonicalRangeWitness([count, otherCount], range)) return [];
            const frame: ShapeCompareAttributesProblem = {
                dimension: definition.dimension, attribute,
                shapes: [{shape, count}, {shape: partner, count: otherCount}],
                relation: 'more', answer: count > otherCount ? shape : partner
            };
            // Every original partner pool has two, three or four members.
            return Array.from({length: 12 / partners.length}, () => frame);
        });
    });
}
