import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {prismFormulaEvidence} from '../fractional-prism-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'volume-formula-execution',
    generalLabels: [Ability.ProcedureExecution],
    compatibility: [
        requireTargetLabels('prism-volume-formula-request', [Area.Equation]),
        prismFormulaEvidence
    ]
};

export const VolumeFormulaExecutionViewSchema = {} as const;
export type VolumeFormulaExecutionViewConfig = ConfigFromSchema<typeof VolumeFormulaExecutionViewSchema>;
