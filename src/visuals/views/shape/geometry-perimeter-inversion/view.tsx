import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {GeometryPerimeterView} from '../geometry-perimeter-view.tsx';
import {
    GeometryPerimeterInversionViewConfig,
    GeometryPerimeterInversionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'geometry-perimeter-inversion';

interface CoreProps {
    config: GeometryPerimeterInversionViewConfig;
    payload: ViewRenderPayload<'geometry-perimeter-inversion'>;
}

const GeometryPerimeterInversionCore = ({payload}: CoreProps) => (
    <GeometryPerimeterView mode="inversion" payload={payload} viewId={VIEW_ID} />
);

export const GeometryPerimeterInversion = withConfig(
    GeometryPerimeterInversionViewSchema,
    GeometryPerimeterInversionCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'geometry-perimeter-inversion'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<GeometryPerimeterInversion payload={payload} />);
};
