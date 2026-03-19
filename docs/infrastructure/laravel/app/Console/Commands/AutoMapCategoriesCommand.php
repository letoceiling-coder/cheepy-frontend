<?php

namespace App\Console\Commands;

use App\Jobs\AutoMapDonorCategoryJob;
use App\Models\DonorCategory;
use Illuminate\Console\Command;

class AutoMapCategoriesCommand extends Command
{
    protected $signature = 'catalog:auto-map-categories {--sync : Run inline instead of queue}';

    protected $description = 'Dispatch auto-mapping job for each donor category (Phase 1 safe mode)';

    public function handle(): int
    {
        $sync = (bool) $this->option('sync');
        $count = 0;

        DonorCategory::query()->orderBy('id')->select('id')->chunkById(100, function ($rows) use ($sync, &$count) {
            foreach ($rows as $row) {
                if ($sync) {
                    AutoMapDonorCategoryJob::dispatchSync($row->id);
                } else {
                    AutoMapDonorCategoryJob::dispatch($row->id);
                }
                $count++;
            }
        });

        $this->info("Dispatched auto-map for {$count} donor categories" . ($sync ? ' (sync).' : '.'));

        return self::SUCCESS;
    }
}
