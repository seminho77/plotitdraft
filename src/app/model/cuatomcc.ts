class CustomCircle extends fabric.Circle {
    polygon?: fabric.Polygon;
    pointIndex?: number;

    constructor(options?: fabric.ICircleOptions) {
        super(options);
    }
}
