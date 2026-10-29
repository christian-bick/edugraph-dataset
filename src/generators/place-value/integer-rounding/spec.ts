import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {endpointContext, hasEndpointProfile, resolveZeroEndpoint, roundingPlaces} from './endpoint-profile.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec<typeof IntegerRoundingGeneratorSchema> = {
    generatorId: 'integer-rounding',
    compatibility: [generatorLabelRule('rounding-endpoint-availability', [
        Scope.NumbersWithZero, Scope.NumbersWithoutZero, ...endpointContext
    ], selected => {
        const zero = selected(Scope.NumbersWithZero), positive = selected(Scope.NumbersWithoutZero);
        if (zero === positive) return false;
        const magnitude = roundingPlaces.find(([label]) => selected(label));
        return !!magnitude && hasEndpointProfile(resolveRangeFromLabels(endpointContext.filter(label => selected(label))),
            magnitude[1], zero);
    })],
    generalLabels: [
        Area.IntegerRounding,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const IntegerRoundingGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ],
    roundingMagnitude: [
        Scope.StepsOf10,
        Scope.StepsOf100,
        Scope.StepsOf1000,
        Scope.StepsOf10000,
        Scope.StepsOf100000
    ],
    zeroEndpoint: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        resolveZeroEndpoint,
        [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]
    ]
} as const;

export type IntegerRoundingGeneratorConfig = ConfigFromSchema<
    typeof IntegerRoundingGeneratorSchema
>;
