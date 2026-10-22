import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const relationProfiles = [
    [[Area.ZeroConcept, Scope.NumbersWithZero], 'reference-zero'],
    [[Area.SignNotation, Scope.NumbersWithNegatives], 'directed-pair']
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'signed-rational-contexts',
    generalLabels: [Scope.RationalNumbers]
};

export const SignedRationalContextsGeneratorSchema = {
    relation: [
        [Area.ZeroConcept, Scope.NumbersWithZero, Area.SignNotation, Scope.NumbersWithNegatives],
        selectExactLabelSetMap(relationProfiles),
        relationProfiles.map(([labels]) => labels)
    ]
} as const;

export type SignedRationalContextsGeneratorConfig = ConfigFromSchema<typeof SignedRationalContextsGeneratorSchema>;
