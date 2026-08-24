import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {RectangleAreaView} from '../shape-rectangle-area-view.tsx';
import {
    ShapeRectangleAreaInversionViewConfig,
    ShapeRectangleAreaInversionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-rectangle-area-inversion';
interface CoreProps {
    config: ShapeRectangleAreaInversionViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <RectangleAreaView payload={payload} task="inversion" useStory={false} viewId={VIEW_ID} />
);
export const ShapeRectangleAreaInversion = withConfig(
    ShapeRectangleAreaInversionViewSchema,
    Core
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeRectangleAreaInversion payload={payload} />);
};
