import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {UnitSquareGridView} from '../shape-unit-square-grid-view.tsx';
import {ShapeSquareArrayInterpretationViewConfig, ShapeSquareArrayInterpretationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-square-array-interpretation';
interface CoreProps {
    config: ShapeSquareArrayInterpretationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}
const Core = ({payload}: CoreProps) => (
    <UnitSquareGridView payload={payload} task="interpretation" useStory={false} viewId={VIEW_ID} />
);
export const ShapeSquareArrayInterpretation = withConfig(ShapeSquareArrayInterpretationViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeSquareArrayInterpretation payload={payload} />);
};
