import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isCoordinateAxisDistance} from '../coordinate-metric-helpers.ts';
import {CoordinateDistanceBody} from '../coordinate-metric-view.tsx';
import {CoordinateAxisDistanceViewSchema, type CoordinateAxisDistanceViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-axis-distance';
export const CoordinateAxisDistanceCore = ({payload}: {config: CoordinateAxisDistanceViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axes', 'first', 'second', 'separation', 'absoluteDifference', 'context']);
    if (!isCoordinateAxisDistance(data)) throw new ViewValidationError(VIEW_ID, 'The exact metric geometry, context or distance witnesses are inconsistent.');
    return <CoordinateDistanceBody data={data} story={false} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const CoordinateAxisDistance = withConfig(CoordinateAxisDistanceViewSchema, CoordinateAxisDistanceCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinateAxisDistance payload={payload} />);
};
