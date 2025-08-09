# Render Deploy Configuration

## Dockerfile Path
- **Dockerfile**: `backend/Dockerfile`
- **Build Context**: `backend/` (root del progetto)

## Web Service Settings
- **Start Command**: `node src/server.js`
- **Port**: `3000` (automatico da `process.env.PORT`)
- **Health Check Path**: `/health`

## Environment Variables (Required)

### Core
```
NODE_ENV=production
HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@host:port/db
CORS_ORIGIN=https://fraarchi.github.io/il-sito-di-ughettino
```

### Authentication
```
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

### Supabase (se necessario)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Environment Variables (Optional)

### Rate Limiting
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Logging
```
LOG_LEVEL=info
```

### Email (se necessario)
```
FROM_EMAIL=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SUPPORT_EMAIL=support@yourdomain.com
```

### File Upload
```
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

## Notes
- Il Dockerfile è stato aggiornato per rimuovere la dipendenza da `wait-for-it.sh` che bloccava il deploy
- Render fornisce automaticamente `DATABASE_URL` se aggiungi un PostgreSQL add-on
- Per Redis, aggiungi `REDIS_URL` se necessario
- Il frontend su GitHub Pages deve essere in `CORS_ORIGIN`
