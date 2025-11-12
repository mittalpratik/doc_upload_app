import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FileUpload } from '../../models/fileUpload.model';
import { UploadService } from '../../services/uploadService';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload',
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload implements OnInit, OnDestroy {
  @ViewChild('fileInput', { static: true }) fileInput!: ElementRef<HTMLInputElement>;
  isDragOver = false;

  constructor(public uploadService: UploadService) {}

  ngOnInit(): void {
    this.uploadService.clearAllAndCancel();
  }

  openFilePicker() {
    this.fileInput.nativeElement.click();
  }

  onFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.uploadService.addFiles(input.files);
      input.value = '';
    }
  }

  onDragEnter(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.isDragOver = true;
  }

  onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    // required to allow drop
    evt.dataTransfer!.dropEffect = 'copy';
    this.isDragOver = true;
  }

  onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    // if leaving to a child element, still may be in drop zone; simple reset is fine
    this.isDragOver = false;
  }

  onDrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.isDragOver = false;
    const dt = evt.dataTransfer;
    if (!dt) return;
    const files = dt.files;
    if (files && files.length > 0) {
      this.uploadService.addFiles(files);
    } else {
      // Some browsers allow directories or items — you can handle DataTransferItemList if needed
      const items = dt.items;
      if (items && items.length) {
        this.handleDataTransferItems(items);
      }
    }
  }

  private handleDataTransferItems(items: DataTransferItemList) {
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) this.uploadService.addFiles(files);
  }

  cancelTask(task: FileUpload) {
    this.uploadService.cancel(task.id);
  }

  retryTask(task: FileUpload) {
    this.uploadService.retry(task.id);
  }

  cancelAll() {
    this.uploadService.cancelAll();
  }

  trackByTaskId(index: number, task: FileUpload) {
    return task.id;
  }

  ngOnDestroy() {
    this.uploadService.clearAllAndCancel();
  }
}
