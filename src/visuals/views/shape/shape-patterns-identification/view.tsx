import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapePatternsView} from '../shape-patterns-view.tsx';
import {
    ShapePatternsIdentificationViewConfig,
    ShapePatternsIdentificationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-patterns-identification';

interface CoreProps {
    config: ShapePatternsIdentificationViewConfig;
    payload: ViewRenderPayload<'shape-patterns-identification'>;
}

const ShapePatternsIdentificationCore = ({payload}: CoreProps) => (
    <ShapePatternsView mode="identify" payload={payload} viewId={VIEW_ID} />
);

export const ShapePatternsIdentification = withConfig(
    ShapePatternsIdentificationViewSchema,
    ShapePatternsIdentificationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-patterns-identification'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapePatternsIdentification payload={payload} />);
    }
};
