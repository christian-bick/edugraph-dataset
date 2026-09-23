import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeDrawingView} from '../shape-drawing-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {
    ShapeDrawExcludedQuadrilateralViewConfig,
    ShapeDrawExcludedQuadrilateralViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeDrawExcludedQuadrilateralViewConfig;
    payload: ViewRenderPayload<'shape-draw-excluded-quadrilateral'>;
}

const ShapeDrawExcludedQuadrilateralCore = ({config: _config, payload}: CoreProps) => (
    <ShapeDrawingView mode="exclusions"
        expectedFamily="linear"
        payload={payload}
        viewId="shape-draw-excluded-quadrilateral"
    />
);

export const ShapeDrawExcludedQuadrilateral = withConfig(
    ShapeDrawExcludedQuadrilateralViewSchema,
    ShapeDrawExcludedQuadrilateralCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-draw-excluded-quadrilateral'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeDrawExcludedQuadrilateral payload={payload}/>);
    }
};
