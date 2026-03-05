# Troubleshooting

## CORS Errors

**Symptom**: Browser blocks requests, "CORS policy" error.

**Fix**:
- Backend `.env`: `FRONTEND_URL=https://siteaacess.store,http://cheepy.loc`
- Backend `config/cors.php`: `allowed_origins` includes production origin
- Run: `php artisan config:clear && php artisan cache:clear`

## JWT Errors

**Symptom**: 401 or "Provided key is too short".

**Fix**:
- Set `JWT_SECRET` in backend `.env` (min 32 chars)
- Run: `php artisan config:clear`

## Queue Stopped

**Symptom**: Parser not running, jobs stuck.

**Fix**:
```bash
supervisorctl status
supervisorctl restart all
redis-cli ping  # ensure Redis is up
```

## Redis Disconnected

**Symptom**: Queue fails, "Connection refused".

**Fix**:
```bash
redis-cli ping
# If not PONG: systemctl start redis
```

## WebSocket Not Updating

**Symptom**: Parser progress not live.

**Fix**:
- Check `VITE_REVERB_APP_KEY` in frontend build
- Verify Reverb: `supervisorctl status reverb`
- SSE fallback: ParserPage uses EventSource; ensure `/parser/progress` returns SSE

## Parser Stuck

**Symptom**: Job running forever.

**Fix**:
- Call `POST /parser/stop`
- Check worker logs: `tail -f storage/logs/laravel.log`
- Restart workers: `supervisorctl restart parser-worker:*`
