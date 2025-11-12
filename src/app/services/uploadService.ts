import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, Subject, Observable, from, defer, timer } from 'rxjs';
import { mergeMap, map, takeUntil, finalize, catchError } from 'rxjs/operators';
import { FileUpload } from '../models/fileUpload.model';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly API_UPLOAD = `${environment.apiUrl}/upload`; 
  private readonly MAX_CONCURRENCY = 3;
  private readonly MAX_RETRIES = 2;
  private readonly BASE_RETRY_DELAY_MS = 1000;

  // a data structure used to store maps that will basically maintain the order of tasks as they are queued
  private tasksMap = new Map<string, FileUpload>();

  // observable task list for UI
  private tasksSubject = new BehaviorSubject<FileUpload[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  // queue subject to feed the processing pipeline
  private queue$ = new Subject<FileUpload>();

  // global cancel all
  private cancelAll$ = new Subject<void>();

  constructor(private http: HttpClient) {
    // start the processing pipeline: concurrency controlled with mergeMap
    this.queue$
      .pipe(
        mergeMap(task => this.processTask$(task), this.MAX_CONCURRENCY)
      )
      .subscribe({
        next: () => { /* individual task streams handle state updates */ },
        error: (err) => console.error('Upload queue error', err)
      });
  }

  /** PUBLIC API **/

  // Add one or more files
  addFiles(files: FileList | File[]) {
    const list = Array.isArray(files) ? files : Array.from(files);
    for (const file of list) {
      const task = this.createTask(file);
      // validate
      const validationError = this.validateFile(file);
      if (validationError) {
        task.status = 'failed';
        task.error = validationError;
        this.tasksMap.set(task.id, task);
        this.emitTasks();
        continue;
      }

      task.status = 'queued';
      this.tasksMap.set(task.id, task);
      this.emitTasks();
      this.queue$.next(task); // push to upload queue
    }
  }

  // Cancel a single task
  cancel(taskId: string) {
    const t = this.tasksMap.get(taskId);
    if (!t) return;
    // unsubscribe if uploading
    if (t._sub) {
      t._sub.unsubscribe();
      t._sub = null;
    }
    t.status = 'canceled';
    t.error = 'Canceled by user';
    this.tasksMap.set(taskId, t);
    this.emitTasks();
  }

  // Retry a failed task
  retry(taskId: string) {
    const t = this.tasksMap.get(taskId);
    if (!t) return;
    if (t.status === 'uploading') return;
    t.attempts = 0;
    t.progress = 0;
    t.status = 'queued';
    t.error = null;
    this.tasksMap.set(taskId, t);
    this.emitTasks();
    this.queue$.next(t);
  }

  // Cancel all uploads
  cancelAll() {
    // signal any in-flight uploads to stop
    this.cancelAll$.next();
    // update task states
    this.tasksMap.forEach((t) => {
      if (t.status === 'uploading' || t.status === 'queued' || t.status === 'pending') {
        if (t._sub) {
          t._sub.unsubscribe();
          t._sub = null;
        }
        t.status = 'canceled';
        t.error = 'Canceled by user';
      }
    });
    this.emitTasks();
  }

  clearAllAndCancel() {
    // unsubscribe current subs 
    for (const t of this.tasksMap.values()) {
      if (t._sub) {
        try { 
          t._sub.unsubscribe(); 
        } catch {}
        t._sub = null;
      }
    }

    this.tasksMap.clear();
    this.emitTasks();
  }

  /** INTERNAL HELPERS **/

  private emitTasks() {
    // keep order deterministic (e.g., original insertion)
    this.tasksSubject.next(Array.from(this.tasksMap.values()));
  }

  private createId(): string {
    // simple id generator
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private createTask(file: File): FileUpload {
    return {
      id: this.createId(),
      file,
      progress: 0,
      status: 'pending',
      error: null,
      attempts: 0,
      _sub: null
    };
  }

  private validateFile(file: File): string | null {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) return 'Unsupported file type';
    if (file.size > maxSize) return 'File exceeds 10MB';
    return null;
  }

  // Returns an observable that performs upload and updates task state
  private processTask$(task: FileUpload): Observable<void> {
    // if already completed/canceled/failed, skip
    if (task.status === 'completed' || task.status === 'canceled') {
      return from([void 0]);
    }

    // Mark as uploading
    task.status = 'uploading';
    task.progress = 0;
    task.error = null;
    this.tasksMap.set(task.id, task);
    this.emitTasks();

    // create the upload observable (with retry logic)
    const upload$ = defer(() => this.attemptUpload(task, 0)).pipe(
      // ensure any external cancelAll signal will stop this upload
      takeUntil(this.cancelAll$),
      finalize(() => {
        // cleanup subscription reference (will be set below)
        task._sub = null;
        this.tasksMap.set(task.id, task);
        this.emitTasks();
      }),
      map(() => void 0) // outer observable returns void on success
    );

    // subscribe here so we can store the subscription for cancel
    const sub = upload$.subscribe({
      next: () => {
        task.status = 'completed';
        task.progress = 100;
        task.error = null;
        this.tasksMap.set(task.id, task);
        this.emitTasks();
      },
      error: (err) => {
        task.status = 'failed';
        task.error = (err && err.message) ? err.message : String(err);
        this.tasksMap.set(task.id, task);
        this.emitTasks();
      }
    });

    task._sub = sub;
    this.tasksMap.set(task.id, task);
    this.emitTasks();

    // Return observable that completes when subscription completes
    return new Observable<void>((observer) => {
      sub.add(() => {
        observer.next();
        observer.complete();
      });
      // if user unsubscribes the returned observable, also cancel the sub
      return () => {
        sub.unsubscribe();
      };
    });
  }

  // attempt number starts from 0
  private attemptUpload(task: FileUpload, attempt: number): Observable<void> {
    task.attempts = attempt;
    this.tasksMap.set(task.id, task);
    this.emitTasks();

    const form = new FormData();
    form.append('file', task.file, task.file.name);

    // create HttpRequest so we can get progress events
    const req = new HttpRequest('POST', this.API_UPLOAD, form, {
      reportProgress: true
    });

    return new Observable<void>((observer) => {
      const sub = this.http.request(req).pipe(
        catchError(err => {
          // pass through error to handle in subscribe below
          throw err;
        })
      ).subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress) {
            const loaded = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
            task.progress = loaded;
            task.status = 'uploading';
            this.tasksMap.set(task.id, task);
            this.emitTasks();
          } else if (event.type === HttpEventType.Response) {
            // success
            task.progress = 100;
            this.tasksMap.set(task.id, task);
            this.emitTasks();
          }
        },
        error: (err) => {
          // determine retry or final fail
          if (attempt < this.MAX_RETRIES && this.isRetriableError(err)) {
            const backoff = this.BASE_RETRY_DELAY_MS * Math.pow(2, attempt); // exponential
            // schedule next attempt
            timer(backoff).subscribe(() => {
              // start next attempt (recursive)
              this.attemptUpload(task, attempt + 1).subscribe({
                next: () => observer.next(),
                error: (e) => observer.error(e),
                complete: () => observer.complete()
              });
            });
          } else {
            observer.error(err);
          }
        },
        complete: () => {
          observer.next();
          observer.complete();
        }
      });

      // store subscription so cancel works
      task._sub = sub;
      this.tasksMap.set(task.id, task);
      this.emitTasks();

      // teardown: if subscriber unsubscribes, cleanup
      return () => {
        sub.unsubscribe();
      };
    });
  }

  private isRetriableError(err: any): boolean {
    // Retry for network failures or 5xx errors. Do not retry 4xx (client) errors
    if (!err || !err.status) return true; // network error - retry
    return err.status >= 500 && err.status < 600;
  }
}
