import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {shapeConstructionCountsMatch} from '../helpers.ts';
import {LoosePartsAssemblyLayout} from '../shape-construction-components.tsx';
import {ShapeBuildFromPartsViewConfig, ShapeBuildFromPartsViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeBuildFromPartsViewConfig;
    payload: ViewRenderPayload<'shape-build-from-parts'>;
}

const ShapeBuildFromPartsCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData('shape-build-from-parts', problem.data, ['target', 'sides', 'corners']);
    const {target, sides, corners} = problem.data;
    if (!['triangle', 'square', 'rectangle', 'hexagon'].includes(target)
        || !shapeConstructionCountsMatch(target, sides, corners)) {
        throw new ViewValidationError('shape-build-from-parts', 'Expected coherent edge and vertex counts for a supported polygon.');
    }
    return <LoosePartsAssemblyLayout target={target} sides={sides} corners={corners} isSolutionView={isSolutionView} />;
};

export const ShapeBuildFromParts = withConfig(ShapeBuildFromPartsViewSchema, ShapeBuildFromPartsCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'shape-build-from-parts'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeBuildFromParts payload={payload} />);
};
