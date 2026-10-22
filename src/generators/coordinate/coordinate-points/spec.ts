import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const numberKinds = [
    [[Scope.IntegerNumbers, Scope.RationalNumbers], 'integer'],
    [[Scope.FractionNumbers], 'fraction'],
    [[Scope.DecimalNumbers], 'decimal']
] as const;
const quadrantEvidence = [[[], 'ordinary'], [[Area.Quadrants, Area.SignNotation], 'quadrant-complete']] as const;

export const spec: GeneratorSpec = {
    generatorId: 'coordinate-points',
    generalLabels: [Area.OrderedCoordinatePair],
    compatibility: [generatorLabelRule('coordinate-quadrants-require-signed-domain', [Area.Quadrants, Scope.NumbersWithNegatives],
        selected => !selected(Area.Quadrants) || selected(Scope.NumbersWithNegatives))]
};

export const CoordinatePointsGeneratorSchema = {
    numberKind: [[Scope.IntegerNumbers, Scope.RationalNumbers, Scope.FractionNumbers, Scope.DecimalNumbers],
        selectExactLabelSetMap(numberKinds), numberKinds.map(([labels]) => labels)],
    signDomain: [[Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives], selectExactLabelMap([
        [Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']
    ] as const)],
    quadrantEvidence: [[Area.Quadrants, Area.SignNotation], selectExactLabelSetMap(quadrantEvidence),
        quadrantEvidence.map(([labels]) => labels)]
} as const;

export type CoordinatePointsGeneratorConfig = ConfigFromSchema<typeof CoordinatePointsGeneratorSchema>;
