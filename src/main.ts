import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
declare var cv: any; // Add this declaration to inform TypeScript about the `cv` variable



if (cv) { // If cv is already defined, OpenCV.js might have been loaded synchronously
  cv.onRuntimeInitialized = () => {
    console.log('OpenCV.js is ready.');
  };
} else { // If cv is not defined, attach an event listener or set a flag to check later
  document.addEventListener('DOMContentLoaded', () => {
    cv.onRuntimeInitialized = () => {
      console.log('OpenCV.js is ready.');
    };
  });
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
