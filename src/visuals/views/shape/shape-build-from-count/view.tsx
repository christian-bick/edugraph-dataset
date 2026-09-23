import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapeConstructionView} from '../shape-construction-view.tsx';
import {ShapeBuildFromCountViewConfig, ShapeBuildFromCountViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const Core = ({payload}: {config: ShapeBuildFromCountViewConfig; payload: ViewRenderPayload<'shape-build-from-count'>}) =>
    <ShapeConstructionView payload={payload} />;
export const ShapeBuildFromCount = withConfig(ShapeBuildFromCountViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'shape-build-from-count'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeBuildFromCount payload={payload} />);
    }
};
