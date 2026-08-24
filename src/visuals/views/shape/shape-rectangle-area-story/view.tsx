import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {RectangleAreaView} from '../shape-rectangle-area-view.tsx';
import {ShapeRectangleAreaStoryViewConfig, ShapeRectangleAreaStoryViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-rectangle-area-story';
interface CoreProps {
    config: ShapeRectangleAreaStoryViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <RectangleAreaView payload={payload} task="execution" useStory viewId={VIEW_ID} />
);
export const ShapeRectangleAreaStory = withConfig(ShapeRectangleAreaStoryViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeRectangleAreaStory payload={payload} />);
};
