import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-name',
    generalLabels: [
        Ability.TextualArticulation
    ]
};

export const NumbersWriteNameViewSchema = {} as const;

export type NumbersWriteNameViewConfig = ConfigFromSchema<typeof NumbersWriteNameViewSchema>;
