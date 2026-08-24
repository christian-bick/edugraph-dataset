import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {UnitSquareGridView} from '../shape-unit-square-grid-view.tsx';
import {ShapeSquareArrayInversionViewConfig, ShapeSquareArrayInversionViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-square-array-inversion';
interface CoreProps {
    config: ShapeSquareArrayInversionViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <UnitSquareGridView payload={payload} task="inversion" useStory={false} viewId={VIEW_ID} />
);
export const ShapeSquareArrayInversion = withConfig(ShapeSquareArrayInversionViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeSquareArrayInversion payload={payload} />);
};
