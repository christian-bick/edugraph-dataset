import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {GeometryPerimeterView} from '../geometry-perimeter-view.tsx';
import {GeometryPerimeterViewConfig, GeometryPerimeterViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'geometry-perimeter';

interface CoreProps {
    config: GeometryPerimeterViewConfig;
    payload: ViewRenderPayload<'geometry-perimeter'>;
}

const GeometryPerimeterCore = ({payload}: CoreProps) => (
    <GeometryPerimeterView mode="execution" payload={payload} viewId={VIEW_ID} />
);

export const GeometryPerimeter = withConfig(
    GeometryPerimeterViewSchema,
    GeometryPerimeterCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'geometry-perimeter'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<GeometryPerimeter payload={payload} />);
};
