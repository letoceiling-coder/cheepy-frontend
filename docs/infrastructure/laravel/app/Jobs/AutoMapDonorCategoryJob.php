<?php

namespace App\Jobs;

use App\Services\Catalog\AutoMappingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AutoMapDonorCategoryJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public int $donorCategoryId,
    ) {}

    public function handle(AutoMappingService $autoMappingService): void
    {
        $autoMappingService->process($this->donorCategoryId);
    }
}
