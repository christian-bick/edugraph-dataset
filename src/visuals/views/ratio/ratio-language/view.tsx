import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isRatioRelation} from '../ratio-language-presentation.ts';
import {RatioLanguageBody} from '../ratio-language-view.tsx';
import {RatioLanguageViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'ratio-language';

export const RatioLanguageCore = ({payload}: {payload: ViewRenderPayload<'ratio-language'>}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'antecedent', 'consequent']);
    if (!isRatioRelation(data)) {
        throw new ViewValidationError(VIEW_ID, 'Ordered quantities and exact ratio witnesses must be valid and agree.');
    }
    return <RatioLanguageBody data={data} isSolutionView={payload.isSolutionView} />;
};

export const RatioLanguage = withConfig(RatioLanguageViewSchema, RatioLanguageCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'ratio-language'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<RatioLanguage payload={payload} />);
    }
};
