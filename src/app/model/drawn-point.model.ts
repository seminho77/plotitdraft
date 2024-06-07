import { fabric } from 'fabric';

/*
This class is useful for the visual representation of points on a canvas, 
such as Groundplan, where users need to mark specific locations.
*/
export class DrawnPoint extends fabric.Circle {
    constructor(left: number, top: number) {
        super({
            left,
            top,
            radius: 3,
            fill: document.body.classList.contains("dark-theme") ? "white" : "black",
            selectable: false,
        });
    }
}
