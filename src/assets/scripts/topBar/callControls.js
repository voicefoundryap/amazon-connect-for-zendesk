import { buttons, resizeId } from "../constants/callControls.js"
import { resize } from "./core.js";
import ui from './ui.js';

export const displayCallControls = ({ isCurrentlyRecording }) => {
    resize(resizeId);
    if(isCurrentlyRecording) {
        ui.show(buttons.SUSPEND);
        ui.hide(buttons.RESUME);
    } else {
        ui.hide(buttons.SUSPEND);
        ui.show(buttons.RESUME);
    }
}