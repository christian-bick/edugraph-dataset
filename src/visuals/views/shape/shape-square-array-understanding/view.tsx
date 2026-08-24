import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {UnitSquareGridView} from '../shape-unit-square-grid-view.tsx';
import {ShapeSquareArrayUnderstandingViewConfig, ShapeSquareArrayUnderstandingViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-square-array-understanding';
interface CoreProps {
    config: ShapeSquareArrayUnderstandingViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <UnitSquareGridView payload={payload} task="understanding" useStory={false} viewId={VIEW_ID} />
);
export const ShapeSquareArrayUnderstanding = withConfig(ShapeSquareArrayUnderstandingViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeSquareArrayUnderstanding payload={payload} />);
};
