# Laravel Parser Infrastructure — Apply to savadod-laravel

Copy these files into your Laravel project at `C:\OSPanel\domains\sadavod-laravel` (or `/var/www/online-parser.siteaacess.store` on server).

---

## File Mapping

| Source (this folder) | Target (Laravel project) |
|----------------------|--------------------------|
| app/Jobs/RunParserJob.php | app/Jobs/RunParserJob.php |
| app/Jobs/DownloadPhotosJob.php | app/Jobs/DownloadPhotosJob.php |
| app/Services/ParserStatsService.php | app/Services/ParserStatsService.php |
| app/Console/Kernel.php.example | app/Console/Kernel.php (merge schedule block) |
| database/migrations/2025_03_05_000001_create_parser_stats_table.php | database/migrations/ |
| routes/health.php | Include in routes/api.php or api/v1.php |
| routes/system_status.php | Include in routes/api.php or api/v1.php |
| routes/parser_stats.php | Include in routes/api.php or api/v1.php |
| tests/Unit/Jobs/RunParserJobTest.php | tests/Unit/Jobs/ |
| tests/Feature/HealthTest.php | tests/Feature/ |

---

## Steps

1. **Copy Jobs**: Place RunParserJob and DownloadPhotosJob in `app/Jobs/`.
2. **Copy ParserStatsService**: Place in `app/Services/`.
3. **Run migration**: `php artisan migrate`
4. **Patch ParserController**: Replace `exec(...)` with `RunParserJob::dispatch($job->id)`. See PARSER_CONTROLLER_PATCH.md.
5. **Add routes**: Include health, system/status, parser/stats in your API routes. Adjust path prefix (e.g. /api/v1).
6. **Update Kernel.php**: Add schedule block from Kernel.php.example.
7. **PhotoDownloadService**: Ensure `PhotoDownloadService::downloadBatch()` exists and accepts limit/product_id. If signature differs, adjust DownloadPhotosJob.
8. **ParserJob model**: Ensure `progress` is cast to array and contains `saved`, `errors`, `categories`.
9. **Tests**: Create ParserJob factory if missing, or adjust RunParserJobTest.

---

## Dependencies

- Laravel Queue (Redis driver)
- php-redis extension
- Supervisor (for queue workers)
