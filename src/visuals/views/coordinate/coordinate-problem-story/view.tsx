import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isCoordinateRoute} from '../coordinate-metric-helpers.ts';
import {CoordinateRouteBody} from '../coordinate-metric-view.tsx';
import {CoordinateProblemStoryViewSchema, type CoordinateProblemStoryViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-problem-story';
export const CoordinateProblemStoryCore = ({payload}: {config: CoordinateProblemStoryViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axes', 'landmarks', 'path', 'legs', 'cumulativeLengths', 'totalLength', 'context']);
    if (!isCoordinateRoute(data)) throw new ViewValidationError(VIEW_ID, 'The exact metric geometry, context or distance witnesses are inconsistent.');
    return <CoordinateRouteBody data={data} story={true} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const CoordinateProblemStory = withConfig(CoordinateProblemStoryViewSchema, CoordinateProblemStoryCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinateProblemStory payload={payload} />);
};
