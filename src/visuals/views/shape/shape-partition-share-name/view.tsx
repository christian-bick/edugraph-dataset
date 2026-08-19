import {createRoot} from 'react-dom/client'; import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx'; import {ShapePartitionView} from '../shape-partition-view.tsx';
import {ShapePartitionShareNameViewConfig, ShapePartitionShareNameViewSchema} from './spec.ts'; import '../../../../tailwind.css';
const VIEW_ID = 'shape-partition-share-name'; interface CoreProps {config: ShapePartitionShareNameViewConfig; payload: ViewRenderPayload<'shape-partition-share-name'>}
const Core = ({payload}: CoreProps) => <ShapePartitionView payload={payload} task="name-share" viewId={VIEW_ID} />;
export const ShapePartitionShareName = withConfig(ShapePartitionShareNameViewSchema, Core); let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'shape-partition-share-name'>) => {const container = document.getElementById('view'); if (!container) return; if (!root) root = createRoot(container); root.render(<ShapePartitionShareName payload={payload} />);};
