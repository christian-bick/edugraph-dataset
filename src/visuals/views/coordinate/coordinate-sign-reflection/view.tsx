import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isCoordinateReflection} from '../rational-coordinate-helpers.ts';
import {CoordinateReflectionBody} from '../rational-coordinate-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {CoordinateSignReflectionViewSchema, type CoordinateSignReflectionViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-sign-reflection';
export const CoordinateSignReflectionCore = ({payload}: {config: CoordinateSignReflectionViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axes', 'original', 'steps']);
    if (!isCoordinateReflection(data)) throw new ViewValidationError(VIEW_ID, 'The exact notation, coordinate scale, location or reflection witnesses are inconsistent.');
    return <CoordinateReflectionBody data={data} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const CoordinateSignReflection = withConfig(CoordinateSignReflectionViewSchema, CoordinateSignReflectionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinateSignReflection payload={payload} />);
};
