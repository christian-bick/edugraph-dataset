import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PictureGraphView} from '../picture-graph-view.tsx';
import {DataPictureGraphInterpretationViewConfig, DataPictureGraphInterpretationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'data-picture-graph-interpretation';
interface CoreProps {config: DataPictureGraphInterpretationViewConfig; payload: ViewRenderPayload<'data-picture-graph-interpretation'>}
const Core = ({payload}: CoreProps) => <PictureGraphView mode="interpretation" payload={payload} viewId={VIEW_ID} />;
export const DataPictureGraphInterpretation = withConfig(DataPictureGraphInterpretationViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'data-picture-graph-interpretation'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataPictureGraphInterpretation payload={payload} />);
};
