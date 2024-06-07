import {Component, AfterViewInit} from '@angular/core';
import {fabric} from 'fabric';
import {GroundplanService} from './services/groundplan.service';
import {RoomComponent} from './components/room.component';
import {SharedDeskComponent} from './components/shared-desk.component';
import {ChairComponent} from './components/chair.component';
import {Observable} from "rxjs";
import {ImageProcessingService} from './services/image-processing.service';
import {Router} from "@angular/router";
import {UploadGroundplanComponent} from "./upload-groundplan/upload-groundplan.component";
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})

/*
 This class acts as a central coordinator for the application, handling UI interactions,
 managing state changes, and integrating various components for
 a cohesive user experience in a canvas-based layout tool.
*/
export class AppComponent {
}



