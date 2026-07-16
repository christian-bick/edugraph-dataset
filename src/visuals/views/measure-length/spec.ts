import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'measure-length',
    supportedLabels: [
        Area.Measurement,
        Scope.ArabicNumerals,
        Ability.VisualReception,
        Ability.VisualArticulation
    ]
};
