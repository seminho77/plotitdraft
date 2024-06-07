import {CustomPoint} from "./custom-point.model";
import {RectangleData} from "./custom-rectangle.model";

export interface ScalingData {
    polygon: CustomPoint[];
    rectangles: RectangleData[];
}
