import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidRectangularPrismVolume} from '../volume-rectangular-prism-helpers.ts';
import {validateFractionalPrismPresence} from '../fractional-prism-validation.ts';
import {PrismPackingCountBody} from '../fractional-prism-view.tsx';
import {VolumeFractionalPackingCountViewSchema, type VolumeFractionalPackingCountViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'volume-fractional-packing-count';
interface CoreProps {
    config: VolumeFractionalPackingCountViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
export function VolumeFractionalPackingCountCore({payload}: CoreProps) {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, [
        'kind', 'unitId', 'unitCubeEdgeLength', 'dimensions', 'occupiedCells', 'heightLayers',
        'baseAreaSquareUnits', 'cubeCount', 'volumeCubicUnits', 'measuredInput'
    ]);
    validateFractionalPrismPresence(VIEW_ID, data);
    if (!isValidRectangularPrismVolume(data)) throw new ViewValidationError(VIEW_ID, 'Expected exact physical prism measurements and complete cube packing.');
    return <PrismPackingCountBody data={data} isSolutionView={payload.isSolutionView} />;
}
export const VolumeFractionalPackingCountView = withConfig(VolumeFractionalPackingCountViewSchema, VolumeFractionalPackingCountCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<VolumeFractionalPackingCountView payload={payload} />);
};
