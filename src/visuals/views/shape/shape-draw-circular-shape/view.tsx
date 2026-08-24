import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeDrawingView} from '../shape-drawing-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {
    ShapeDrawCircularShapeViewConfig,
    ShapeDrawCircularShapeViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeDrawCircularShapeViewConfig;
    payload: ViewRenderPayload<'shape-draw-circular-shape'>;
}

const ShapeDrawCircularShapeCore = ({config: _config, payload}: CoreProps) => (
    <ShapeDrawingView
        expectedFamily="circular"
        payload={payload}
        viewId="shape-draw-circular-shape"
    />
);

export const ShapeDrawCircularShape = withConfig(
    ShapeDrawCircularShapeViewSchema,
    ShapeDrawCircularShapeCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-draw-circular-shape'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeDrawCircularShape payload={payload}/>);
    }
};
