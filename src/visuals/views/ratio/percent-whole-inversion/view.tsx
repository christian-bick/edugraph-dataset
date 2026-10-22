import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isPercentQuantity} from '../percent-quantity-presentation.ts';
import {PercentWholeInversionBody} from '../percent-quantity-view.tsx';
import {PercentWholeInversionViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'percent-whole-inversion';

export const PercentWholeInversionCore = ({payload}: {payload: ViewRenderPayload<'percent-whole-inversion'>}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'percent', 'perHundred', 'scaleFactor', 'whole', 'part']);
    if (!isPercentQuantity(data)) {
        throw new ViewValidationError(VIEW_ID, 'Positive percentages, reduced rational quantities, and their exact scaling witnesses must agree.');
    }
    return <PercentWholeInversionBody data={data} isSolutionView={payload.isSolutionView} />;
};

export const PercentWholeInversion = withConfig(PercentWholeInversionViewSchema, PercentWholeInversionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'percent-whole-inversion'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<PercentWholeInversion payload={payload} />);
};
