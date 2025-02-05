# UniHub - Environment Variable Setup

To run UniHub locally, you need to set up environment variables. Follow the steps below to configure your `.env` file.

## 📌 Step 1: Create a `.env` File

Copy the example environment file and rename it:

### Linux/macOS:
```sh
cp .example.env .env
```

### Windows:
```sh
copy .example.env .env
```

## 📌 Step 2: Configure Environment Variables

Open the `.env` file and add in the following values:

```
SESSION_KEY=your-session-key
JWT_SECRET=your-jwt-secret
BACKEND_PORT=3000
FRONTEND=https://your-frontend-url.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REFRESH_TOKEN=your-google-refresh-token
SUPABASE_DB=your-supabase-db-url
GEMINI_KEY=your-gemini-api-key
ALGOLIA_APPLICATION_ID=your-algolia-app-id
ALGOLIA_ADMIN_API_KEY=your-algolia-admin-api-key
```

### Required Variables:

These are necessary for running the backend.

| Variable Name  | Description |
|---------------|-------------|
| `SESSION_KEY` | A random string used for session management (e.g., `your-random-session-key`). |
| `JWT_SECRET`           | A secret key for signing JWT tokens (generate a random string with `openssl rand -hex 32`). |
| `BACKEND_PORT` | The port where the backend will run locally (default: `3000`). |
| `FRONTEND` | The URL of the frontend deployment (e.g., `https://your-frontend-url.com`). |
| `ALGOLIA_APPLICATION_ID` | Your Algolia App ID for search functionality. Get it from [Algolia Dashboard](https://www.algolia.com/). |
| `ALGOLIA_ADMIN_API_KEY`  | Your Algolia Admin API key for managing search indices. |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID for authentication and API access. |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret for authentication. |
| `GOOGLE_REFRESH_TOKEN` | A refresh token to maintain access to Google APIs. |


### Optional Variables:

These are only required if you want to use these specific services.

| Variable Name             | Description |
|---------------------------|-------------|
| `SUPABASE_DB`         | The PostgreSQL connection string for Supabase (e.g., `postgresql://user:password@host:port/dbname`). |
| `GEMINI_KEY`          | Your Google Gemini API key for AI-based features. Get it from [Google AI Console](https://ai.google.dev). |


## 📌 Step 3: Run the Project

Once your `.env` file is configured, start the backend:

### Linux/macOS:
```sh
npm install
npm start
```

### Windows:
```sh
npm install
npm start
```

For any issues, feel free to open a GitHub issue.