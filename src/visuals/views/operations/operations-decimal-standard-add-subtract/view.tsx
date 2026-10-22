import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidDecimalStandardAddSubtract} from '../decimal-standard-helpers.ts';
import {DecimalStandardAddSubtractBody} from '../decimal-standard-view.tsx';
import {OperationsDecimalStandardAddSubtractViewSchema, type OperationsDecimalStandardAddSubtractViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-decimal-standard-add-subtract';
export const OperationsDecimalStandardAddSubtractCore = ({payload}: {
    config: OperationsDecimalStandardAddSubtractViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ["kind","base","operation","top","bottom","result","alignment","columns"]);
    if (!isValidDecimalStandardAddSubtract(data)) throw new ViewValidationError(VIEW_ID, 'The exact decimal forms or standard-algorithm witness are inconsistent.');
    return <DecimalStandardAddSubtractBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const OperationsDecimalStandardAddSubtract = withConfig(OperationsDecimalStandardAddSubtractViewSchema, OperationsDecimalStandardAddSubtractCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsDecimalStandardAddSubtract payload={payload} />);
};
