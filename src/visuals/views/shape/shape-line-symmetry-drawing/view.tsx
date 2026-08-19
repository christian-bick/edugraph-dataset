import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapeLineSymmetryView} from '../shape-line-symmetry-view.tsx';
import {
    ShapeLineSymmetryDrawingViewConfig,
    ShapeLineSymmetryDrawingViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-line-symmetry-drawing';

interface CoreProps {
    config: ShapeLineSymmetryDrawingViewConfig;
    payload: ViewRenderPayload<'shape-line-symmetry-drawing'>;
}

const ShapeLineSymmetryDrawingCore = ({payload}: CoreProps) => (
    <ShapeLineSymmetryView
        mode="draw"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const ShapeLineSymmetryDrawing = withConfig(
    ShapeLineSymmetryDrawingViewSchema,
    ShapeLineSymmetryDrawingCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-line-symmetry-drawing'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeLineSymmetryDrawing payload={payload} />);
    }
};
