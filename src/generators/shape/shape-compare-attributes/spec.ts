import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {comparisonTickets} from './numeric-domain.ts';

export const comparisonShapes = [
    [Area.Triangle, 'triangle'], [Area.Square, 'square'], [Area.Rectangle, 'rectangle'],
    [Area.Hexagon, 'hexagon'], [Area.Circle, 'circle'], [Area.Cube, 'cube'],
    [Area.Cone, 'cone'], [Area.Cylinder, 'cylinder'], [Area.Sphere, 'sphere']
] as const;
const shapeLabels = comparisonShapes.map(([label]) => label);
const resolveShape = selectExactLabelMap(comparisonShapes);
const rangeChoices = canonicalRangeProfiles.filter(({range}) =>
    range.min === 0 && [5, 10, 20].includes(range.max)).map(({labels}) => labels);
const rangeLabels = rangeChoices.flat();
const permitsRange = (labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    if (!range || range.min !== 0 || ![5, 10, 20].includes(range.max)) return false;
    const shape = resolveShape(labels);
    return !shape || comparisonTickets(shape, range).length > 0;
};
const resolveRange = withLabelChoices(exactResolver((labels: string[]) =>
    permitsRange(labels) ? resolveCanonicalRangeFromLabels(labels) : undefined),
{kind: 'alternatives', alternatives: rangeChoices, contextLabels: shapeLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'shape-compare-attributes',
    compatibility: [generatorLabelRule('shape-comparison-range', [...shapeLabels, ...rangeLabels], selected =>
        permitsRange([...shapeLabels, ...rangeLabels].filter(selected)))],
    generalLabels: [
        Area.NumericInequality,
        Scope.ShapeAttributes,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const ShapeCompareAttributesGeneratorSchema = {
    shape: [shapeLabels, resolveShape],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type ShapeCompareAttributesGeneratorConfig = ConfigFromSchema<typeof ShapeCompareAttributesGeneratorSchema>;
