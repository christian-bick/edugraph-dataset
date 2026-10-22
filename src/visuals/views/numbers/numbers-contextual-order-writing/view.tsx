import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isRationalOrderContext} from '../rational-order-magnitude-helpers.ts';
import {ContextOrderWritingBody} from '../rational-order-magnitude-view.tsx';
import {NumbersContextualOrderWritingViewSchema, type NumbersContextualOrderWritingViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-contextual-order-writing';
export const NumbersContextualOrderWritingCore = ({payload}: {config: NumbersContextualOrderWritingViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'context', 'first', 'second', 'relation']);
    if (!isRationalOrderContext(data)) throw new ViewValidationError(VIEW_ID, 'The exact scale, context, ordering or magnitude witnesses are inconsistent.');
    return <ContextOrderWritingBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const NumbersContextualOrderWriting = withConfig(NumbersContextualOrderWritingViewSchema, NumbersContextualOrderWritingCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersContextualOrderWriting payload={payload} />);
};
