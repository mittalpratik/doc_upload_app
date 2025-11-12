Features:
1. Authentication:
  - Login page with form validation
  - JWT-based access & refresh tokens
  - Auto-logout on token expiration
  - Route guard to protect upload routes
  - Interceptor to attach tokens to each request

2. Document Upload:
  -  Multi-file upload (select or drag-and-drop)
  -  Queue view with progress bars per file
  -  Concurrent uploads (max 3 at a time)
  -  Validation: only PDF, DOCX, TXT up to 10MB
  -  Cancel individual/all uploads
  -  Retry failed uploads
  -  Dynamic upload statuses: Pending, Uploading, Success, Failed
  -  Handles network errors and 401 unauthorized responses gracefully

Run Locally:
1. Install dependency using 'npm install'
2. Start mock backend from project:
3. Start Angularwith proxy


API endpoints:
1. /api/auth/login: Authenticates user (returns tokens)
2. /api/auh/refresh: Returns new access/refresh tokens
3. /api/upload: Uploads files with simulated progress

