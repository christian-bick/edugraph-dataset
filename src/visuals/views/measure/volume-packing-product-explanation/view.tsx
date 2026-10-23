import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidRectangularPrismVolume} from '../volume-rectangular-prism-helpers.ts';
import {RectangularPrismBody} from '../volume-rectangular-prism-view.tsx';
import {FractionalRectangularPrismBody} from '../fractional-prism-view.tsx';
import {validateFractionalPrismPresence} from '../fractional-prism-validation.ts';
import {VolumePackingProductExplanationViewConfig, VolumePackingProductExplanationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'volume-packing-product-explanation';
interface CoreProps {
    config: VolumePackingProductExplanationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const VolumePackingProductExplanationCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, [
        'kind', 'unitId', 'unitCubeEdgeLength', 'dimensions', 'occupiedCells',
        'heightLayers', 'baseAreaSquareUnits', 'cubeCount', 'volumeCubicUnits', 'measuredInput'
    ]);
    validateFractionalPrismPresence(VIEW_ID, data);
    if (!isValidRectangularPrismVolume(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected exact prism dimensions, packing partitions, and products.');
    }
    return data.kind === 'fractional-rectangular-prism-volume'
        ? <FractionalRectangularPrismBody data={data} isSolutionView={payload.isSolutionView} task="packing-explanation" />
        : <RectangularPrismBody data={data} isSolutionView={payload.isSolutionView} task="packing-explanation" />;
};

export const VolumePackingProductExplanationView = withConfig(
    VolumePackingProductExplanationViewSchema, VolumePackingProductExplanationCore
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<VolumePackingProductExplanationView payload={payload} />);
};
