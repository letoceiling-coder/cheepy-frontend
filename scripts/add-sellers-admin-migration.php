<?php
/**
 * Add avatar column and indexes to sellers table.
 * Run: php scripts/add-sellers-admin-migration.php (from Laravel root)
 * Or: php artisan migrate (after adding migration file)
 */
$stub = <<<'SQL'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sellers', function (Blueprint $table) {
            if (!Schema::hasColumn('sellers', 'avatar')) {
                $table->string('avatar', 500)->nullable()->after('name');
            }
        });
        Schema::table('sellers', function (Blueprint $table) {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexes = $sm->listTableIndexes('sellers');
            if (!isset($indexes['sellers_slug_index']) && !isset($indexes['sellers_slug_unique'])) {
                $table->index('slug');
            }
            if (!isset($indexes['sellers_name_index'])) {
                $table->index('name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sellers', function (Blueprint $table) {
            if (Schema::hasColumn('sellers', 'avatar')) {
                $table->dropColumn('avatar');
            }
            $table->dropIndex(['slug']);
            $table->dropIndex(['name']);
        });
    }
};
SQL;
$dir = __DIR__ . '/../database/migrations';
if (!is_dir($dir)) {
    echo "Create database/migrations folder first.\n";
    exit(1);
}
$name = date('Y_m_d_His') . '_add_sellers_avatar_and_indexes';
$path = $dir . '/' . $name . '.php';
file_put_contents($path, $stub);
echo "Created: $path\n";
