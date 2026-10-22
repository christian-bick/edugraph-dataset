import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isCoordinatePolygon} from '../coordinate-metric-helpers.ts';
import {CoordinatePolygonConstructionBody} from '../coordinate-metric-view.tsx';
import {CoordinatePolygonConstructionStoryViewSchema, type CoordinatePolygonConstructionStoryViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-polygon-construction-story';
export const CoordinatePolygonConstructionStoryCore = ({payload}: {config: CoordinatePolygonConstructionStoryViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    // An empty selected-proof array is valid; the exact validator checks its presence and contents.
    validateProblemData(VIEW_ID, data, ['kind', 'axes', 'vertices', 'edges', 'alignedSides', 'context']);
    if (!isCoordinatePolygon(data)) throw new ViewValidationError(VIEW_ID, 'The exact metric geometry, context or distance witnesses are inconsistent.');
    return <CoordinatePolygonConstructionBody data={data} story={true} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const CoordinatePolygonConstructionStory = withConfig(CoordinatePolygonConstructionStoryViewSchema, CoordinatePolygonConstructionStoryCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinatePolygonConstructionStory payload={payload} />);
};
