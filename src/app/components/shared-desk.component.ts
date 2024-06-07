import { fabric } from 'fabric';

export class SharedDeskComponent {
  constructor(private canvas: fabric.Canvas) {
  }

  /*
   Add a shared desk layout to the canvas. 
   It creates a rectangular table with chairs placed at specific positions relative to the table.
  */
  addSharedDesk(coords: { x: number; y: number }): void {
    const table = new fabric.Rect({
      left: coords.x,
      top: coords.y,
      fill: "rgba(255, 255, 255, 0)",
      width: 25,
      height: 50,
      originX: 'center',
      originY: 'center',
      strokeWidth: 2,
      stroke: document.body.classList.contains("dark-theme") ? "white" : "black",
      strokeUniform: true
    });

    const chairPositions = [
      { offsetLeft: -20, offsetTop: -11 },
      { offsetLeft: -20, offsetTop: 11 },
    ];

    this.canvas.add(table);

    chairPositions.forEach(pos => {
      const chair = new fabric.Circle({
        left: table.left! + pos.offsetLeft,
        top: table.top! + pos.offsetTop,
        fill: "rgba(255, 255, 255, 0)",
        radius: 5,
        originX: 'center',
        originY: 'center',
        strokeWidth: 2,
        stroke: document.body.classList.contains("dark-theme") ? "white" : "black",
        strokeUniform: true
      });

      this.canvas.add(chair);
    });
  }

  /*
   Add a shared desk layout to the canvas.
   It creates circular desk and circular chairs positioned at specific angles around it.
  */
  addRoundDesk(coords: { x: number; y: number }): void {
    const desk = new fabric.Circle({
      left: coords.x,
      top: coords.y,
      fill: "rgba(255, 255, 255, 0)",
      radius: 25,
      originX: 'center',
      originY: 'center',
      strokeWidth: 2,
      stroke: document.body.classList.contains("dark-theme") ? "white" : "black",
      strokeUniform: true
    });

    const chairPositions = [
      { angle: 45, distance: 32 },
      { angle: 135, distance: 32 },
      { angle: 225, distance: 32 },
      { angle: 315, distance: 32 },
    ];

    this.canvas.add(desk);

    chairPositions.forEach(pos => {
      const radians = fabric.util.degreesToRadians(pos.angle);
      const chair = new fabric.Circle({
        left: desk.left! + pos.distance * Math.cos(radians),
        top: desk.top! + pos.distance * Math.sin(radians),
        fill: "rgba(255, 255, 255, 0)",
        radius: 5,
        originX: 'center',
        originY: 'center',
        strokeWidth: 2,
        stroke: document.body.classList.contains("dark-theme") ? "white" : "black",
        strokeUniform: true
      });

      this.canvas.add(chair);
    });
  }
}
