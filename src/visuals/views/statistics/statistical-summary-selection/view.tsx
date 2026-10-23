import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {isNumericalDataProblem} from '../../../../generators/statistics/numerical-data-helpers.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {SummarySelectionBody} from '../summary-selection-view.tsx';
import {StatisticalSummarySelectionViewSchema, type StatisticalSummarySelectionViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'statistical-summary-selection';
export const StatisticalSummarySelectionCore = ({payload}: {config: StatisticalSummarySelectionViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'study', 'records', 'summary', 'frequencies', 'plots', 'shapeFacts', 'relations']);
    // The complete guard owns nullable departure facts and valid-empty mathematical arrays.
    if (!isNumericalDataProblem(data)) throw new ViewValidationError(VIEW_ID, 'Expected a coherent numerical study and its complete statistical evidence.');
    return <SummarySelectionBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const StatisticalSummarySelection = withConfig(StatisticalSummarySelectionViewSchema, StatisticalSummarySelectionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<StatisticalSummarySelection payload={payload} />);
};
