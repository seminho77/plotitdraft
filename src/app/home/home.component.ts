import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {fabric} from "fabric";
import {RoomComponent} from "../components/room.component";
import {GroundplanService} from "../services/groundplan.service";
import {SharedDeskComponent} from "../components/shared-desk.component";
import {ChairComponent} from "../components/chair.component";
import {Observable, Subscription} from "rxjs";
import {ImageProcessingService} from "../services/image-processing.service";
import {Router} from "@angular/router";
import {UploadGroundplanComponent} from "../upload-groundplan/upload-groundplan.component";
import {CustomFabricObject} from "../model/custom-object.model";
import {CustomPolygon} from "../model/custom-polygon.model";
import {CustomCircle} from "../model/custom-circle.model";
import {IPoint, Point} from "fabric/fabric-impl";
import {RectangleData} from "../model/custom-rectangle.model";
import {CustomPoint} from "../model/custom-point.model";
import {PolygonEdgeMap} from "../model/PolygonEdgeMap";
import {Edge} from "../model/Edge";
import {CustomCircleI} from "../model/customc";
import {HandleData} from "../model/handledata";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnInit, OnDestroy {
    private subscription: Subscription = new Subscription();


    ngOnInit(): void {

    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe(); // Prevent memory leaks
        // Clean up by removing the reference to avoid memory leaks.
        if (this.imageProcessingService) {
            //this.imageProcessingService.setOnBackgroundImageSet(undefined);
        }
    }

    /*addProcessedObjectsToCanvas(objects: fabric.Object[]): void {
      objects.forEach(obj => this.canvas.add(obj));
      console.log("object to canvas successful");
      //this.canvas.renderAll();
    }*/

    processFile2(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event: any) => {
                try {
                    const dataURL = event.target.result;
                    fabric.Image.fromURL(dataURL, (img) => {
                        if (img.width && img.height && this.canvas.width && this.canvas.height) {
                            this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
                                scaleX: this.canvas.width / img.width,
                                scaleY: this.canvas.height / img.height,
                            });

                            // Now that the image is set as the background, continue with the OpenCV processing
                            const imageElement = new Image();
                            imageElement.onload = () => {
                                console.log('Image loaded for processing');
                                //this.processImageWithOpenCV(imageElement); // Make sure this method is suitable for <img> element
                                resolve();
                            };
                            imageElement.onerror = () => reject(new Error('Error loading image'));
                            imageElement.src = dataURL; // This will trigger the onload event above
                        } else {
                            reject(new Error('Image does not have dimensions.'));
                        }
                    }, {
                        crossOrigin: 'anonymous'
                    });
                } catch (error) {
                    console.error('Error loading image', error);
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    toggleRoomLock(): void {
        if (document.body.classList.contains('lockRoom')) {
            document.body.classList.remove('lockRoom');
            this.roomComponent.unlockRoom();
        } else {
            document.body.classList.add('lockRoom');
            this.roomComponent.lockRoom();
        }
        this.lockRoom = !this.lockRoom;
    }

    toggleImageVisibility(): void {
        if (document.body.classList.contains('hideImage')) {
            document.body.classList.remove('hideImage');
            this.addImage();
        } else {
            document.body.classList.add('hideImage');
            this.hideImage();
        }
    }

    hideImage(): void {
        if (this.canvas) {
            this.canvas.discardActiveObject(); // Deselect any active object
            this.canvas.getObjects().forEach(obj => {
                if (obj.data && obj.data.type === 'room') { // Check if the object is an image
                    obj.set({
                        //selectable: false, // Make the image non-selectable
                        visible: false    // Hide the image
                    });
                }
            });

            this.canvas.renderAll(); // Update the canvas to reflect changes
            this.hidenImage = true;  // Optionally manage state indicating images are hidden
        }
    }

    addImage(): void {
        if (this.canvas) {
            this.canvas.getObjects().forEach(obj => {
                if (obj.data && obj.data.type === 'room') { // Check if the object is an image
                    obj.set({
                        //selectable: true,  // Make the image selectable
                        visible: true      // Show the image
                    });
                }
            });

            this.canvas.renderAll(); // Update the canvas to reflect changes
            this.hidenImage = false;  // Optionally manage state indicating images are visible
        }
    }

    toggleGroundplanLock(): void {
        if (document.body.classList.contains('lockGroundplan')) {
            document.body.classList.remove('lockGroundplan');
            this.groundplanService.unlockPolygon();
        } else {
            document.body.classList.add('lockGroundplan');
            this.groundplanService.lockPolygon();
        }
        this.lockGroundplan = !this.lockGroundplan;
    }

    toggleGrid(): void {
        if (document.body.classList.contains('grid')) {
            document.body.classList.remove('grid');
            this.groundplanService.removeRasterGrid();
        } else {
            document.body.classList.add('grid');
            this.groundplanService.addRasterGrid(false);
            this.groundplanService.gridAddedManually = true;
        }
        this.grid = !this.grid;
    }

    /*
     manage UI state changes -> showing tips.
    */
    toggleTips(): void {
        if (document.body.classList.contains('tipsOpen')) {
            document.body.classList.remove('tipsOpen');
        } else {
            document.body.classList.add('tipsOpen');
        }
    }

    /*
      manage UI state changes -> toggling the dark theme.
    */
    toggleDarkTheme(): void {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            for (let obj of this.canvas.getObjects()) {
                if (obj.data && obj.data.type === "line") {
                    continue;
                }
                obj.stroke = 'black';
                obj.dirty = true;
            }

        } else {
            document.body.classList.add('dark-theme');
            for (let obj of this.canvas.getObjects()) {
                if (obj.data && obj.data.type === "line") {
                    continue;
                }
                obj.stroke = 'white';
                obj.dirty = true;
            }
        }
        this.darkMode = !this.darkMode;
        this.canvas.renderAll();
    }

    grundrissButtons = [{id: 1, image: 'assets/img/grundriss.svg'}];

    raeumeButtons = [
        {id: 1, image: 'assets/img/room1.svg'},
        {id: 2, image: 'assets/img/room2.svg'},
    ];
    sharedDeskButtons = [
        {id: 1, image: 'assets/img/desk1.svg'},
        {id: 2, image: 'assets/img/desk2.svg'},
    ];

    stuehleButtons = [{id: 1, image: 'assets/img/chair.svg'}];

    private title = 'Plotit';
    public canvas!: fabric.Canvas;
    private roomComponent!: RoomComponent;
    private groundplanService!: GroundplanService;
    private sharedDeskComponent!: SharedDeskComponent;
    private chairComponent!: ChairComponent;
    public activeCategory: {
        [key: string]: number | null
    } = {};
    private isCategoryActive: boolean = false;
    public darkMode = false;
    public grid = false;
    public lockGroundplan = false;
    public lockRoom = false;
    public hidenImage = false;
    public isDrawing$!: Observable<boolean>;
    private uploadGroundplanComponent!: UploadGroundplanComponent;
    private objectQueue: fabric.Object[] = []; // Queue for objects waiting to be added to the canvas
    canvasReady = false; // Flag indicating whether the canvas is ready
    private static idCounter = 1;
    public polygonGenerated: boolean = false;
    public isDrawingMode: boolean = false;
    public polygonStored: fabric.Object | undefined;
    public drawingMode: 'none' | 'point' | 'line' = 'none';
    public currentLine: fabric.Line | null = null;
    public roomMode: boolean = false;
    private gridSize: number = 10;

    constructor(private router: Router, private cdr: ChangeDetectorRef, private imageProcessingService: ImageProcessingService) {

    }

    private generateUniqueId(): string {
        return `polygon_${HomeComponent.idCounter++}`; // Access static property
    }

    navigateToUpload() {
        this.router.navigate(['/upload']);
    }

    ngAfterViewInit(): void {
        this.initCanvas();
        this.cdr.detectChanges();
        /* this.imageProcessingService.processedObjects$.subscribe(objects => {
               objects.forEach(obj => this.canvas.add(obj));
               this.canvas.renderAll();
           });*/

//this.testCanvasWithStaticImage();

        //this.imageProcessingService.setOnBackgroundImageSet(this.addImageToCanvas.bind(this));
        this.addImageToCanvas(this.imageProcessingService.dataURL);


        /* this.subscription.add(this.imageProcessingService.processedObjects$.subscribe(objects => {
              //console.log("Attempting to add objects to canvas:", objects);
              console.log("Received objects to add to canvas:", objects.length);
              objects.forEach((obj, index) => {
                  console.log(`Object ${index}:`, 'Left:', obj.left, 'Top:', obj.top, 'Width:', obj.width, 'Height:', obj.height);
                 // console.log("Adding object:", obj);
                  this.adjustObjectToFitCanvas(obj, this.canvas.getWidth(), this.canvas.getHeight());
                  this.canvas.add(obj);
              });
              console.log("object to canvas successful");
              this.canvas.renderAll();
          }));
    */

        this.subscription.add(this.imageProcessingService.processedObjects$.subscribe(objects => {
            console.log("Received objects to add to canvas:", objects.length);
            objects.forEach((objData, index) => {
                if (objData instanceof fabric.Polygon && objData.points) {
                    const points = objData.points.map(p => ({x: p.x, y: p.y}));

                    let polygon = new fabric.Polygon(points, {
                        fill: 'transparent',
                        stroke: 'blue',
                        strokeWidth: 2,
                        objectCaching: false,
                        selectable: true,
                        hasBorders: true,
                        hasControls: true
                    }) as CustomPolygon; // Cast to CustomPolygon

                    polygon.id = this.generateUniqueId();  // Assign a unique ID

                    this.adjustObjectToFitCanvas(polygon, this.canvas.getWidth(), this.canvas.getHeight());
                    this.canvas.add(polygon);
                    this.addControlsToPolygon(polygon); // Add and link control points
                    this.setupPolygonEvents(polygon);   // Setup event listeners for transformations
                    // this.polygonStored = polygon;
                    this.polygonGenerated = true;
                    this.toggleGroundplanLock();

                } else {
                    console.error('Invalid object data or missing points:', objData);
                }
                if (!(objData instanceof fabric.Polygon)) {
                    //this.adjustObjectToFitCanvas(objData, this.canvas.getWidth(), this.canvas.getHeight());
                    this.canvas.add(objData);
                }
            });
            console.log("Object to canvas successful");
            this.canvas.renderAll();
        }));




        /* this.canvasReady = true;

         // Process any objects that were queued before the canvas was ready
         if (this.objectQueue.length > 0) {
           this.addProcessedObjectsToCanvas(this.objectQueue);
           this.objectQueue = []; // Clear the queue
         }*/


        let rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: 'red',
            width: 20,
            height: 20
        });

        // Directly add a processed object for testing
        //const testObject = new fabric.Rect({left: 50, top: 50, width: 100, height: 100, fill: 'blue'});
        //this.canvas.add(testObject);

        // this.canvas.add(rect);
        this.canvas.renderAll();
    }

    public sendRoomPoints(): void {
        let controlPoints = this.canvas.getObjects().filter(obj => obj.type === 'circle' && obj.fill === 'blue');
        if (!controlPoints.length) {
            console.error('No polygon control points found');
            return;
        }

        let polygonPoints = controlPoints.map(obj => {
            const center = obj.getCenterPoint();
            return {x: center.x, y: center.y};
        });

        let roomPointsData = this.canvas.getObjects().filter(obj => obj.type === 'circle' && obj.fill === 'red').map(obj => {
            const center = obj.getCenterPoint(); // Get the absolute center point of the circle
            return {x: center.x, y: center.y};
        });

        // Collect all line data from red lines marked as room partitions
        let roomLinesData = this.canvas.getObjects().filter(obj => obj.type === 'line' && obj.stroke === 'red').map(line => {
            const lineObj = line as fabric.Line; // Cast the object to fabric.Line
            return {x1: lineObj.x1, y1: lineObj.y1, x2: lineObj.x2, y2: lineObj.y2};
        });

        console.log('Sending the following polygon points to the server:', polygonPoints);
        console.log('Sending the following room points to the server:', roomPointsData);
        console.log('Sending the following room line data to the server:', roomLinesData);

        this.sendToServer(polygonPoints, roomPointsData, roomLinesData);
    }

    private sendToServer(polygonPoints: CustomPoint[], roomPointsData: CustomPoint[], roomLinesData: any[]): void {
        fetch('http://localhost:5000/generate-rooms', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({polygon: polygonPoints, roomPoints: roomPointsData, roomLines: roomLinesData})
        })
            .then(response => response.json())
            .then(data => {
                this.updateCanvasWithRooms(data);
                console.log("Room generation success!");
            })
            .catch(error => console.error('Error:', error));
    }
