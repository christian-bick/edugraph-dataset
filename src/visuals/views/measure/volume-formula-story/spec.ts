import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-formula-story',
    generalLabels: [Ability.ProcedureExecution, Ability.TextualReception],
    compatibility: [requireTargetLabels('prism-volume-story-request', [Ability.TextualReception])]
};

export const VolumeFormulaStoryViewSchema = {} as const;
export type VolumeFormulaStoryViewConfig = ConfigFromSchema<typeof VolumeFormulaStoryViewSchema>;
