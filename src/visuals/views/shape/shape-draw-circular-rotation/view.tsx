import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeDrawingView} from '../shape-drawing-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {
    ShapeDrawCircularRotationViewConfig,
    ShapeDrawCircularRotationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeDrawCircularRotationViewConfig;
    payload: ViewRenderPayload<'shape-draw-circular-rotation'>;
}

const ShapeDrawCircularRotationCore = ({config: _config, payload}: CoreProps) => (
    <ShapeDrawingView mode="rotation"
        expectedFamily="circular"
        payload={payload}
        viewId="shape-draw-circular-rotation"
    />
);

export const ShapeDrawCircularRotation = withConfig(
    ShapeDrawCircularRotationViewSchema,
    ShapeDrawCircularRotationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-draw-circular-rotation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeDrawCircularRotation payload={payload}/>);
    }
};
