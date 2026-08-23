import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {AreaPerimeterRelationView} from '../area-perimeter-relation-view.tsx';
import {
    AreaPerimeterConstructionViewConfig,
    AreaPerimeterConstructionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'area-perimeter-construction';

interface CoreProps {
    config: AreaPerimeterConstructionViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <AreaPerimeterRelationView mode="construction" payload={payload} viewId={VIEW_ID} />
);

export const AreaPerimeterConstruction = withConfig(
    AreaPerimeterConstructionViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AreaPerimeterConstruction payload={payload} />);
};
