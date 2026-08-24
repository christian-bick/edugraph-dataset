import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeDrawingView} from '../shape-drawing-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {
    ShapeDrawLinearShapeViewConfig,
    ShapeDrawLinearShapeViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeDrawLinearShapeViewConfig;
    payload: ViewRenderPayload<'shape-draw-linear-shape'>;
}

const ShapeDrawLinearShapeCore = ({config: _config, payload}: CoreProps) => (
    <ShapeDrawingView
        expectedFamily="linear"
        payload={payload}
        viewId="shape-draw-linear-shape"
    />
);

export const ShapeDrawLinearShape = withConfig(
    ShapeDrawLinearShapeViewSchema,
    ShapeDrawLinearShapeCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-draw-linear-shape'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeDrawLinearShape payload={payload}/>);
    }
};
