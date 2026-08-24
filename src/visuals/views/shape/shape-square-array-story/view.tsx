import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {UnitSquareGridView} from '../shape-unit-square-grid-view.tsx';
import {ShapeSquareArrayStoryViewConfig, ShapeSquareArrayStoryViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-square-array-story';
interface CoreProps {
    config: ShapeSquareArrayStoryViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <UnitSquareGridView payload={payload} task="execution" useStory viewId={VIEW_ID} />
);
export const ShapeSquareArrayStory = withConfig(ShapeSquareArrayStoryViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeSquareArrayStory payload={payload} />);
};
