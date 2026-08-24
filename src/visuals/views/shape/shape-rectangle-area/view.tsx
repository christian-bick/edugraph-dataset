import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {RectangleAreaView} from '../shape-rectangle-area-view.tsx';
import {ShapeRectangleAreaViewConfig, ShapeRectangleAreaViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-rectangle-area';
interface CoreProps {
    config: ShapeRectangleAreaViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <RectangleAreaView payload={payload} task="execution" useStory={false} viewId={VIEW_ID} />
);
export const ShapeRectangleArea = withConfig(ShapeRectangleAreaViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeRectangleArea payload={payload} />);
};
