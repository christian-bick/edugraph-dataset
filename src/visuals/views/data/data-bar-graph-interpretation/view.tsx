import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {BarGraphView} from '../bar-graph-view.tsx';
import {DataBarGraphInterpretationViewConfig, DataBarGraphInterpretationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'data-bar-graph-interpretation';
interface CoreProps {config: DataBarGraphInterpretationViewConfig; payload: ViewRenderPayload<'data-bar-graph-interpretation'>}
const Core = ({payload}: CoreProps) => <BarGraphView mode="interpretation" payload={payload} viewId={VIEW_ID} />;
export const DataBarGraphInterpretation = withConfig(DataBarGraphInterpretationViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'data-bar-graph-interpretation'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataBarGraphInterpretation payload={payload} />);
};
