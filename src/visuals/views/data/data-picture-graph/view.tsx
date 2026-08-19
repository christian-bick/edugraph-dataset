import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PictureGraphView} from '../picture-graph-view.tsx';
import {DataPictureGraphViewConfig, DataPictureGraphViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'data-picture-graph';
interface CoreProps {config: DataPictureGraphViewConfig; payload: ViewRenderPayload<'data-picture-graph'>}
const Core = ({payload}: CoreProps) => <PictureGraphView mode="construction" payload={payload} viewId={VIEW_ID} />;
export const DataPictureGraph = withConfig(DataPictureGraphViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
if (typeof window !== 'undefined') window.renderView = (payload: ViewRenderPayload<'data-picture-graph'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataPictureGraph payload={payload} />);
};
