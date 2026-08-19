import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PictureGraphView} from '../picture-graph-view.tsx';
import {DataPictureGraphClassificationViewConfig, DataPictureGraphClassificationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'data-picture-graph-classification';
interface CoreProps {config: DataPictureGraphClassificationViewConfig; payload: ViewRenderPayload<'data-picture-graph-classification'>}
const Core = ({payload}: CoreProps) => <PictureGraphView mode="classification" payload={payload} viewId={VIEW_ID} />;
export const DataPictureGraphClassification = withConfig(DataPictureGraphClassificationViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'data-picture-graph-classification'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataPictureGraphClassification payload={payload} />);
};
