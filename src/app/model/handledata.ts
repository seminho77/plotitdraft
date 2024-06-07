export interface HandleData {
    polygons: Array<{
        shape: fabric.Polygon | fabric.Rect,
        pointIndex: number
    }>;
}
