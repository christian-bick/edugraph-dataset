import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'rational-magnitude-contexts',
    generalLabels: [Area.AbsoluteNumberMagnitude, Scope.RationalNumbers, Area.Inequality]
};

export const RationalMagnitudeContextsGeneratorSchema = {
    signDomain: [[Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives], selectExactLabelMap([
        [Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']
    ] as const)]
} as const;

export type RationalMagnitudeContextsGeneratorConfig = ConfigFromSchema<typeof RationalMagnitudeContextsGeneratorSchema>;
