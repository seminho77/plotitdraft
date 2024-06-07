import {EventEmitter, Injectable} from '@angular/core';
import {fabric} from 'fabric';
import {BehaviorSubject, map, Observable, Subject} from "rxjs";
import {HomeComponent} from "../home/home.component";
import {HttpClient} from "@angular/common/http";

declare const cv: any;

@Injectable({
    providedIn: 'root'
})

export class ImageProcessingService {
    public get dataURL(): string {
        return this._dataURL;
    }

    set dataURL(value: string) {
        this._dataURL = value;
    }

    private processedObjectSource = new BehaviorSubject<fabric.Object[]>([]);
    public processedObjects$ = this.processedObjectSource.asObservable();

    // Instance variables for pre-processing settings
    private resizeWidth: number = 800; // example width to resize the image
    private resizeHeight: number = 600; // example height to resize the image
    private kernelSize: number = 5; // kernel size for Gaussian blur
    private lowerThreshold: number = 50; // lower threshold for Canny edge detection
    private upperThreshold: number = 150; // upper threshold for Canny edge detection
    private blockSize: number = 11; // block size for adaptive thresholding
    private C: number = 2; // constant subtracted from the mean or weighted mean
    private _dataURL: string = '';


    private setBackgroundImageCallback?: (dataURL: string) => void;

    // This sets the callback from the HomeComponent
    public setOnBackgroundImageSet(callback: (dataURL: string) => void | undefined): void {
        this.setBackgroundImageCallback = callback;
    }

    // This triggers the callback when the image data URL is ready
    private triggerBackgroundImageSet(dataURL: string): void {
        if (this.setBackgroundImageCallback) {
            console.log('Setting background image via callback');
            this.setBackgroundImageCallback(dataURL);
        } else {
            console.log('No callback set');
        }
    }


    constructor() {
        /* // Emit test objects immediately for debugging
         setTimeout(() => {
           this.processedObjectSource.next([new fabric.Rect({
             left: 150, top: 150, fill: 'yellow', width: 100, height: 100
           })]);
         }, 5000); // Adjust timing as necessary
         */
    }

    getProcessedObjects() {
        return this.processedObjects$;
    }


    // opencv Verarbeitung mit Originalbild


        processFile2(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
          // Create FormData and append the file
          const formData = new FormData();
          formData.append('file', file);

          // Fetch request to upload the file to the Python server
          fetch('http://127.0.0.1:5000/upload', {
            method: 'POST',
            body: formData
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
              }
              return response.blob();
            })
            .then(blob => {
              // Convert blob to dataURL using FileReader
              const reader = new FileReader();
              reader.onloadend = () => {
                // Ensure the result is a string before assigning to dataURL
                if (typeof reader.result === 'string') {
                  console.log('Processed image base64 data:', reader.result);
                  this.dataURL = reader.result;
                  this.processFile(file);
                  resolve(); // Resolve the promise after setting the dataURL
                } else {
                  reject(new Error('Failed to convert blob to dataURL'));
                }
              };
              reader.onerror = () => {
                reject(new Error('Failed to read the blob as dataURL'));
              };
              reader.readAsDataURL(blob);
            })
            .catch(error => {
              console.error('Error processing file:', error);
              reject(error);
            });
        });
      }

