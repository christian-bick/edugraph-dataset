import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isUnitRateRelation} from '../ratio-language-presentation.ts';
import {UnitRateLanguageBody} from '../ratio-language-view.tsx';
import {UnitRateLanguageViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'unit-rate-language';

export const UnitRateLanguageCore = ({payload}: {payload: ViewRenderPayload<'unit-rate-language'>}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'context', 'antecedent', 'consequent', 'unitRate', 'scaleFactor', 'scaled']);
    if (!isUnitRateRelation(data)) {
        throw new ViewValidationError(VIEW_ID, 'Ordered quantities and exact ratio witnesses must be valid and agree.');
    }
    return <UnitRateLanguageBody data={data} isSolutionView={payload.isSolutionView} />;
};

export const UnitRateLanguage = withConfig(UnitRateLanguageViewSchema, UnitRateLanguageCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'unit-rate-language'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<UnitRateLanguage payload={payload} />);
    }
};
