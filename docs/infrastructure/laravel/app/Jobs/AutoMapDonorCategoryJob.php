<?php

namespace App\Jobs;

use App\Services\Catalog\AutoMappingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class AutoMapDonorCategoryJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [30, 60, 120];

    public function __construct(
        public int $donorCategoryId,
    ) {}

    public function handle(AutoMappingService $autoMappingService): void
    {
        $autoMappingService->process($this->donorCategoryId);
    }

    public function failed(Throwable $e): void
    {
        Log::error('AutoMapDonorCategoryJob failed', [
            'donor_category_id' => $this->donorCategoryId,
            'message' => $e->getMessage(),
            'exception' => $e::class,
        ]);
    }
}
