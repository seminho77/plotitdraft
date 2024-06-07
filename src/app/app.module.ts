import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {MatTooltipModule} from "@angular/material/tooltip";
import {UploadGroundplanComponent} from './upload-groundplan/upload-groundplan.component';
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import { HomeComponent } from './home/home.component';

@NgModule({
    declarations: [AppComponent, UploadGroundplanComponent, HomeComponent,],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ToolbarModule,
        ButtonModule,
        ToggleButtonModule,
        FormsModule,
        MatTooltipModule,
        MatButtonModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {
}
