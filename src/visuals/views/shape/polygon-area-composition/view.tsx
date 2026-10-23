import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {isPolygonAreaDissectionProblem} from '../../../../generators/shape/polygon-area-helpers.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PolygonAreaBody} from '../polygon-area-view.tsx';
import {PolygonAreaCompositionViewSchema, type PolygonAreaCompositionViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'polygon-area-composition';
export const PolygonAreaCompositionCore = ({payload}: {config: PolygonAreaCompositionViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'points', 'units', 'measures', 'source', 'assembly', 'context']);
    if (!isPolygonAreaDissectionProblem(data)) throw new ViewValidationError(VIEW_ID, 'The exact polygon, partition, measurements or rigid assembly is inconsistent.');
    return <PolygonAreaBody data={data} task="composition" story={false} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const PolygonAreaComposition = withConfig(PolygonAreaCompositionViewSchema, PolygonAreaCompositionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<PolygonAreaComposition payload={payload} />);
};
