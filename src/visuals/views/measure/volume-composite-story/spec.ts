import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-composite-story',
    generalLabels: [Ability.ProcedureExecution, Ability.TextualReception],
    compatibility: [requireTargetLabels('composite-prism-story-request', [Ability.TextualReception])]
};

export const VolumeCompositeStoryViewSchema = {} as const;
export type VolumeCompositeStoryViewConfig = ConfigFromSchema<typeof VolumeCompositeStoryViewSchema>;
