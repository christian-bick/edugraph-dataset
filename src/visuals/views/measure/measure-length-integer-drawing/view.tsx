import {createRoot} from 'react-dom/client';
import {MeasureLengthCore} from '../measure-length/view.tsx';
import {MeasureLengthIntegerDrawingViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';

const MeasureLengthIntegerDrawingCore = ({payload}: {payload: any}) =>
    <MeasureLengthCore isReverse={true} payload={payload} />;

export const MeasureLengthIntegerDrawing = withConfig(
    MeasureLengthIntegerDrawingViewSchema,
    MeasureLengthIntegerDrawingCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: any) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<MeasureLengthIntegerDrawing payload={payload} />);
    }
};
