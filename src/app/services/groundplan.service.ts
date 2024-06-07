import {fabric} from 'fabric';
import {DrawnPoint} from '../model/drawn-point.model';
import {BehaviorSubject} from "rxjs";
import {Line} from "fabric/fabric-impl";

export class GroundplanService {
    get gridLines(): Line[] {
        return this._gridLines;
    }

    set gridLines(value: Line[]) {
        this._gridLines = value;
    }

    private _isDrawing = new BehaviorSubject<boolean>(false);
    public isDrawing$ = this._isDrawing.asObservable();
    private isDrawing = false;
    private points: fabric.Point[] = [];
    private drawnPoints: DrawnPoint[] = [];
    private polygonCreated = false;
    private gridSize = 20; // Grid size for raster background
    private _gridLines: fabric.Line[] = [];
    private hoverHighlight: fabric.Circle | null = null;
    private polygonsLocked: boolean = false;
    public gridAddedManually = false;
    private isCorridor = false;

    constructor(private canvas: fabric.Canvas) {
    }

    // Method to set the drawing state
    public setDrawing(isDrawing: boolean): void {
        this._isDrawing.next(isDrawing);
    }

    /*
     Configures the canvas for drawing a groundplan.
     It sets up event listeners for mouse actions to draw points and create polygons.
    */
    setupDrawingGroundplan(): void {
        const clickTolerance = 10;

        this.canvas.on('mouse:down', (options) => {
            if (!this.polygonCreated && this.isDrawing) {
                const pointer = this.canvas.getPointer(options.e);
                // Snap to nearest grid
                const snappedX = Math.round(pointer.x / this.gridSize) * this.gridSize;
                const snappedY = Math.round(pointer.y / this.gridSize) * this.gridSize;
                const newPoint = new fabric.Point(snappedX, snappedY);
                /*
                        if (!this.isDrawing) {
                          this.isDrawing = true;
                          this.setDrawing(true);
                          this.addRasterGrid();
                          this.gridAddedManually = false;
                          this.points = [];
                          this.clearDrawnPoints();
                        }*/

                const drawnPoint = new DrawnPoint(snappedX, snappedY);
                this.drawnPoints.push(drawnPoint);
                this.canvas.add(drawnPoint);

                if (this.isDrawing && this.points.length > 2 && this.isNearFirstPoint(newPoint, clickTolerance)) {

                    this.createPolygon(this.points);
                    this.isDrawing = false;
                    this.setDrawing(false);
                    this.clearDrawnPoints();
                    this.points = [];
                    this.polygonCreated = true;
                } else if (this.isDrawing) {
                    this.points.push(newPoint);
                }
            }
        });

        this.canvas.on('mouse:move', (options) => {
            const pointer = this.canvas.getPointer(options.e);
            // Calculate the nearest grid intersection
            const snappedX = Math.round(pointer.x / this.gridSize) * this.gridSize;
            const snappedY = Math.round(pointer.y / this.gridSize) * this.gridSize;

            // Remove existing highlight
            if (this.hoverHighlight) {
                this.canvas.remove(this.hoverHighlight);
                this.hoverHighlight = null;
            }

            // Add a new highlight at the snapped position
            this.hoverHighlight = new fabric.Circle({
                left: snappedX,
                top: snappedY,
                radius: 5, // Small radius for the highlight
                fill: '#0000FF', // Red fill, consider using a glow effect or a brighter color
                opacity: 0.5, // Semi-transparent
                selectable: false,
                evented: false,
            });

            if (this.isDrawing == true) {
                this.canvas.add(this.hoverHighlight);
                this.canvas.bringToFront(this.hoverHighlight);
            }
        });

        this.canvas.on('mouse:out', () => {
            if (this.hoverHighlight) {
                this.canvas.remove(this.hoverHighlight);
                this.hoverHighlight = null;
            }
        });
    }

