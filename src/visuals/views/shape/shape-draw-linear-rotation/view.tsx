import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeDrawingView} from '../shape-drawing-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {
    ShapeDrawLinearRotationViewConfig,
    ShapeDrawLinearRotationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeDrawLinearRotationViewConfig;
    payload: ViewRenderPayload<'shape-draw-linear-rotation'>;
}

const ShapeDrawLinearRotationCore = ({config: _config, payload}: CoreProps) => (
    <ShapeDrawingView mode="rotation"
        expectedFamily="linear"
        payload={payload}
        viewId="shape-draw-linear-rotation"
    />
);

export const ShapeDrawLinearRotation = withConfig(
    ShapeDrawLinearRotationViewSchema,
    ShapeDrawLinearRotationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-draw-linear-rotation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeDrawLinearRotation payload={payload}/>);
    }
};
