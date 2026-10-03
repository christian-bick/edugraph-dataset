import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidUnitCubeVolume} from '../volume-unit-cube-helpers.ts';
import {VolumeUnitCubeBody} from '../volume-unit-cube-view.tsx';
import {VolumeUnitCubeCountViewConfig, VolumeUnitCubeCountViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'volume-unit-cube-count';

interface CoreProps {
    config: VolumeUnitCubeCountViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const VolumeUnitCubeCountCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, [
        'kind', 'unitId', 'unitCubeEdgeLength', 'bounds', 'occupiedCells', 'cubeCount'
    ]);
    if (!isValidUnitCubeVolume(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected a complete ordered packing and any counting trace to be exact.');
    }
    return <VolumeUnitCubeBody data={data} isSolutionView={payload.isSolutionView} task="count" />;
};

export const VolumeUnitCubeCountView = withConfig(
    VolumeUnitCubeCountViewSchema, VolumeUnitCubeCountCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<VolumeUnitCubeCountView payload={payload} />);
};
