import {Component} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ImageProcessingService} from "../services/image-processing.service";
import {HomeComponent} from "../home/home.component";

@Component({
  selector: 'app-upload-groundplan',
  templateUrl: './upload-groundplan.component.html',
  styleUrls: ['./upload-groundplan.component.scss']
})

export class UploadGroundplanComponent {
    uploadedImage: string | ArrayBuffer | null = null;
    isOverlayVisible = true; // Initially visible for demonstration

  // Assuming isOverlayVisible controls the visibility of the overlay
  constructor(private router: Router, private route: ActivatedRoute, private imageProcessingService: ImageProcessingService) {}

  closeOverlay(): void {
    this.isOverlayVisible = false; // Hide the overlay
    this.router.navigate(['/'], { relativeTo: this.route.root } ); // Navigate back to the main page or a specific route
  }


  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.readFile(file);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    // Check if event.dataTransfer and files exist
    if (event.dataTransfer && event.dataTransfer.files.length) {
      const file = event.dataTransfer.files[0];
      if (file) {
        this.readFile(file);
      }
      // Assuming you want to hide the overlay once a file is dropped
      this.isOverlayVisible = false;
    }
  }

  onDragOver(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }

  onDragLeave(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }

  readFile(file: File): void {
    console.log("Processing file:", file.name);
   this.imageProcessingService.processFile2(file).then(() => {
      console.log('Image processed');
      this.router.navigate(['/']); // Optional: navigate back or close overlay
    }).catch(error => {
      console.error('Error processing file', error);
    });
  /* this.imageProcessingService.processFile(file).then(() => {
          console.log('Image processed');
          this.router.navigate(['/']); // Optional: navigate back or close overlay
      }).catch(error => {
          console.error('Error processing file', error);
      });*/
  }

  // Method to toggle the overlay visibility
  toggleOverlay(): void {
    this.isOverlayVisible = !this.isOverlayVisible;
    // Optionally reset the uploaded image or any other state
    this.uploadedImage = null;
  }


}
