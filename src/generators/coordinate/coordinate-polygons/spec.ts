import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const distanceEvidence = [[[], 'geometry-only'], [[Area.CoordinateDistance], 'side-equations']] as const;

export const spec: GeneratorSpec = {generatorId: 'coordinate-polygons', generalLabels: [Area.Polygon, Scope.RationalNumbers]};
export const CoordinatePolygonsGeneratorSchema = {
    signDomain: [[Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives], selectExactLabelMap([
        [Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']
    ] as const)],
    distanceEvidence: [[Area.CoordinateDistance], selectExactLabelSetMap(distanceEvidence), distanceEvidence.map(([labels]) => labels)],
    range: [[Scope.NumbersSmaller20, Scope.NumbersSmaller100], resolveRangeFromLabels]
} as const;
export type CoordinatePolygonsGeneratorConfig = ConfigFromSchema<typeof CoordinatePolygonsGeneratorSchema>;
