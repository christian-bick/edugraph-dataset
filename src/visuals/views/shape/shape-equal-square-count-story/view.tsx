import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {EqualSquareView} from '../shape-equal-square-view.tsx';
import {
    ShapeEqualSquareCountStoryViewConfig,
    ShapeEqualSquareCountStoryViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-equal-square-count-story';
interface CoreProps {
    config: ShapeEqualSquareCountStoryViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <EqualSquareView payload={payload} task="count" useStory viewId={VIEW_ID} />
);
export const ShapeEqualSquareCountStory = withConfig(
    ShapeEqualSquareCountStoryViewSchema,
    Core
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeEqualSquareCountStory payload={payload} />);
};
