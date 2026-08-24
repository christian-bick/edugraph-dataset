import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {UnitSquareGridView} from '../shape-unit-square-grid-view.tsx';
import {ShapeSquareArrayViewConfig, ShapeSquareArrayViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-square-array';
interface CoreProps {
    config: ShapeSquareArrayViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <UnitSquareGridView payload={payload} task="execution" useStory={false} viewId={VIEW_ID} />
);
export const ShapeSquareArray = withConfig(ShapeSquareArrayViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeSquareArray payload={payload} />);
};
