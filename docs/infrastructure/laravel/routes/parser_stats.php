<?php
/**
 * Add to api routes. Protects with auth.
 * GET /parser/stats
 * GET /parser/stats/daily
 * GET /parser/stats/errors
 */

use App\Services\ParserStatsService;

Route::get('/parser/stats', function (ParserStatsService $stats) {
    return response()->json($stats->getStats());
});

Route::get('/parser/stats/daily', function (ParserStatsService $stats) {
    $days = (int) request('days', 30);
    return response()->json(['data' => $stats->getDaily($days)]);
});

Route::get('/parser/stats/errors', function (ParserStatsService $stats) {
    $days = (int) request('days', 30);
    return response()->json(['data' => $stats->getErrorsDaily($days)]);
});
