import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isCoordinatePoints} from '../rational-coordinate-helpers.ts';
import {CoordinatePlottingBody} from '../rational-coordinate-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {CoordinatePointPlottingViewSchema, type CoordinatePointPlottingViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-point-plotting';
export const CoordinatePointPlottingCore = ({payload}: {config: CoordinatePointPlottingViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axes', 'points']);
    if (!isCoordinatePoints(data)) throw new ViewValidationError(VIEW_ID, 'The exact notation, coordinate scale, location or reflection witnesses are inconsistent.');
    return <CoordinatePlottingBody data={data} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const CoordinatePointPlotting = withConfig(CoordinatePointPlottingViewSchema, CoordinatePointPlottingCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinatePointPlotting payload={payload} />);
};
