# UniHub - Environment Variable Setup

To run UniHub locally, you need to set up environment variables. Follow the steps below to configure your `.env` file.

## 📌 Step 1: Create a `.env` File

Copy the example environment file and rename it:

### Linux/macOS:
```sh
cp .env.example .env
```

### Windows:
```sh
copy .env.example .env
```

## 📌 Step 2: Configure Environment Variables

Open the `.env` file and add in the following values:

```
SESSION_KEY=your-session-key
JWT_SECRET=your-jwt-secret
BACKEND_PORT=your-port-number
FRONTEND=https://your-frontend-url.com
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

### Optional Variables:

These are only required if you want to use these specific services.

| Variable Name             | Description |
|---------------------------|-------------|
| `GEMINI_KEY`          | Your Google Gemini API key for AI-based features. Get it from [Google AI Console](https://ai.google.dev). |
| `ALGOLIA_APPLICATION_ID` | Your Algolia App ID for search functionality. Get it from [Algolia Dashboard](https://www.algolia.com/). |
| `ALGOLIA_ADMIN_API_KEY`  | Your Algolia Admin API key for managing search indices. |


## 📌 Step 3: Run the Project

Once your `.env` file is configured, start the backend:

### Linux/macOS:
```sh
npm install  # Install dependencies
npm start    # Start the backend
```

### Windows (Command Prompt or PowerShell):
```sh
npm install  # Install dependencies
npm start    # Start the backend
```

For any issues, feel free to open a GitHub issue. 🚀

