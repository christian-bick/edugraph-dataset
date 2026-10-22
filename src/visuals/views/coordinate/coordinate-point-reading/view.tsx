import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isCoordinatePoints} from '../rational-coordinate-helpers.ts';
import {CoordinateReadingBody} from '../rational-coordinate-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {CoordinatePointReadingViewSchema, type CoordinatePointReadingViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-point-reading';
export const CoordinatePointReadingCore = ({payload}: {config: CoordinatePointReadingViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axes', 'points']);
    if (!isCoordinatePoints(data)) throw new ViewValidationError(VIEW_ID, 'The exact notation, coordinate scale, location or reflection witnesses are inconsistent.');
    return <CoordinateReadingBody data={data} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const CoordinatePointReading = withConfig(CoordinatePointReadingViewSchema, CoordinatePointReadingCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinatePointReading payload={payload} />);
};
