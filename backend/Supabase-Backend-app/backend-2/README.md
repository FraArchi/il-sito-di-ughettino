# Ugo Backend

This is the backend for the Ugo project, which provides the necessary API and services for the application.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ugo-backend.git
   cd ugo-backend/backend
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and fill in the required environment variables.

## Usage

To start the server, run:
```
npm start
```

The server will run on `http://localhost:3000`.

## Environment Variables

Make sure to set the following environment variables in your `.env` file:

- `DATABASE_URL`: Connection string for the PostgreSQL database.
- `REDIS_URL`: Connection string for the Redis server.
- `JWT_SECRET`: Secret key for JWT authentication.
- `AWS_ACCESS_KEY_ID`: AWS access key ID for S3.
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key for S3.
- `SENDGRID_API_KEY`: API key for SendGrid.
- Other variables as specified in the `.env.example` file.

## API Endpoints

Refer to the documentation in the `src/controllers/index.js` file for available API endpoints and their usage.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.