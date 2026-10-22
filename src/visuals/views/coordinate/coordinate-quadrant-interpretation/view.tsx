import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isCoordinatePoints} from '../rational-coordinate-helpers.ts';
import {CoordinateQuadrantBody} from '../rational-coordinate-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {CoordinateQuadrantInterpretationViewSchema, type CoordinateQuadrantInterpretationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-quadrant-interpretation';
export const CoordinateQuadrantInterpretationCore = ({payload}: {config: CoordinateQuadrantInterpretationViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axes', 'points']);
    if (!isCoordinatePoints(data)) throw new ViewValidationError(VIEW_ID, 'The exact notation, coordinate scale, location or reflection witnesses are inconsistent.');
    return <CoordinateQuadrantBody data={data} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const CoordinateQuadrantInterpretation = withConfig(CoordinateQuadrantInterpretationViewSchema, CoordinateQuadrantInterpretationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinateQuadrantInterpretation payload={payload} />);
};
