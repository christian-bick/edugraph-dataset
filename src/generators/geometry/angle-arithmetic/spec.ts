import {Ability, Area, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'angle-arithmetic',
    generalLabels: [
        Area.AdjacentAngles,
        Area.AngleCalculation,
        Scope.AngleMeasurement,
        Scope.DegreeScale
    ]
};

export const AngleArithmeticGeneratorSchema = {
    operation: [[Area.Addition, Area.Subtraction], selectExactMatch],
    taskAbility: [[
        Ability.ProcedureUnderstanding,
        Ability.ProcedureExecution,
        Ability.ProcedureInversion
    ], selectExactMatch]
} as const;

export type AngleArithmeticGeneratorConfig = ConfigFromSchema<
    typeof AngleArithmeticGeneratorSchema
>;