/*
    private updateCanvasWithRooms(roomsData: any[]): void {
        // Clear existing room objects
        this.canvas.getObjects().filter(obj => obj.data && obj.data.type === 'room').forEach(obj => this.canvas.remove(obj));

        const pointsMap = new Map<string, fabric.Circle>();  // To track shared handles

        roomsData.forEach(room => {
            if (room.type === 'polygon') {
                const newRoom = new fabric.Polygon(room.points, {
                    fill: 'transparent',
                    stroke: 'red',
                    strokeWidth: 2,
                    selectable: true,
                    strokeUniform: true
                });
                this.canvas.add(newRoom);

                // Add handles to each vertex
                room.points.forEach((point: { x: number, y: number }) => {
                    const pointKey = `${point.x}_${point.y}`;
                    if (!pointsMap.has(pointKey)) {
                        const handle = new fabric.Circle({
                            left: point.x,
                            top: point.y,
                            radius: 5,
                            fill: 'blue',
                            hasBorders: false,
                            hasControls: false,
                            originX: 'center',
                            originY: 'center',
                            selectable: true
                        });
                        // Snap handle to grid and update polygons
                        handle.on('moving', (options) => {
                            // Ensure left and top are not undefined by using non-null assertion
                            handle.set({
                                left: Math.round(handle.left! / this.gridSize) * this.gridSize,
                                top: Math.round(handle.top! / this.gridSize) * this.gridSize
                            });
                            this.updatePolygonVertices(handle, pointKey);
                        });

                        this.canvas.add(handle);
                        handle.bringToFront();
                        pointsMap.set(pointKey, handle);
                    }
                });
            }
        });

        this.canvas.renderAll();
    }

    private updatePolygonVertices(handle: fabric.Circle, pointKey: string): void {
        // Iterate over all polygons to update vertices linked to this handle
        this.canvas.getObjects().forEach(obj => {
            if (obj.type === 'polygon') {
                const polygon = obj as fabric.Polygon;

                if (polygon.points) {  // Check if points are actually defined
                    let shouldUpdate = false; // Flag to detect if any vertex was updated

                    // Update vertices only if they match the handle's current position
                    const updatedPoints = polygon.points.map(point => {
                        const key = `${point.x}_${point.y}`;
                        if (key === pointKey) {
                            shouldUpdate = true;  // Mark that we've made an update
                            // Use the fabric.Point constructor to create a proper Point object
                            return new fabric.Point(handle.left ?? point.x, handle.top ?? point.y);
                        }
                        return point;
                    });

                    if (shouldUpdate) {
                        polygon.points = updatedPoints; // Apply the updated points back to the polygon
                        polygon.dirty = true; // Mark the polygon as needing a re-render
                        polygon.setCoords(); // Recalculate the polygon's positioning
                        this.canvas.requestRenderAll(); // Request a re-render of the entire canvas
                    }
                }
            }
        });
    }
*/





    private updateCanvasWithRooms(roomsData: any[]): void {
        this.canvas.getObjects().filter(obj => obj.data && obj.data.type === 'room').forEach(obj => this.canvas.remove(obj));
        const pointsMap = new Map<string, fabric.Circle>();

        roomsData.forEach(room => {
            if (room.type === 'polygon') {
                const newRoom = new fabric.Polygon(room.points, {
                    fill: 'transparent',
                    stroke: 'red',
                    strokeWidth: 2,
                    selectable: false,
                    strokeUniform: true,
                    objectCaching: false
                });
                this.canvas.add(newRoom);
                // Handle polygon points
                this.processShapeVertices(newRoom, pointsMap, room.points);
            } else if (room.type === 'rect') {
                const newRoom = new fabric.Rect({
                    left: room.left,
                    top: room.top,
                    width: room.width,
                    height: room.height,
                    fill: 'transparent',
                    stroke: 'red',
                    strokeWidth: 2,
                    selectable: true,
                    strokeUniform: true
                });
                this.canvas.add(newRoom);
                // Calculate and handle rectangle points (corners)
                const rectPoints = [
                    { x: room.left, y: room.top },
                    { x: room.left + room.width, y: room.top },
                    { x: room.left, y: room.top + room.height },
                    { x: room.left + room.width, y: room.top + room.height }
                ];
                this.processShapeVertices(newRoom, pointsMap, rectPoints);
            }
        });

        // After all objects are added, bring all handles to the front
        pointsMap.forEach(handle => handle.bringToFront());
        this.canvas.renderAll();
    }

    private processShapeVertices(shape: fabric.Polygon | fabric.Rect, pointsMap: Map<string, fabric.Circle>, vertices: any[]) {
        vertices.forEach((point, index) => {
            const pointKey = `${point.x}_${point.y}`;
            if (!pointsMap.has(pointKey)) {
                const handle = new fabric.Circle({
                    left: point.x,
                    top: point.y,
                    radius: 5,
                    fill: 'blue',
                    hasBorders: false,
                    hasControls: false,
                    originX: 'center',
                    originY: 'center',
                    selectable: true
                }) as CustomCircleI;
                handle.data = { polygons: [{ shape: shape, pointIndex: index }] };
                handle.on('moving', () => {
                    this.updatePolygonVertices(handle);
                });
                this.canvas.add(handle);
                pointsMap.set(pointKey, handle);
            } else {
                let existingHandle = pointsMap.get(pointKey);
                if (existingHandle) {
                    (existingHandle.data as HandleData).polygons.push({ shape: shape, pointIndex: index });
                }
            }
        });
    }


    private updatePolygonVertices(handle: CustomCircleI): void {
        const handleData = handle.data as HandleData;
        handleData.polygons.forEach(data => {
            const { shape, pointIndex } = data;
            if (shape instanceof fabric.Polygon && shape.points) { // Check if it's a Polygon and points are defined
                const point = shape.points[pointIndex];
                const scaleX = shape.scaleX || 1;
                const scaleY = shape.scaleY || 1;
                const newPointX = (handle.left ?? point.x) / scaleX;
                const newPointY = (handle.top ?? point.y) / scaleY;

                shape.points[pointIndex] = new fabric.Point(newPointX, newPointY);
                shape.dirty = true;
            } else if (shape instanceof fabric.Rect) {
                // Handling rectangle adjustments based on handle movements.
                // For rectangles, you may need to determine which corner is being moved and adjust the position and dimensions accordingly.
                // This is a placeholder logic that should be replaced with actual calculations based on your application's requirements.
                if (pointIndex === 0) { // Assuming pointIndex corresponds to specific corners: 0 for top-left, 1 for top-right, etc.
                    shape.set({ left: handle.left, top: handle.top });
                }
                // More conditions for other corners need to be added here based on pointIndex.
            }

            shape.setCoords(); // Recalculate shape's coordinates
        });
        this.canvas.requestRenderAll();
    }


    drawPointsAndLines(): void {
        // First, remove any existing event handlers regardless of the current mode
        this.canvas.off('mouse:down');
        this.canvas.off('mouse:move');
        this.canvas.off('mouse:up');

        if (this.drawingMode === 'none') {
            // Switch to drawing points
            this.drawingMode = 'point';
            this.canvas.defaultCursor = 'crosshair';
            this.setupPointDrawing();
        } else if (this.drawingMode === 'point') {
            // Switch to drawing lines
            this.drawingMode = 'line';
            this.canvas.defaultCursor = 'crosshair';
            this.setupLineDrawing();
        } else {
            // Turn off drawing and reset mode
            this.drawingMode = 'none';
            this.canvas.defaultCursor = 'default';
        }
    }

    private setupPointDrawing(): void {
        this.canvas.on('mouse:down', (options) => this.addPoint(options));
    }

    private setupLineDrawing(): void {
        this.canvas.on('mouse:down', (options) => {
            const pointer = this.canvas.getPointer(options.e);
            const points = [pointer.x, pointer.y, pointer.x, pointer.y];
            this.currentLine = new fabric.Line(points, {
                strokeWidth: 2,
                fill: 'red',
                stroke: 'red',
                originX: 'center',
                originY: 'center',
                selectable: true
            });
            this.canvas.add(this.currentLine);
        });
        this.canvas.on('mouse:move', (options) => {
            if (!this.currentLine) return;
            const pointer = this.canvas.getPointer(options.e);
            this.currentLine.set({x2: pointer.x, y2: pointer.y});
            this.canvas.renderAll();
        });
        this.canvas.on('mouse:up', () => {
            this.currentLine = null;  // Ensure line drawing stops after mouse is released
        });
    }

    private addPoint(options: fabric.IEvent): void {
        if (options.pointer) {
            const point = new fabric.Circle({
                radius: 5,
                fill: 'red',
                left: options.pointer.x,
                top: options.pointer.y,
                originX: 'center',
                originY: 'center',
                selectable: true
            });
            this.canvas.add(point);
        }
    }

    private addControlsToPolygon(polygon: CustomPolygon): void {
        if (!polygon.points) return;

        polygon.points.forEach((point, index) => {
            const transformedPoint = this.transformPointToCanvasCoords(point, polygon);
            const circle = new fabric.Circle({
                radius: 5,
                fill: 'blue',
                left: transformedPoint.x,
                top: transformedPoint.y,
                hasBorders: false,
                hasControls: false,
                originX: 'center',
                originY: 'center',
                stroke: 'white', // Set the border color to white
                strokeWidth: 1  // Set the border thickness. Adjust this value to your preference
            }) as CustomCircle;  // Cast to CustomCircle
            circle.polygonId = polygon.id;  // Now you can safely assign polygonId
            circle.on('moving', (options) => this.adjustVertex(polygon, index, circle));
            this.canvas.add(circle);
            // this.polygonStored = polygon; //(?)
        });
    }

    private setupPolygonEvents(polygon: CustomPolygon): void {
        // Update control points whenever the polygon is moved or scaled
        polygon.on('modified', () => this.updateControlPoints(polygon));
        polygon.on('moving', () => this.updateControlPoints(polygon));
        polygon.on('scaling', () => this.updateControlPoints(polygon));
    }

    private updateControlPoints(polygon: CustomPolygon): void {
        this.canvas.getObjects().forEach(obj => {
            const circle = obj as CustomCircle; // Cast to CustomCircle
            if (circle.polygonId === polygon.id) { // Safe to check polygonId now
                this.canvas.remove(circle);
            }
        });

        this.addControlsToPolygon(polygon);
    }


    private transformPointToCanvasCoords(point: fabric.Point, polygon: fabric.Polygon): {
        x: number,
        y: number
    } {
        const left = polygon.left || 0;
        const top = polygon.top || 0;
        const scaleX = polygon.scaleX || 1;
        const scaleY = polygon.scaleY || 1;

        // Assuming each control point has a radius of 5 pixels
        const radius = 5;

        // Calculate the transformed coordinates
        let x = left + point.x * scaleX;
        let y = top + point.y * scaleY;

        // Ensure the x-coordinate stays within the canvas, allowing half the control point to vanish
        x = Math.max(radius, Math.min(x, this.canvas.getWidth() - radius));
        // Ensure the y-coordinate stays within the canvas, allowing half the control point to vanish
        y = Math.max(radius, Math.min(y, this.canvas.getHeight() - radius));

        return {x, y};
    }

    private adjustVertex(polygon: fabric.Polygon, index: number, circle: fabric.Circle): void {
        const points = polygon.get('points');
        if (!points) return; // Safeguard against undefined points
        if (circle.left && circle.top) {
            const canvasPoint = this.transformCanvasCoordsToPoint(circle.left, circle.top, polygon);
            points[index] = new fabric.Point(canvasPoint.x, canvasPoint.y);
            polygon.set({points: points});
        }
        this.enforceAngleRestrictions(polygon, index); // Optionally enforce angle restrictions

        polygon.setCoords();
        this.canvas.renderAll();
    }


    private transformCanvasCoordsToPoint(x: number, y: number, polygon: fabric.Polygon): {
        x: number,
        y: number
    } {
        // Ensure all properties are defined, or use default values
        const left = polygon.left || 0;
        const top = polygon.top || 0;
        const scaleX = polygon.scaleX || 1;
        const scaleY = polygon.scaleY || 1;

        return {
            x: (x - left) / scaleX,
            y: (y - top) / scaleY
        };
    }

    private enforceAngleRestrictions(polygon: fabric.Polygon, movedIndex: number): void {
        // Placeholder: Implement actual angle enforcement logic based on your application's needs
        // This could involve trigonometric calculations to adjust the position of the movedIndex vertex
        // to ensure the angles meet your requirements (e.g., 90 degrees)
    }

    public addImageToCanvas(dataURL: string): void {
        // Directly use a data URL for testing
        fabric.Image.fromURL(dataURL, (img) => {
            // Check if image and canvas dimensions are defined
            if (typeof img.width === 'number' && typeof img.height === 'number' && this.canvas && this.canvas.width && this.canvas.height) {
                // Add image to canvas
                this.canvas.add(img);
                this.canvas.sendToBack(img);

                // Calculate the scaling factor to fit the image within canvas dimensions
                const scaleWidth = this.canvas.width / img.width;
                const scaleHeight = this.canvas.height / img.height;
                const scale = Math.min(scaleWidth, scaleHeight); // Use the smallest scale to fit the entire image

                // Apply the calculated scale to the image
                img.scale(scale);

                // Center the image
                img.set({
                    left: (this.canvas.width - img.getScaledWidth()) / 2,
                    top: (this.canvas.height - img.getScaledHeight()) / 2,
                    originX: 'left', // Align the scaled image to the center of the canvas horizontally
                    originY: 'top',   // Align the scaled image to the center of the canvas vertically
                    selectable: false
                });
                this.canvas.sendToBack(img);
                // Render the canvas with the newly added image
                this.canvas.renderAll();
                console.log("Test image added and scaled to canvas");
            } else {
                console.error('Image or canvas dimensions are not fully defined.');
            }
        });
    }


    /*private setBackgroundImage(dataURL: string): void {
        fabric.Image.fromURL(dataURL, (img) => {
            console.log('Image loaded', img);
            if (img.width && img.height && this.canvas.width && this.canvas.height) {
                const scaleX = this.canvas.width / img.width;
                const scaleY = this.canvas.height / img.height;
                this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
                    scaleX: scaleX,
                    scaleY: scaleY,
                });
            } else {
                console.error('Image does not have dimensions.');
            }
        }, {
            crossOrigin: 'anonymous'
        });
    }*/

    testCanvasWithStaticImage(): void {
        // Directly use a static image URL or a data URL for testing
        const testImageUrl = 'https://via.placeholder.com/150'; // A placeholder image
        fabric.Image.fromURL(testImageUrl, (img) => {
            this.canvas.add(img); // Add image to canvas
            if (this.canvas.width) {
                img.scaleToWidth(this.canvas.width); // Optional: Scale image to fit canvas width
            }
            this.canvas.renderAll(); // Render the canvas
            console.log("Test image added to canvas");
        });
    }


    private adjustObjectToFitCanvas(obj: fabric.Object, canvasWidth: number, canvasHeight: number): void {
        if ((obj as any).points) {
            const points = (obj as any).points;

            // Calculate bounding box for the points
            const minX = Math.min(...points.map((point: fabric.Point) => point.x));
            const minY = Math.min(...points.map((point: fabric.Point) => point.y));
            const maxX = Math.max(...points.map((point: fabric.Point) => point.x));
            const maxY = Math.max(...points.map((point: fabric.Point) => point.y));

            const objWidth = maxX - minX;
            const objHeight = maxY - minY;

            const scaleWidth = canvasWidth / objWidth;
            const scaleHeight = canvasHeight / objHeight;
            const scaleFactor = Math.min(scaleWidth, scaleHeight, 1); // Limit scaling up to prevent distortion

            // Apply the calculated scale to the points
            const scaledPoints = points.map((point: fabric.Point) => {
                return new fabric.Point(
                    (point.x - minX) * scaleFactor,
                    (point.y - minY) * scaleFactor
                );
            });

            (obj as any).points = scaledPoints;

            // Center the object on the canvas
            const offsetX = (canvasWidth - (objWidth * scaleFactor)) / 2;
            const offsetY = (canvasHeight - (objHeight * scaleFactor)) / 2;

            obj.set({
                left: offsetX,
                top: offsetY
            });

            // Set the stroke color to black for visibility
            obj.set({stroke: 'black'});

            // Ensure the adjustments are applied and object coordinates are updated
            obj.setCoords();

            this.polygonStored = obj;
            this.canvas.renderAll();
        }
    }

    private adjustObjectToFitCanvas1(obj: fabric.Object, canvasWidth: number, canvasHeight: number): void {
        // Calculate the scaling factors for width and height
        const scaleX = canvasWidth / obj.getScaledWidth();
        const scaleY = canvasHeight / obj.getScaledHeight();

        // Use the smaller scaling factor to ensure the object fits within the canvas
        const scaleFactor = Math.min(scaleX, scaleY, 1); // Ensure the scale factor is not more than 1

        obj.scale(scaleFactor);

        // Adjust position to ensure the object doesn't go beyond the canvas boundaries
        const objWidth = obj.getScaledWidth();
        const objHeight = obj.getScaledHeight();

        // Adjust if the object goes beyond the right edge
        if (obj.left !== undefined && obj.left + objWidth > canvasWidth) {
            obj.set('left', canvasWidth - objWidth);

        }

        // Adjust if the object goes beyond the bottom edge
        if (obj.top !== undefined && obj.top + objHeight > canvasHeight) {
            obj.set('top', canvasHeight - objHeight);
        }

        // Ensure the object's position is not negative
        if (obj.left !== undefined) {
            obj.set('left', Math.max(0, obj.left));
        }

        if (obj.top !== undefined) {
            obj.set('top', Math.max(0, obj.top));
        }


        // Set the stroke color to black
        obj.set({stroke: 'black'});

        // Ensure the adjustments are applied
        obj.setCoords();
    }


    /*
      Sets up the Fabric.js canvas and initializes various components
      like GroundplanService, RoomComponent, etc.,
      and binds event handlers for canvas interactions.
    */
    initCanvas = () => {
        this.canvas = new fabric.Canvas('myCanvas');
        this.canvas.setDimensions({
            width: 1600,
            height: 800,
        });
        this.canvas.on('object:moving', (e) => {
            const obj = e.target as CustomFabricObject;
            if (!obj) return;

            const radius = 12; // Radius of the control points
            if (obj.left && obj.top) {
                // Check left and top boundaries to ensure they don't go out of bounds
                if (obj.left < 0) {
                    obj.left = 0;
                }
                if (obj.top < 0) {
                    obj.top = 0;
                }

                // Allow moving out only up to half the control point's radius beyond the right and bottom canvas boundaries
                if (obj.left + obj.getScaledWidth() > this.canvas.getWidth() - radius) {
                    if (obj.left + obj.getScaledWidth() > this.canvas.getWidth() + radius) {
                        obj.left = this.canvas.getWidth() - obj.getScaledWidth() + radius;
                    }
                }
                if (obj.top + obj.getScaledHeight() > this.canvas.getHeight() - radius) {
                    if (obj.top + obj.getScaledHeight() > this.canvas.getHeight() + radius) {
                        obj.top = this.canvas.getHeight() - obj.getScaledHeight() + radius;
                    }
                }
            }
        });

        this.canvas.on('object:scaling', (e) => {
            const obj = e.target as CustomFabricObject;
            if (!obj) return;

            const radius = 12; // Radius of the control points
            if (obj.left && obj.top) {
                // Prevent scaling beyond the left or top edges
                if (obj.left < 0) {
                    obj.left = 0;
                }
                if (obj.top < 0) {
                    obj.top = 0;
                }

                // Adjust scaling for the right and bottom edges
                if (obj.left + obj.getScaledWidth() > this.canvas.getWidth() - radius) {
                    if (obj.left + obj.getScaledWidth() > this.canvas.getWidth() + radius) {
                        obj.scaleX = obj.lastScaleX || 1;
                        obj.left = this.canvas.getWidth() - obj.getScaledWidth() + radius;
                    }
                }
                if (obj.top + obj.getScaledHeight() > this.canvas.getHeight() - radius) {
                    if (obj.top + obj.getScaledHeight() > this.canvas.getHeight() + radius) {
                        obj.scaleY = obj.lastScaleY || 1;
                        obj.top = this.canvas.getHeight() - obj.getScaledHeight() + radius;
                    }
                }

                // Store last valid scale values
                obj.lastScaleX = obj.scaleX;
                obj.lastScaleY = obj.scaleY;
            }
        });


        this.canvas.preserveObjectStacking = true;
        this.canvas.stopContextMenu = true;

        this.groundplanService = new GroundplanService(this.canvas);
        this.roomComponent = new RoomComponent(this.canvas);
        this.sharedDeskComponent = new SharedDeskComponent(this.canvas);
        this.chairComponent = new ChairComponent(this.canvas);

        this.groundplanService.setupDrawingGroundplan();
        this.isDrawingMode = false;

        this.canvas.on('mouse:down', (event: fabric.IEvent) => {
            const mouseEvent = event.e as MouseEvent;
            const canvasCoords = this.getCanvasCoords(mouseEvent);
            this.handleCanvasClick(canvasCoords);
        });
        this.isDrawing$ = this.groundplanService.isDrawing$;
    };

    toggleActiveCategory(category: string, buttonId: number): void {
        this.activeCategory[category] =
            this.activeCategory[category] === buttonId ? null : buttonId;

        this.isCategoryActive = this.activeCategory[category] !== null;
    }

    isActiveCategory(category: string, buttonId: number): boolean {
        return this.activeCategory[category] === buttonId;
    }

    getButtonById(category: string, buttonId: number): any {
        switch (category) {
            case 'Raeume':
                return this.raeumeButtons.find((button) => button.id === buttonId);
            case 'SharedDesk':
                return this.sharedDeskButtons.find((button) => button.id === buttonId);
            case 'Stuehle':
                return this.stuehleButtons.find((button) => button.id === buttonId);
            default:
                return null;
        }
    }

    private getCanvasCoords(mouseEvent: MouseEvent): {
        x: number;
        y: number
    } {
        const canvasElement = this.canvas.getElement();
        const canvasBoundingRect = canvasElement.getBoundingClientRect();
        return {
            x: mouseEvent.clientX - canvasBoundingRect.left,
            y: mouseEvent.clientY - canvasBoundingRect.top,
        };
    }


    private handleCanvasClick(coords: {
        x: number;
        y: number
    }): void {
        for (const category in this.activeCategory) {
            if (Object.prototype.hasOwnProperty.call(this.activeCategory, category)) {
                const buttonId = this.activeCategory[category];
                if (buttonId !== null) {
                    this.handleButtonClick(
                        category,
                        this.getButtonById(category, buttonId),
                        coords
                    );
                }
            }
        }
    }

    /*
     Handles click events on UI buttons, delegating actions to specific methods
     based on the button's category and coordinates on the canvas.
    */
    handleButtonClick(
        category: string,
        button: any,
        coords: {
            x: number;
            y: number
        }
    ): void {
        if (this.isCategoryActive) {
            switch (category) {
                case 'Raeume':
                    this.addRoom(button, coords);
                    break;
                case 'SharedDesk':
                    this.addSharedDesk(button, coords);
                    break;
                case 'Stuehle':
                    this.addChair(button, coords);
                    break;
                default:
                    break;
            }
            this.isCategoryActive = false;
            this.activeCategory[category] = null;
        }
    }

    startDrawingFlur= () => {
        this.groundplanService.startDrawingCorridor();
    };

    startDrawingGrundriss = () => {
        this.groundplanService.startDrawingGroundplan();
    };

    addSharedDesk = (button: any, coords: {
        x: number;
        y: number
    }) => {
        switch (button.id) {
            case 1:
                return this.sharedDeskComponent.addSharedDesk(coords);
            case 2:
                return this.sharedDeskComponent.addRoundDesk(coords);
            default:
                return null;
        }
    };

    addRoom = (button: any, coords: {
        x: number;
        y: number
    }) => {
        switch (button.id) {
            case 1:
                return this.roomComponent.addRoom1(coords);
            case 2:
                return this.roomComponent.addRoom2(coords);
            default:
                return null;
        }
    };

    addChair = (button: any, coords: {
        x: number;
        y: number
    }) => {
        this.chairComponent.addChair(coords);
    };

    isActionButtonVisible(): boolean {
        return !!this.canvas && this.canvas!.getActiveObjects().length > 0;
    }

    isRoomPresent(): boolean {
        // Ensure the canvas is defined
        if (!!this.canvas) {
            // Iterate over all objects on the canvas
            const objects = this.canvas.getObjects();

            // Check if any object is a polygon
            for (let obj of objects) {
                if (obj.data && obj.data.type === 'room') {
                    return true;
                }
            }
        }

        // No polygon exists on the canvas
        return false;
    }

    /*isSpecificImageUrlPresent(dataURL: string): boolean {
        if (this.canvas) {
            return this.canvas.getObjects().some(obj => {
                return obj.type === 'image' && obj._element && obj._element.src.endsWith(dataURL);
            });
        }
        return false;
    }*/

    isPolygonPresent(): boolean {
        // Ensure the canvas is defined
        if (!!this.canvas) {
            // Iterate over all objects on the canvas
            const objects = this.canvas.getObjects();

            // Check if any object is a polygon
            for (let obj of objects) {
                if (obj.type === 'polygon') {
                    return true; // At least one polygon exists on the canvas
                }
            }
        }

        // No polygon exists on the canvas
        this.polygonGenerated = false;
        return false;
    }

    isPointPresent(): boolean {
        // Ensure the canvas is defined
        if (!!this.canvas) {
            // Iterate over all circle objects on the canvas
            const circles = this.canvas.getObjects('circle');

            // Check if any circle has a red fill
            for (let circle of circles) {
                if (circle.fill === 'red') {
                    return true; // At least one red circle exists on the canvas
                }
            }
        }

        // No red circle exists on the canvas
        return false;
    }

    // Manage the removal  of objects on the canvas.
    remove = () => {
        let activeObjects = this.canvas.getActiveObjects();
        this.canvas.discardActiveObject();
        if (activeObjects.length) {
            this.canvas.remove.apply(this.canvas, activeObjects);
        }
    };

    //Manage the cloning of objects on the canvas.
    clone = () => {
        let activeObjects = this.canvas.getActiveObjects();

        if (activeObjects) {
            activeObjects.forEach((object) => {
                object.clone((clone: fabric.Object) => {
                    if (object.group) {
                        let clonePosition = new fabric.Point(
                            object.left! + object.group.left! + 200,
                            object.top! + object.group.top!
                        );

                        this.canvas.add(
                            clone.set({
                                left: clonePosition.x,
                                top: clonePosition.y,
                            })
                        );
                    } else {
                        this.canvas.add(
                            clone.set({
                                left: object.left! + 200,
                                top: object.top,
                            })
                        );
                    }
                });
            });
        }
    };
    protected readonly UploadGroundplanComponent = this.uploadGroundplanComponent;
}
