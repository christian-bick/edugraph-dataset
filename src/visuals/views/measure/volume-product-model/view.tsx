import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidRectangularPrismVolume} from '../volume-rectangular-prism-helpers.ts';
import {RectangularPrismBody} from '../volume-rectangular-prism-view.tsx';
import {VolumeProductModelViewConfig, VolumeProductModelViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'volume-product-model';
interface CoreProps {
    config: VolumeProductModelViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const VolumeProductModelCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, [
        'kind', 'unitId', 'unitCubeEdgeLength', 'dimensions', 'occupiedCells',
        'heightLayers', 'baseAreaSquareUnits', 'cubeCount', 'volumeCubicUnits', 'measuredInput'
    ]);
    if (!isValidRectangularPrismVolume(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected exact prism dimensions, packing partitions, and products.');
    }
    return <RectangularPrismBody data={data} isSolutionView={payload.isSolutionView} task="product-model" />;
};

export const VolumeProductModelView = withConfig(VolumeProductModelViewSchema, VolumeProductModelCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<VolumeProductModelView payload={payload} />);
};
