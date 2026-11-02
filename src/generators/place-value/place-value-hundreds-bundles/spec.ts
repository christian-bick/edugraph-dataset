import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {hundredsBundleRangeChoices, hundredsBundleRangeLabels, resolveHundredsBundleRange} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-hundreds-bundles',
    compatibility: [generatorLabelRule('hundreds-regrouping-range',
        [Area.IntegerRegrouping, ...hundredsBundleRangeLabels], selected =>
            resolveHundredsBundleRange([Area.IntegerRegrouping, ...hundredsBundleRangeLabels].filter(selected)) !== undefined)],
    generalLabels: [
        Area.PlaceValue,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.MultiplesOf100,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const PlaceValueHundredsBundlesGeneratorSchema = {
    requireRegrouping: [[Area.IntegerRegrouping], hasLabel(Area.IntegerRegrouping)],
    range: [hundredsBundleRangeLabels, resolveHundredsBundleRange, hundredsBundleRangeChoices]
} as const;

export type PlaceValueHundredsBundlesGeneratorConfig = ConfigFromSchema<typeof PlaceValueHundredsBundlesGeneratorSchema>;
