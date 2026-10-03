import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidCoordinateSystem} from '../coordinate-system-helpers.ts';
import {CoordinateSystemBody} from '../coordinate-system-view.tsx';
import {
    CoordinateSystemSpecificationViewConfig,
    CoordinateSystemSpecificationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-system-specification';
interface CoreProps {
    config: CoordinateSystemSpecificationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const CoordinateSystemSpecificationCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'origin', 'rightAngleDegrees', 'axes', 'travel']);
    if (!isValidCoordinateSystem(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected perpendicular named axes, exact uniform scales, and travel on displayed ticks.');
    }
    return <CoordinateSystemBody data={data} isSolutionView={payload.isSolutionView} task="specification" />;
};

export const CoordinateSystemSpecificationView = withConfig(
    CoordinateSystemSpecificationViewSchema, CoordinateSystemSpecificationCore
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinateSystemSpecificationView payload={payload} />);
};
