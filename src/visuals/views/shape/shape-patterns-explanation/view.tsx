import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapePatternsView} from '../shape-patterns-view.tsx';
import {
    ShapePatternsExplanationViewConfig,
    ShapePatternsExplanationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-patterns-explanation';

interface CoreProps {
    config: ShapePatternsExplanationViewConfig;
    payload: ViewRenderPayload<'shape-patterns-explanation'>;
}

const ShapePatternsExplanationCore = ({payload}: CoreProps) => (
    <ShapePatternsView mode="explain" payload={payload} viewId={VIEW_ID} />
);

export const ShapePatternsExplanation = withConfig(
    ShapePatternsExplanationViewSchema,
    ShapePatternsExplanationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-patterns-explanation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapePatternsExplanation payload={payload} />);
    }
};
