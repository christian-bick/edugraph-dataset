import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-name-writing',
    generalLabels: [Ability.TextualArticulation]
};

export const NumbersDecimalNameWritingViewSchema = {} as const;
export type NumbersDecimalNameWritingViewConfig = ConfigFromSchema<
    typeof NumbersDecimalNameWritingViewSchema
>;
