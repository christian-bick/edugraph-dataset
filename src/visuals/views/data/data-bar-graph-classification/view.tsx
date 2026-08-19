import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {BarGraphView} from '../bar-graph-view.tsx';
import {DataBarGraphClassificationViewConfig, DataBarGraphClassificationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'data-bar-graph-classification';
interface CoreProps {config: DataBarGraphClassificationViewConfig; payload: ViewRenderPayload<'data-bar-graph-classification'>}
const Core = ({payload}: CoreProps) => <BarGraphView mode="classification" payload={payload} viewId={VIEW_ID} />;
export const DataBarGraphClassification = withConfig(DataBarGraphClassificationViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'data-bar-graph-classification'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataBarGraphClassification payload={payload} />);
};
