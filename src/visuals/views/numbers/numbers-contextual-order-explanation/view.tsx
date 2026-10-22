import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isRationalOrderContext} from '../rational-order-magnitude-helpers.ts';
import {ContextOrderExplanationBody} from '../rational-order-magnitude-view.tsx';
import {NumbersContextualOrderExplanationViewSchema, type NumbersContextualOrderExplanationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-contextual-order-explanation';
export const NumbersContextualOrderExplanationCore = ({payload}: {config: NumbersContextualOrderExplanationViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'context', 'first', 'second', 'relation']);
    if (!isRationalOrderContext(data)) throw new ViewValidationError(VIEW_ID, 'The exact scale, context, ordering or magnitude witnesses are inconsistent.');
    return <ContextOrderExplanationBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const NumbersContextualOrderExplanation = withConfig(NumbersContextualOrderExplanationViewSchema, NumbersContextualOrderExplanationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersContextualOrderExplanation payload={payload} />);
};
