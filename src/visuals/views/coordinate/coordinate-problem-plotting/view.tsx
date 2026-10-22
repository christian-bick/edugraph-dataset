import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isCoordinateRoute} from '../coordinate-metric-helpers.ts';
import {CoordinateRouteBody} from '../coordinate-metric-view.tsx';
import {CoordinateProblemPlottingViewSchema, type CoordinateProblemPlottingViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-problem-plotting';
export const CoordinateProblemPlottingCore = ({payload}: {config: CoordinateProblemPlottingViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axes', 'landmarks', 'path', 'legs', 'cumulativeLengths', 'totalLength', 'context']);
    if (!isCoordinateRoute(data)) throw new ViewValidationError(VIEW_ID, 'The exact metric geometry, context or distance witnesses are inconsistent.');
    return <CoordinateRouteBody data={data} story={false} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const CoordinateProblemPlotting = withConfig(CoordinateProblemPlottingViewSchema, CoordinateProblemPlottingCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinateProblemPlotting payload={payload} />);
};
