import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidUnitCubeVolume} from '../volume-unit-cube-helpers.ts';
import {VolumeUnitCubeBody} from '../volume-unit-cube-view.tsx';
import {VolumePackingInterpretationViewConfig, VolumePackingInterpretationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'volume-packing-interpretation';

interface CoreProps {
    config: VolumePackingInterpretationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const VolumePackingInterpretationCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'unitId', 'unitCubeEdgeLength', 'bounds', 'occupiedCells', 'cubeCount']);
    if (!isValidUnitCubeVolume(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected a complete, ordered packing of side-one unit cubes.');
    }
    return <VolumeUnitCubeBody data={data} isSolutionView={payload.isSolutionView} task="interpretation" />;
};

export const VolumePackingInterpretationView = withConfig(
    VolumePackingInterpretationViewSchema, VolumePackingInterpretationCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<VolumePackingInterpretationView payload={payload} />);
};
