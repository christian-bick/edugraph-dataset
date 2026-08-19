import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {BarGraphView} from '../bar-graph-view.tsx';
import {DataBarGraphViewConfig, DataBarGraphViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'data-bar-graph';

interface CoreProps {
    config: DataBarGraphViewConfig;
    payload: ViewRenderPayload<'data-bar-graph'>;
}

const DataBarGraphCore = ({payload}: CoreProps) => (
    <BarGraphView mode="construction" payload={payload} viewId={VIEW_ID} />
);

export const DataBarGraph = withConfig(DataBarGraphViewSchema, DataBarGraphCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'data-bar-graph'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataBarGraph payload={payload} />);
};
