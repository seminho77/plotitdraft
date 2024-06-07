import {HandleData} from "./handledata";

export interface CustomCircleI extends fabric.Circle {
    data: HandleData;
}