    /*
     Adds a raster grid background to the canvas for drawing assistance.
    */
    addRasterGrid(narrow: boolean): void {
        if (this._gridLines.length > 0) {
            // Grid already added, no need to add again
            return;
        }

        // Adjust gridSize based on the 'narrow' flag
        const localGridSize = narrow ? this.gridSize / 4 : this.gridSize;

        for (let i = 0; i <= (this.canvas.getWidth() / localGridSize); i++) {
            const distance = i * localGridSize;
            const horizontalLine = new fabric.Line([0, distance, this.canvas.getWidth(), distance], {
                stroke: '#ccc',
                selectable: false,
                evented: false,
                data: {type: "line"}
            });
            const verticalLine = new fabric.Line([distance, 0, distance, this.canvas.getHeight()], {
                stroke: '#ccc',
                selectable: false,
                evented: false,
                data: {type: "line"}
            });
            this._gridLines.push(horizontalLine, verticalLine);
        }

        // Add grid lines to canvas
        this._gridLines.forEach(line => {
            this.canvas.add(line);
            this.canvas.sendToBack(line);
        });
    }


    /*
     Checks if a point is near the first point within a specified tolerance,
     useful for closing the polygon.
    */
    private isNearFirstPoint(newPoint: fabric.Point, tolerance: number): boolean {
        const distance = Math.sqrt(
            Math.pow(this.points[0].x - newPoint.x, 2) +
            Math.pow(this.points[0].y - newPoint.y, 2)
        );
        return distance <= tolerance;
    }

    /*
     Creates a polygon from an array of points.
    */
    private createPolygon(points: fabric.Point[]): void {
        // Set dynamic stroke width based on whether the polygon is a corridor
        const strokeWidth = this.isCorridor ? 2 : 6;

        // Set stroke color to red if it's a corridor, otherwise adjust based on theme
        const strokeColor = this.isCorridor ? "red" : document.body.classList.contains("dark-theme") ? "white" : "black";

        const polygon = new fabric.Polygon(points, {
            fill: "rgba(255, 255, 255, 0)",
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            strokeUniform: true,
        });

        this.canvas.add(polygon);

        if (this.isCorridor) {
            // Bring the corridor polygon to the front if it is a corridor
            polygon.bringToFront();
        }
        // this.canvas.sendToBack(polygon);

        const criterion = {type: "line"}; // Adjust this based on your actual criteria

// Find the index of the first line that matches the criterion
        const lineIndex = this.canvas.getObjects().findIndex((obj) => obj.data && obj.data.type === "line");

        if (this.gridAddedManually === true) {
            this.canvas.moveTo(polygon, lineIndex + 70);
            // this.canvas.renderAll();
        } else if (this.isCorridor) {
            polygon.bringToFront();
        } else {
            this.canvas.sendToBack(polygon);
            // this.canvas.renderAll();
        }

        if (this.gridAddedManually === false) {
            this.removeRasterGrid();
        }


        if (this.polygonsLocked === true) {
            polygon.set({
                selectable: false
            })
        } else {
            polygon.set({
                selectable: true
            })
        }
    }

    lockPolygon(): void {
        if (this.canvas) {
            this.canvas.discardActiveObject();
            this.canvas.getObjects().forEach(obj => {
                if (obj.type === 'polygon') {
                    obj.set({
                        selectable: false
                    });
                }
            });

            this.canvas.renderAll(); // Update the canvas to reflect changes
            this.polygonsLocked = true;
        }

    }

    unlockPolygon(): void {
        if (this.canvas) {
            this.canvas.getObjects().forEach(obj => {
                if (obj.type === 'polygon') {
                    obj.set({
                        selectable: true
                    });
                }
            });

            this.canvas.renderAll(); // Update the canvas to reflect changes
            this.polygonsLocked = false;
        }

    }

    /*
     Removes all drawn points from the canvas and
     resets the corresponding array.
    */
    private clearDrawnPoints(): void {
        this.drawnPoints.forEach((point) => {
            this.canvas.remove(point);
        });

        this.drawnPoints = [];
    }

    removeRasterGrid(): void {
        this._gridLines.forEach(line => {
            this.canvas.remove(line);
        });
        this._gridLines = [];
    }

    /*
     Initializes variables to start a new groundplan drawing,
     resetting any previous state.
    */
    public startDrawingGroundplan(): void {
        this.isDrawing = true;
        this.setDrawing(true);
        this.gridAddedManually = false;
        this.points = [];
        this.clearDrawnPoints();
        this.polygonCreated = false;
        this.addRasterGrid(false);
    }

    public startDrawingCorridor(): void {
        this.isCorridor = true;
        this.isDrawing = true;
        this.setDrawing(true);
        this.gridAddedManually = false;
        this.points = [];
        this.clearDrawnPoints();
        this.polygonCreated = false;
        this.addRasterGrid(true);
    }


}
