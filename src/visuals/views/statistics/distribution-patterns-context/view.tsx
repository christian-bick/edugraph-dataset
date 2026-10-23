import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {isNumericalDataProblem} from '../../../../generators/statistics/numerical-data-helpers.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumericalDistributionBody} from '../numerical-distribution-view.tsx';
import {DistributionPatternsContextViewSchema, type DistributionPatternsContextViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'distribution-patterns-context';
export const DistributionPatternsContextCore = ({payload}: {config: DistributionPatternsContextViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    // Nullable departureFacts and valid-empty evidence arrays belong to the complete guard.
    validateProblemData(VIEW_ID, data, ['kind', 'study', 'records', 'summary', 'frequencies', 'plots', 'shapeFacts', 'relations']);
    if (!isNumericalDataProblem(data)) throw new ViewValidationError(VIEW_ID, 'The study, complete records, summaries, display or mathematical evidence is inconsistent.');
    return <NumericalDistributionBody data={data} task="patterns" isSolutionView={payload.isSolutionView} />;
};
export const DistributionPatternsContext = withConfig(DistributionPatternsContextViewSchema, DistributionPatternsContextCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DistributionPatternsContext payload={payload} />);
};
