import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidDecimalStandardDivision} from '../decimal-standard-helpers.ts';
import {DecimalStandardDivisionBody} from '../decimal-standard-view.tsx';
import {OperationsDecimalStandardDivisionViewSchema, type OperationsDecimalStandardDivisionViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-decimal-standard-division';
export const OperationsDecimalStandardDivisionCore = ({payload}: {
    config: OperationsDecimalStandardDivisionViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ["kind","base","dividend","divisor","quotient","normalization","sourceDigits","decimalIndex","quotientStartColumn","quotientDigits","steps"]);
    if (!isValidDecimalStandardDivision(data)) throw new ViewValidationError(VIEW_ID, 'The exact decimal forms or standard-algorithm witness are inconsistent.');
    return <DecimalStandardDivisionBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const OperationsDecimalStandardDivision = withConfig(OperationsDecimalStandardDivisionViewSchema, OperationsDecimalStandardDivisionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsDecimalStandardDivision payload={payload} />);
};
