import {createRoot} from 'react-dom/client';
import {MeasureLengthCore} from '../measure-length/view.tsx';
import {MeasureLengthIntegerViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';

export const MeasureLengthInteger = withConfig(MeasureLengthIntegerViewSchema, MeasureLengthCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: any) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<MeasureLengthInteger payload={payload} />);
    }
};
