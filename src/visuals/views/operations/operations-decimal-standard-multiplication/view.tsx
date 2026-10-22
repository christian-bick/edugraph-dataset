import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidDecimalStandardMultiplication} from '../decimal-standard-helpers.ts';
import {DecimalStandardMultiplicationBody} from '../decimal-standard-view.tsx';
import {OperationsDecimalStandardMultiplicationViewSchema, type OperationsDecimalStandardMultiplicationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-decimal-standard-multiplication';
export const OperationsDecimalStandardMultiplicationCore = ({payload}: {
    config: OperationsDecimalStandardMultiplicationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ["kind","base","multiplicand","multiplier","multiplicandDigits","multiplierDigits","product","unscaledProduct","partialRows","sumColumns","decimalPlacement"]);
    if (!isValidDecimalStandardMultiplication(data)) throw new ViewValidationError(VIEW_ID, 'The exact decimal forms or standard-algorithm witness are inconsistent.');
    return <DecimalStandardMultiplicationBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const OperationsDecimalStandardMultiplication = withConfig(OperationsDecimalStandardMultiplicationViewSchema, OperationsDecimalStandardMultiplicationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsDecimalStandardMultiplication payload={payload} />);
};
