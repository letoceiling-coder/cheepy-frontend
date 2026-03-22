<?php
/**
 * Full E2E mapping verification on production Laravel host.
 * Run: php /tmp/server_mapping_e2e.php [/var/www/online-parser.siteaacess.store]
 */
declare(strict_types=1);

$root = $argv[1] ?? '/var/www/online-parser.siteaacess.store';
chdir($root);
require $root . '/vendor/autoload.php';
$app = require_once $root . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AdminUser;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\DB;

function httpJson(string $method, string $url, string $token, ?string $body = null): array {
    $ch = curl_init($url);
    $headers = [
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
        'Content-Type: application/json',
    ];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 60,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $raw];
}

function j(string $raw): array {
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

$u = AdminUser::where('is_active', true)->orderBy('id')->first();
if (!$u) {
    fwrite(STDERR, "NO_ADMIN_USER\n");
    exit(1);
}
$secret = config('jwt.secret') ?: ('fallback-' . config('app.key'));
$payload = [
    'sub' => $u->id,
    'email' => $u->email,
    'role' => $u->role,
    'iat' => time(),
    'exp' => time() + 7200,
];
$token = JWT::encode($payload, $secret, 'HS256');
$base = 'https://online-parser.siteaacess.store/api/v1';

echo "=== STEP 0: donor_categories columns (for safe INSERT) ===\n";
$cols = DB::select('SHOW COLUMNS FROM donor_categories');
$colNames = [];
foreach ($cols as $c) {
    $colNames[] = $c->Field ?? $c->field;
}
echo implode(', ', $colNames) . "\n\n";

// --- STEP 1: unmapped donor or INSERT ---
echo "=== STEP 1: Find or create unmapped donor_category ===\n";
$unmappedId = DB::table('donor_categories as d')
    ->leftJoin('category_mapping as m', 'm.donor_category_id', '=', 'd.id')
    ->whereNull('m.id')
    ->orderBy('d.id')
    ->value('d.id');

$created = false;
if (!$unmappedId) {
    $slug = 'e2e-test-donor-' . time();
    $ext = 'e2e-' . time();
    $candidates = [
        'external_id' => $ext,
        'name' => 'E2E Test Donor Category ' . $ext,
        'slug' => $slug,
        'parent_id' => null,
        'source_url' => 'https://example.com/e2e/' . $slug,
        'parser_enabled' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ];
    $insert = [];
    foreach ($candidates as $key => $val) {
        if (in_array($key, $colNames, true)) {
            $insert[$key] = $val;
        }
    }
    if (!count($insert)) {
        fwrite(STDERR, "Cannot build INSERT for donor_categories\n");
        exit(1);
    }
    $unmappedId = (int) DB::table('donor_categories')->insertGetId($insert);
    $created = true;
    echo "INSERT donor_categories id=$unmappedId (new row)\n";
} else {
    echo "Found existing unmapped donor_category_id=$unmappedId\n";
}

// Pick two catalog categories for apply + remap
$catalogA = (int) DB::table('catalog_categories')->orderBy('id')->value('id');
$catalogB = (int) DB::table('catalog_categories')->where('id', '!=', $catalogA)->orderBy('id')->value('id');
if (!$catalogA) {
    fwrite(STDERR, "NO_CATALOG_CATEGORY\n");
    exit(1);
}
if (!$catalogB) {
    $catalogB = $catalogA;
}
echo "catalogA=$catalogA catalogB=$catalogB\n\n";

// --- Suggestions BEFORE apply ---
echo "=== STEP 1b: GET suggestions (expect donor $unmappedId present) ===\n";
[$cSug, $rawSug] = httpJson('GET', $base . '/admin/catalog/mapping/suggestions?limit=2000', $token);
$sugData = j($rawSug)['data'] ?? [];
$sugIds = array_column(is_array($sugData) ? $sugData : [], 'donor_id');
$inSugBefore = in_array((int) $unmappedId, array_map('intval', $sugIds), true);
echo "HTTP $cSug in_suggestions=" . ($inSugBefore ? 'YES' : 'NO') . " count=" . count($sugIds) . "\n";
if (!$inSugBefore && $cSug === 200) {
    echo "WARN: new donor not in suggestions yet (algorithm may skip); continuing POST anyway.\n";
}
echo "\n";

// --- Full mapping list (all pages), optional filters like frontend ---
function fetchAllMappings(string $base, string $token, array $filters = []): array {
    $all = [];
    $page = 1;
    $perPage = 100;
    do {
        $query = array_merge(['per_page' => $perPage, 'page' => $page], $filters);
        $qs = http_build_query($query);
        [$c, $raw] = httpJson('GET', $base . '/admin/catalog/category-mapping?' . $qs, $token);
        if ($c !== 200) {
            return ['error' => $c, 'raw' => $raw];
        }
        $j = j($raw);
        $chunk = $j['data'] ?? [];
        if (!is_array($chunk)) {
            break;
        }
        foreach ($chunk as $row) {
            $all[] = $row;
        }
        $last = (int) ($j['meta']['last_page'] ?? 1);
        $page++;
    } while ($page <= $last);
    return $all;
}

// --- Simulate UI: mapped donor ids from full list ---
$fullBefore = fetchAllMappings($base, $token);
if (isset($fullBefore['error'])) {
    echo "fetchAllMappings failed HTTP {$fullBefore['error']}\n";
    exit(1);
}
$mappedSetBefore = [];
foreach ($fullBefore as $m) {
    if (isset($m['donor_category_id'])) {
        $mappedSetBefore[(int) $m['donor_category_id']] = true;
    }
}
$wasMappedBefore = isset($mappedSetBefore[(int) $unmappedId]);
echo "=== UI logic: mappedSet has unmapped donor before apply? " . ($wasMappedBefore ? 'YES' : 'NO') . " ===\n\n";

// --- STEP 2: POST APPLY (create mapping) ---
echo "=== STEP 2: POST APPLY donor=$unmappedId -> catalog=$catalogA ===\n";
$bodyApply = json_encode([
    'donor_category_id' => (int) $unmappedId,
    'catalog_category_id' => $catalogA,
    'confidence' => 87,
    'is_manual' => true,
]);
[$cPost1, $rawPost1] = httpJson('POST', $base . '/admin/catalog/category-mapping', $token, $bodyApply);
echo "HTTP $cPost1\n";
$jPost1 = j($rawPost1);
$newRowId = isset($jPost1['data']['id']) ? (int) $jPost1['data']['id'] : null;
echo "response.data.id=" . ($newRowId ?? 'null') . " donor=" . ($jPost1['data']['donor_category_id'] ?? '?') . " cat=" . ($jPost1['data']['catalog_category_id'] ?? '?') . "\n";

$dbRow = DB::table('category_mapping')->where('donor_category_id', $unmappedId)->first();
echo "DB row exists: " . ($dbRow ? 'YES id=' . $dbRow->id : 'NO') . "\n";

$dups = DB::select('SELECT donor_category_id, COUNT(1) as cnt FROM category_mapping GROUP BY donor_category_id HAVING COUNT(1) > 1');
echo "duplicates: " . json_encode($dups) . "\n\n";

if (!in_array($cPost1, [200, 201], true) || !$dbRow) {
    fwrite(STDERR, "APPLY_FAILED\n");
    exit(1);
}

// --- List contains row (all pages, status=mapped) ---
$listPages = fetchAllMappings($base, $token, ['status' => 'mapped']);
if (isset($listPages['error'])) {
    echo "mapped list fetch failed HTTP {$listPages['error']}\n";
    exit(1);
}
$foundInList = false;
foreach ($listPages as $row) {
    if ((int) ($row['donor_category_id'] ?? 0) === (int) $unmappedId) {
        $foundInList = true;
        break;
    }
}
echo "=== mapping list (status=mapped, all pages) contains donor: " . ($foundInList ? 'YES' : 'NO') . " total_rows=" . count($listPages) . " ===\n\n";

// --- Suggestions AFTER apply ---
[$cSug2, $rawSug2] = httpJson('GET', $base . '/admin/catalog/mapping/suggestions?limit=2000', $token);
$sugData2 = j($rawSug2)['data'] ?? [];
$sugIds2 = array_column(is_array($sugData2) ? $sugData2 : [], 'donor_id');
$inSugAfter = in_array((int) $unmappedId, array_map('intval', $sugIds2), true);
echo "=== STEP 4: suggestions still include mapped donor $unmappedId? " . ($inSugAfter ? 'YES' : 'NO') . " HTTP $cSug2 ===\n\n";

// --- STEP 3: REMAP to catalogB ---
echo "=== STEP 3: POST REMAP donor=$unmappedId -> catalog=$catalogB ===\n";
$bodyRemap = json_encode([
    'donor_category_id' => (int) $unmappedId,
    'catalog_category_id' => $catalogB,
    'confidence' => 92,
    'is_manual' => true,
]);
[$cPost2, $rawPost2] = httpJson('POST', $base . '/admin/catalog/category-mapping', $token, $bodyRemap);
$jPost2 = j($rawPost2);
echo "HTTP $cPost2 same id? " . (($newRowId && isset($jPost2['data']['id']) && (int) $jPost2['data']['id'] === $newRowId) ? 'YES' : 'CHECK') . " new_cat=" . ($jPost2['data']['catalog_category_id'] ?? '?') . "\n";
$dbRow2 = DB::table('category_mapping')->where('donor_category_id', $unmappedId)->first();
echo "DB single row id=" . ($dbRow2->id ?? '?') . " catalog_category_id=" . ($dbRow2->catalog_category_id ?? '?') . " confidence=" . ($dbRow2->confidence ?? '?') . "\n";
$dups2 = DB::select('SELECT donor_category_id, COUNT(1) as cnt FROM category_mapping GROUP BY donor_category_id HAVING COUNT(1) > 1');
echo "duplicates after remap: " . json_encode($dups2) . "\n\n";

// --- STEP 5: simulate frontend filters ---
echo "=== STEP 5: Simulate UI filters (TypeScript logic) ===\n";
$fullAfter = fetchAllMappings($base, $token);
$mappedIds = [];
foreach ($fullAfter as $m) {
    $mappedIds[(int) $m['donor_category_id']] = true;
}
$suggestions = is_array($sugData2) ? $sugData2 : [];

$minConfidence = 0;
$passes = fn (int $score, int $min) => $min === 0 || $score >= $min;

// ALL view: all suggestions with score filter
$rowsAll = array_values(array_filter($suggestions, fn ($s) => $passes((int) $s['score'], $minConfidence)));
// UNMAPPED: filter !mappedIds
$rowsUnmapped = array_values(array_filter($rowsAll, fn ($s) => !isset($mappedIds[(int) $s['donor_id']])));
// MAPPED tab uses API — min_confidence 80, all pages
$mappedFilteredPages = fetchAllMappings($base, $token, ['status' => 'mapped', 'min_confidence' => 80]);
if (isset($mappedFilteredPages['error'])) {
    echo "mapped filtered fetch failed\n";
    exit(1);
}
$hasOurDonorMapped80 = false;
foreach ($mappedFilteredPages as $row) {
    if ((int) ($row['donor_category_id'] ?? 0) === (int) $unmappedId) {
        $hasOurDonorMapped80 = true;
        break;
    }
}
$cMapF = 200;
$inAllView = false;
foreach ($rowsAll as $s) {
    if ((int) $s['donor_id'] === (int) $unmappedId) {
        $inAllView = true;
        break;
    }
}
$inUnmappedView = false;
foreach ($rowsUnmapped as $s) {
    if ((int) $s['donor_id'] === (int) $unmappedId) {
        $inUnmappedView = true;
        break;
    }
}
echo "mapped donor in 'Все' suggestion list: " . ($inAllView ? 'YES' : 'NO') . " (may still appear as suggestion row)\n";
echo "mapped donor in 'Без маппинга' simulated list: " . ($inUnmappedView ? 'YES (BAD)' : 'NO (OK)') . "\n";
echo "mapped donor in API mapped&min_confidence=80 (all pages): " . ($hasOurDonorMapped80 ? 'YES' : 'NO') . " HTTP $cMapF\n";
echo "API suggestions include all donors (Все tab); 'Без маппинга' uses client filter — mapped donor must be excluded there.\n\n";

// --- Verdict helpers ---
$applyWorks = (in_array($cPost1, [200, 201], true) && $dbRow && count($dups) === 0);
$remapWorks = (in_array($cPost2, [200, 201], true) && $dbRow2 && (int) $dbRow2->catalog_category_id === $catalogB && (int) $dbRow2->id === (int) $dbRow->id);
$dataConsistent = (count($dups2) === 0 && DB::table('category_mapping')->where('donor_category_id', $unmappedId)->count() === 1);
// UI logic: unmapped view must not contain mapped donor; mapped tab API must list row
$uiLogicValid = !$inUnmappedView && $foundInList && $hasOurDonorMapped80;

echo "=== SUMMARY ===\n";
echo "test_donor_id=$unmappedId created_donor=" . ($created ? '1' : '0') . "\n";
echo "VERDICT_APPLY=" . ($applyWorks ? 'YES' : 'NO') . "\n";
echo "VERDICT_REMAP=" . ($remapWorks ? 'YES' : 'NO') . "\n";
echo "VERDICT_DATA_CONSISTENT=" . ($dataConsistent ? 'YES' : 'NO') . "\n";
echo "VERDICT_UI_LOGIC=" . ($uiLogicValid ? 'YES' : 'NO') . "\n";
echo "suggestions_still_lists_mapped_donor=" . ($inSugAfter ? 'YES' : 'NO') . " (informational)\n";
