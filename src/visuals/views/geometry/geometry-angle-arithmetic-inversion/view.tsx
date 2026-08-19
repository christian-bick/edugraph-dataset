import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {AngleArithmeticView} from '../angle-arithmetic-view.tsx';
import {GeometryAngleArithmeticInversionViewConfig, GeometryAngleArithmeticInversionViewSchema} from './spec.ts';
import '../../../../tailwind.css';
const VIEW_ID = 'geometry-angle-arithmetic-inversion';
interface CoreProps {config: GeometryAngleArithmeticInversionViewConfig; payload: ViewRenderPayload<'geometry-angle-arithmetic-inversion'>}
const Core = ({payload}: CoreProps) => <AngleArithmeticView payload={payload} task="solve-unknown-component" viewId={VIEW_ID} />;
export const GeometryAngleArithmeticInversion = withConfig(GeometryAngleArithmeticInversionViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'geometry-angle-arithmetic-inversion'>) => {
    const container = document.getElementById('view'); if (!container) return;
    if (!root) root = createRoot(container); root.render(<GeometryAngleArithmeticInversion payload={payload} />);
};
