# Ugo Backend Project

This repository contains the backend code for the Ugo project, which is a web application designed to manage various functionalities related to user interactions and data handling.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ugo-backend.git
   ```
2. Navigate to the backend directory:
   ```
   cd ugo-backend/backend
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on the `.env.example` template and fill in the required environment variables.

## Usage

To start the backend server, run:
```
npm start
```
The server will be running on `http://localhost:3000`.

## Environment Variables

Make sure to set up the following environment variables in your `.env` file:

- `DATABASE_URL`: Connection string for the PostgreSQL database.
- `REDIS_URL`: Connection string for the Redis server.
- `JWT_SECRET`: Secret key for JWT authentication.
- `AWS_ACCESS_KEY_ID`: AWS access key ID for S3.
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key for S3.
- `SENDGRID_API_KEY`: API key for SendGrid email service.
- Other variables as specified in the `.env.example` file.

## Folder Structure

```
ugo-backend
├── backend
│   ├── src
│   │   ├── config          # Configuration files
│   │   ├── controllers     # Request handling logic
│   │   ├── routes          # API routes
│   │   ├── middlewares     # Middleware functions
│   │   ├── services        # Business logic and database interactions
│   │   ├── models          # Data models
│   │   ├── utils           # Utility functions
│   │   └── app.js          # Entry point of the application
│   ├── package.json        # NPM package configuration
├── supabase                # Database initialization scripts
├── .github                 # GitHub Actions workflows
├── .env.example            # Template for environment variables
└── .gitignore              # Files to ignore in Git
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.