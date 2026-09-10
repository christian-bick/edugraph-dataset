import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'angle-arc-fraction',
    generalLabels: [Area.AngleConcept, Area.RayConcept, Area.ArchConcept, Area.Circle,
        Scope.UnitFractions, Scope.DegreeScale]
};

export const AngleArcFractionGeneratorSchema = {
    denominator: [
        [Scope.SixthFractions, Scope.QuarterFractions, Scope.ThirdFractions, Scope.HalfFractions],
        selectExactLabelMap([
            [Scope.SixthFractions, 6], [Scope.QuarterFractions, 4],
            [Scope.ThirdFractions, 3], [Scope.HalfFractions, 2]
        ])
    ]
} as const;
export type AngleArcFractionGeneratorConfig = ConfigFromSchema<typeof AngleArcFractionGeneratorSchema>;
