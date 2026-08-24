import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {EqualSquareView} from '../shape-equal-square-view.tsx';
import {ShapeEqualSquareCountViewConfig, ShapeEqualSquareCountViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-equal-square-count';
interface CoreProps {
    config: ShapeEqualSquareCountViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <EqualSquareView payload={payload} task="count" useStory={false} viewId={VIEW_ID} />
);
export const ShapeEqualSquareCount = withConfig(ShapeEqualSquareCountViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeEqualSquareCount payload={payload} />);
};
