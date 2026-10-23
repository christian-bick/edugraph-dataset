import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {isNumericalDataProblem} from '../../../../generators/statistics/numerical-data-helpers.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {SummaryMeaningBody} from '../summary-meaning-view.tsx';
import {VariationSummaryInterpretationViewSchema, type VariationSummaryInterpretationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'variation-summary-interpretation';
export const VariationSummaryInterpretationCore = ({payload}: {config: VariationSummaryInterpretationViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    // Nullable departure facts and valid-empty nested evidence arrays belong to the complete guard.
    validateProblemData(VIEW_ID, data, ['kind', 'study', 'records', 'summary', 'frequencies', 'plots', 'shapeFacts', 'relations']);
    if (!isNumericalDataProblem(data)) throw new ViewValidationError(VIEW_ID, 'The complete study, observations, summaries or mathematical evidence is inconsistent.');
    return <SummaryMeaningBody data={data} task="variation" isSolutionView={payload.isSolutionView} />;
};
export const VariationSummaryInterpretation = withConfig(VariationSummaryInterpretationViewSchema, VariationSummaryInterpretationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<VariationSummaryInterpretation payload={payload} />);
};
