import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapePatternsView} from '../shape-patterns-view.tsx';
import {ShapePatternsViewConfig, ShapePatternsViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-patterns';

interface CoreProps {
    config: ShapePatternsViewConfig;
    payload: ViewRenderPayload<'shape-patterns'>;
}

const ShapePatternsCore = ({payload}: CoreProps) => (
    <ShapePatternsView mode="generate" payload={payload} viewId={VIEW_ID} />
);

export const ShapePatterns = withConfig(ShapePatternsViewSchema, ShapePatternsCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-patterns'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapePatterns payload={payload} />);
    }
};
