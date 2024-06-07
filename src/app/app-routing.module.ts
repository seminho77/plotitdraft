import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {UploadGroundplanComponent} from "./upload-groundplan/upload-groundplan.component";
import {HomeComponent} from "./home/home.component";


const routes: Routes = [
  {path: 'upload', component: UploadGroundplanComponent},
  { path: '', component: HomeComponent},

  // redirect to the upload page as the default route for demonstration
  //{path: '', redirectTo: '/upload', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {



}

