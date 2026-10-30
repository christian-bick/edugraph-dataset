import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-general-division-interpretation',
    generalLabels: [Ability.Interpretation, Scope.ArabicNumerals, Scope.Base10,
        Scope.Numberline, Scope.BarModel]
};

export const FractionsGeneralDivisionInterpretationViewSchema = {} as const;
export type FractionsGeneralDivisionInterpretationViewConfig = ConfigFromSchema<typeof FractionsGeneralDivisionInterpretationViewSchema>;
