import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {generatorId: 'rational-magnitude-relations', generalLabels: [Area.AbsoluteNumberMagnitude, Scope.RationalNumbers]};
export const RationalMagnitudeRelationsGeneratorSchema = {
    signDomain: [[Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives], selectExactLabelMap([
        [Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']
    ] as const), [[Scope.NumbersWithoutNegatives], [Scope.NumbersWithNegatives]]]
} as const;
export type RationalMagnitudeRelationsGeneratorConfig = ConfigFromSchema<typeof RationalMagnitudeRelationsGeneratorSchema>;
