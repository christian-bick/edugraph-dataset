import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidContextualCoordinate} from '../coordinate-context-helpers.ts';
import {CoordinateContextBody} from '../coordinate-context-view.tsx';
import {CoordinateContextInterpretationViewConfig, CoordinateContextInterpretationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-context-interpretation';
interface CoreProps {
    config: CoordinateContextInterpretationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const CoordinateContextInterpretationCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'situation', 'locations', 'referenceLocationId']);
    if (!isValidContextualCoordinate(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected a consistent park map and three distinct first-quadrant landmarks.');
    }
    return <CoordinateContextBody data={data} isSolutionView={payload.isSolutionView} task="interpret" />;
};

export const CoordinateContextInterpretationView = withConfig(
    CoordinateContextInterpretationViewSchema, CoordinateContextInterpretationCore
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinateContextInterpretationView payload={payload} />);
};
