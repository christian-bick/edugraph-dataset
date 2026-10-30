import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const relationProfiles = [
    [[Area.Zero, Scope.NumbersWithZero, Scope.NumbersWithoutNegatives], 'reference-zero'],
    [[Area.SignNotation, Scope.NumbersWithNegatives], 'directed-pair']
] as const;
const canonicalProfiles = relationProfiles.map(([labels, value]) => [
    value === 'directed-pair' ? [...labels, Scope.NumbersWithoutZero] : labels, value
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'signed-rational-contexts',
    generalLabels: [Scope.RationalNumbers]
};

export const SignedRationalContextsGeneratorSchema = {
    relation: [
        [Area.Zero, Scope.NumbersWithZero, Scope.NumbersWithoutNegatives, Area.SignNotation, Scope.NumbersWithNegatives,
            Scope.NumbersWithoutZero],
        selectExactLabelSetMap([...canonicalProfiles, relationProfiles[1]]),
        canonicalProfiles.map(([labels]) => labels)
    ]
} as const;

export type SignedRationalContextsGeneratorConfig = ConfigFromSchema<typeof SignedRationalContextsGeneratorSchema>;
