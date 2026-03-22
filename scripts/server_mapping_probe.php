<?php
/**
 * Run ON SERVER: php /tmp/server_mapping_probe.php
 * Requires: cwd = Laravel root or pass as argv[1]
 */
$root = $argv[1] ?? '/var/www/online-parser.siteaacess.store';
chdir($root);
require $root . '/vendor/autoload.php';
$app = require_once $root . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AdminUser;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\DB;

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
        CURLOPT_TIMEOUT => 30,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $raw];
}

$base = 'https://online-parser.siteaacess.store/api/v1';

echo "=== GET mapping/suggestions ===\n";
[$c1, $r1] = httpJson('GET', $base . '/admin/catalog/mapping/suggestions?limit=3', $token);
echo "HTTP $c1\n";
echo substr($r1, 0, 500) . (strlen($r1) > 500 ? "...\n" : "\n");

echo "=== GET category-mapping status=mapped ===\n";
[$c2, $r2] = httpJson('GET', $base . '/admin/catalog/category-mapping?per_page=5&status=mapped', $token);
echo "HTTP $c2\n";
echo substr($r2, 0, 500) . (strlen($r2) > 500 ? "...\n" : "\n");

echo "=== GET category-mapping min_confidence=80 ===\n";
[$c3, $r3] = httpJson('GET', $base . '/admin/catalog/category-mapping?per_page=5&status=mapped&min_confidence=80', $token);
echo "HTTP $c3\n";
$j3 = json_decode($r3, true);
echo 'data_count=' . (is_array($j3['data'] ?? null) ? count($j3['data']) : '?') . "\n";

$row = DB::table('category_mapping')->orderBy('id')->first();
if ($row) {
    echo "=== POST category-mapping (remap / upsert same row) donor={$row->donor_category_id} cat={$row->catalog_category_id} ===\n";
    $body = json_encode([
        'donor_category_id' => (int) $row->donor_category_id,
        'catalog_category_id' => (int) $row->catalog_category_id,
        'confidence' => 99,
        'is_manual' => true,
    ]);
    [$c4, $r4] = httpJson('POST', $base . '/admin/catalog/category-mapping', $token, $body);
    echo "HTTP $c4\n";
    echo substr($r4, 0, 600) . "\n";

    $dup = DB::select('SELECT donor_category_id, COUNT(1) as cnt FROM category_mapping GROUP BY donor_category_id HAVING COUNT(1) > 1');
    echo "=== Duplicates after POST ===\n";
    echo json_encode($dup) . "\n";
} else {
    echo "=== No category_mapping row; skip POST ===\n";
}

echo "=== APPLY (unmapped donor if any) ===\n";
try {
    $unmappedDonor = DB::table('donor_categories as d')
        ->leftJoin('category_mapping as m', 'm.donor_category_id', '=', 'd.id')
        ->whereNull('m.id')
        ->orderBy('d.id')
        ->value('d.id');
} catch (\Throwable $e) {
    $unmappedDonor = null;
    echo "skip (schema): " . $e->getMessage() . "\n";
}
if ($unmappedDonor) {
    $catId = DB::table('catalog_categories')->orderBy('id')->value('id');
    $body = json_encode([
        'donor_category_id' => (int) $unmappedDonor,
        'catalog_category_id' => (int) $catId,
        'confidence' => 88,
        'is_manual' => true,
    ]);
    echo "POST new mapping donor=$unmappedDonor catalog=$catId\n";
    [$c5, $r5] = httpJson('POST', $base . '/admin/catalog/category-mapping', $token, $body);
    echo "HTTP $c5\n";
    echo substr($r5, 0, 400) . "\n";
    $dup2 = DB::select('SELECT donor_category_id, COUNT(1) as cnt FROM category_mapping GROUP BY donor_category_id HAVING COUNT(1) > 1');
    echo "duplicates_after_apply=" . json_encode($dup2) . "\n";
} else {
    echo "SKIP: no unmapped donor_categories row (all mapped or table missing)\n";
}

echo "DONE\n";
