import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isRationalMagnitudeContext} from '../rational-order-magnitude-helpers.ts';
import {OrderVersusMagnitudeBody} from '../rational-order-magnitude-view.tsx';
import {NumbersOrderVersusMagnitudeViewSchema, type NumbersOrderVersusMagnitudeViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-order-versus-magnitude';
export const NumbersOrderVersusMagnitudeCore = ({payload}: {config: NumbersOrderVersusMagnitudeViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'context', 'first', 'second', 'signedRelation', 'magnitudeRelation']);
    if (!isRationalMagnitudeContext(data)) throw new ViewValidationError(VIEW_ID, 'The exact scale, context, ordering or magnitude witnesses are inconsistent.');
    return <OrderVersusMagnitudeBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const NumbersOrderVersusMagnitude = withConfig(NumbersOrderVersusMagnitudeViewSchema, NumbersOrderVersusMagnitudeCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersOrderVersusMagnitude payload={payload} />);
};
