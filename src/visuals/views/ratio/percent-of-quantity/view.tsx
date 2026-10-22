import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isPercentQuantity} from '../percent-quantity-presentation.ts';
import {PercentOfQuantityBody} from '../percent-quantity-view.tsx';
import {PercentOfQuantityViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'percent-of-quantity';

export const PercentOfQuantityCore = ({payload}: {payload: ViewRenderPayload<'percent-of-quantity'>}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'percent', 'perHundred', 'scaleFactor', 'whole', 'part']);
    if (!isPercentQuantity(data)) {
        throw new ViewValidationError(VIEW_ID, 'Positive percentages, reduced rational quantities, and their exact scaling witnesses must agree.');
    }
    return <PercentOfQuantityBody data={data} isSolutionView={payload.isSolutionView} />;
};

export const PercentOfQuantity = withConfig(PercentOfQuantityViewSchema, PercentOfQuantityCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'percent-of-quantity'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<PercentOfQuantity payload={payload} />);
};
