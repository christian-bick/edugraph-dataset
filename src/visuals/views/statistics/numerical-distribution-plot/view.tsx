import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isNumericalDataProblem} from '../../../../generators/statistics/numerical-data-helpers.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumericalDistributionConstruction} from '../numerical-distribution-construction-view.tsx';
import {NumericalDistributionPlotViewSchema, type NumericalDistributionPlotViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numerical-distribution-plot';
export const NumericalDistributionPlotCore = ({config, payload}: {config: NumericalDistributionPlotViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data, plot = config.plot;
    validateProblemData(VIEW_ID, data, ['kind', 'study', 'records', 'summary', 'frequencies', 'plots', 'shapeFacts', 'relations']);
    // Nullable departure facts and valid-empty memberships are delegated to the complete model guard.
    if (!isNumericalDataProblem(data) || (plot !== 'line-plot' && plot !== 'histogram' && plot !== 'box-plot')) {
        throw new ViewValidationError(VIEW_ID, 'Expected complete coherent numerical data and one resolved display convention.');
    }
    return <NumericalDistributionConstruction data={data} plot={plot} isSolutionView={payload.isSolutionView} />;
};
export const NumericalDistributionPlot = withConfig(NumericalDistributionPlotViewSchema, NumericalDistributionPlotCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumericalDistributionPlot payload={payload} />);
};
