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
2. Start mock backend from project: https://github.com/mittalpratik/mockDocUpload/tree/master
3. Start Angular with proxy (npm start has the command added under package.json)


API endpoints:
1. /api/auth/login: Authenticates user (returns tokens)
2. /api/auh/refresh: Returns new access/refresh tokens
3. /api/upload: Uploads files with simulated progress

Things which need work:
1. Testing is not functional since the application is Zoneless. Will need some time to work on that.
2. For queued Files on upload component needs better change detection, approach in mind is by using Signals.
3. Re-uploadof already uploaded file needs to be removed to avoid duplicacy.
4. improve thenaming convention for services to communicate better. Default cli naming_convention removes suffxes like 'service' so have to manually add them.


