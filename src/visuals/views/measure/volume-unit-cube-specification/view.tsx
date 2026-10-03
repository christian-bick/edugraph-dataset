import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidUnitCubeVolume} from '../volume-unit-cube-helpers.ts';
import {VolumeUnitCubeBody} from '../volume-unit-cube-view.tsx';
import {VolumeUnitCubeSpecificationViewConfig, VolumeUnitCubeSpecificationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'volume-unit-cube-specification';

interface CoreProps {
    config: VolumeUnitCubeSpecificationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const VolumeUnitCubeSpecificationCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'unitId', 'unitCubeEdgeLength', 'bounds', 'occupiedCells', 'cubeCount']);
    if (!isValidUnitCubeVolume(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected a complete, ordered packing of side-one unit cubes.');
    }
    return <VolumeUnitCubeBody data={data} isSolutionView={payload.isSolutionView} task="specification" />;
};

export const VolumeUnitCubeSpecificationView = withConfig(
    VolumeUnitCubeSpecificationViewSchema, VolumeUnitCubeSpecificationCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<VolumeUnitCubeSpecificationView payload={payload} />);
};
