import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidCoordinateSystem} from '../coordinate-system-helpers.ts';
import {CoordinateSystemBody} from '../coordinate-system-view.tsx';
import {
    CoordinateComponentsInterpretationViewConfig,
    CoordinateComponentsInterpretationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-components-interpretation';
interface CoreProps {
    config: CoordinateComponentsInterpretationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const CoordinateComponentsInterpretationCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'origin', 'rightAngleDegrees', 'axes', 'travel']);
    if (!isValidCoordinateSystem(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected perpendicular named axes, exact uniform scales, and travel on displayed ticks.');
    }
    return <CoordinateSystemBody data={data} isSolutionView={payload.isSolutionView} task="component-interpretation" />;
};

export const CoordinateComponentsInterpretationView = withConfig(
    CoordinateComponentsInterpretationViewSchema, CoordinateComponentsInterpretationCore
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinateComponentsInterpretationView payload={payload} />);
};