/*
    processFile2(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            // Create FormData and append the file
            const formData = new FormData();
            formData.append('file', file);

            // Fetch request to upload the file to the Python server
            fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.statusText}`);
                    }
                    return response.blob();  // Get the blob directly from the response
                })
                .then(blob => {
                    // Convert blob to dataURL using FileReader for display or other uses
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        // Ensure the result is a string before assigning to dataURL
                        if (typeof reader.result === 'string') {
                            console.log('Processed image base64 data:', reader.result);
                            this.dataURL = reader.result;  // Set the dataURL for use in your application

                            // Additionally convert the blob to a File if you need to pass it to processFile
                            const newFile = new File([blob], "processedImage.png", {
                                type: blob.type
                            });
                            this.processFile(newFile);  // Call processFile with the new File object
                            resolve(); // Resolve the promise after all processing
                        } else {
                            reject(new Error('Failed to convert blob to dataURL'));
                        }
                    };
                    reader.onerror = () => {
                        reject(new Error('Failed to read the blob as dataURL'));
                    };
                    reader.readAsDataURL(blob);  // Start the FileReader process
                })
                .catch(error => {
                    console.error('Error processing file:', error);
                    reject(error);
                });
        });
    }*/


    /* delete
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
     }*/

    processFile(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event: any) => {
                try {
                    const dataURL = event.target.result;
                    const image = await this.loadImage(dataURL);
                    console.log('Image loaded for processing');
                    this.processImageWithOpenCV(image);
                    resolve();
                } catch (error) {
                    console.error('Error loading image', error);
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    private async loadImage(dataURL: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataURL;
        });
    }

    private processImageWithOpenCV(image: HTMLImageElement): void {
        console.log('processImageWithOpenCV called');

        console.log('Starting OpenCV processing');

        // Pre-processing steps
        // Resize image if necessary - can skip if image size is already optimal;
        //const resizedImage = this.resizeImage(image, newWidth, newHeight);

        // Convert image to a matrix for OpenCV processing
        const src = cv.imread(image);

        // Convert to grayscale
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // Apply Gaussian blur to reduce noise and improve edge detection
        const ksize = new cv.Size(5, 5); // Kernel size can be adjusted
        const sigmaX = 1.5; // Sigma values can be adjusted
        const sigmaY = 1.5;
        const borderType = cv.BORDER_DEFAULT;
        cv.GaussianBlur(gray, gray, ksize, sigmaX, sigmaY, borderType);

        // Apply Canny edge detection to find edges in the image
        const lowerThreshold = 50; // Lower threshold for hysteresis procedure
        const upperThreshold = 150; // Upper threshold for hysteresis procedure
        const edges = new cv.Mat();
        cv.Canny(gray, edges, lowerThreshold, upperThreshold);

        // Use adaptive thresholding for more robust binarization
        const maxValue = 255; // Maximum value to use with the THRESH_BINARY and THRESH_BINARY_INV thresholding types
        const blockSize = 11; // Size of a pixel neighborhood that is used to calculate a threshold value
        const C = 2; // Constant subtracted from the mean or weighted mean
        const adaptiveThresh = new cv.Mat();
        cv.adaptiveThreshold(edges, adaptiveThresh, maxValue, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, blockSize, C);

        // Find contours based on edges
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(adaptiveThresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        this.processContours(contours);

        // Detect red rectangles
        const redMask = this.detectRedAreas(src);
        this.processRedRectangles(redMask);




        // Clean up
        src.delete();
        gray.delete();
        edges.delete();
        adaptiveThresh.delete();
        contours.delete();
        hierarchy.delete();
    }

    private detectRedAreas(src: any): any {
        const hsv = new cv.Mat();
        cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);
        const lowerRed1 = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 100, 100, 0]); // Added fourth element for Scalar
        const upperRed1 = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [10, 255, 255, 0]); // Added fourth element for Scalar
        const lowerRed2 = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [160, 100, 100, 0]); // Added fourth element for Scalar
        const upperRed2 = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 255, 255, 0]); // Added fourth element for Scalar

        const mask1 = new cv.Mat();
        const mask2 = new cv.Mat();

        // Detect for the first range of red
        cv.inRange(hsv, lowerRed1, upperRed1, mask1);
        // Detect for the second range of red
        cv.inRange(hsv, lowerRed2, upperRed2, mask2);

        // Combine masks where either range is detected
        const redAreas = new cv.Mat();
        cv.add(mask1, mask2, redAreas);

        // Cleanup
        hsv.delete(); lowerRed1.delete(); upperRed1.delete();
        lowerRed2.delete(); upperRed2.delete(); mask1.delete(); mask2.delete();

        return redAreas;
    }


    private processRedRectangles(redMask: any): void {
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(redMask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        for (let i = 0; i < contours.size(); i++) {
            const cnt = contours.get(i);
            const rect = cv.boundingRect(cnt);
            if (rect.width > 30 && rect.height > 30) {
                const fabricRect = this.createFabricRect(rect);
                this.processedObjectSource.next([fabricRect]); // Emit the red rectangle as a fabric object
            }
            cnt.delete();
        }
        contours.delete(); hierarchy.delete(); redMask.delete();
    }

    private processContours(contours: any): void {
        let objects: fabric.Object[] = [];
        console.log(`Processing ${contours.size()} contours`);
        const minPolygonArea = 50000; // Define the minimum area to be considered for a polygon, adjust as needed.


        for (let i = 0; i < contours.size(); ++i) {
            const cnt = contours.get(i);

            const rect = cv.boundingRect(cnt);


            /*
            // adjust minimum size if needed
            if (rect.width > 30 && rect.height > 30) {
              const fabricRect = this.createFabricRect(rect);
              if (!this.isRectAlreadyProcessed(objects, fabricRect)) {
                objects.push(fabricRect);
              }
            }

             */


            // Approximate contour to polygon
            const epsilon = 0.01 * cv.arcLength(cnt, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(cnt, approx, epsilon, true);

            // Calculate the area of the approximated contour
            const area = cv.contourArea(approx);

            // Check for the polygon area before deciding to create a fabric.Polygon
            if (approx.rows >= 3 && area > minPolygonArea) {
                objects.push(this.createFabricPolygonFromContour(approx));
            } /* else if (approx.rows === 4) {
        // Process as rectangle if it's 4 sides and doesn't qualify as a large polygon
        const fabricRect = this.createFabricRectFromContour(approx);
        objects.push(fabricRect);
      } */
            // Clean up for avoiding of memory leaks
            cnt.delete();
            approx.delete();
        }

        console.log("Emitting processed objects:", objects);
        this.processedObjectSource.next(objects);
    }

    private createFabricRect(rect: any): fabric.Rect {
        return new fabric.Rect({
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 2
        });
    }

    private createFabricPolygonFromContour(contour: any): fabric.Polygon {
        const points = [];
        for (let i = 0; i < contour.rows; i++) {
            points.push({
                x: contour.data32S[i * 2],
                y: contour.data32S[i * 2 + 1]
            });
        }
        const polygon = new fabric.Polygon(points, {
            stroke: 'red',
            strokeWidth: 2,
            fill: 'transparent'
        });
        return polygon;
    }


    private isRectAlreadyProcessed(objects: fabric.Object[], newRect: fabric.Rect): boolean {
        return objects.some(obj => {
            return obj.left === newRect.left && obj.top === newRect.top &&
                obj.width === newRect.width && obj.height === newRect.height;
        });
    }

  /*  private createFabricRect(rect: any): fabric.Rect {
        return new fabric.Rect({
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 2
        });
    }*/

    private createFabricPolygon(poly: any): fabric.Polygon {
        let points = [];
        for (let i = 0; i < poly.rows; ++i) {
            points.push({
                x: poly.data32F[i * 2],
                y: poly.data32F[i * 2 + 1]
            });
        }
        return new fabric.Polygon(points, {
            stroke: 'red',
            strokeWidth: 2,
            fill: 'transparent',
            selectable: true
        });
    }

    private processCircles(circles: any): void {
        const objects: fabric.Object[] = this.processedObjectSource.getValue(); // Get the current processed objects
        for (let i = 0; i < circles.cols; ++i) {
            const x = circles.data32F[i * 3];
            const y = circles.data32F[i * 3 + 1];
            const radius = circles.data32F[i * 3 + 2];
            const circle = new fabric.Circle({
                left: x - radius,
                top: y - radius,
                radius: radius,
                stroke: 'blue',
                strokeWidth: 2,
                fill: 'transparent',
                selectable: true
            });
            objects.push(circle);
        }
        console.log("Emitting processed circles:", objects);
        this.processedObjectSource.next(objects); // Emitting updated list including circles
    }
}
