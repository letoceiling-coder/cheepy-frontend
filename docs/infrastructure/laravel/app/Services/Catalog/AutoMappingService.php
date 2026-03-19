<?php

namespace App\Services\Catalog;

use App\Enums\AutoMappingDecision;
use App\Models\AutoMappingLog;
use App\Models\CategoryMapping;
use App\Models\DonorCategory;
use App\Support\AutoMappingCommandContext;
use Illuminate\Support\Facades\DB;

class AutoMappingService
{
    public const ALGORITHM_VERSION = 'v1';

    public function __construct(
        private MappingSuggestionService $suggestionService,
        private CategoryMappingService $mappingService,
    ) {}

    /**
     * Log when a user saves a manual mapping (CRM POST category-mapping with manual / remap).
     */
    public function logManualOverride(int $donorCategoryId, int $catalogCategoryId, int $confidence): void
    {
        $this->writeLog(
            $donorCategoryId,
            $catalogCategoryId,
            $confidence,
            AutoMappingDecision::ManualOverride,
            'user_changed_mapping'
        );
    }

    public function process(int $donorCategoryId): void
    {
        $donor = DonorCategory::query()->find($donorCategoryId);
        if (! $donor) {
            $this->writeLog(
                $donorCategoryId,
                null,
                0,
                AutoMappingDecision::Rejected,
                'donor_category_not_found'
            );

            return;
        }

        $existing = CategoryMapping::query()->where('donor_category_id', $donorCategoryId)->first();
        if ($existing && $existing->is_manual) {
            $this->writeLog(
                $donorCategoryId,
                $existing->catalog_category_id,
                (int) ($existing->confidence ?? 0),
                AutoMappingDecision::Rejected,
                'manual_mapping_preserved'
            );

            return;
        }

        $suggestion = $this->suggestionService->suggestForDonorCategory($donor);
        if ($suggestion === null) {
            $this->writeLog(
                $donorCategoryId,
                null,
                0,
                AutoMappingDecision::Rejected,
                'no_catalog_match'
            );

            return;
        }

        $catalogId = (int) $suggestion['catalog_category_id'];
        $confidence = (int) $suggestion['confidence'];

        $decision = $this->decide($confidence);
        $reason = null;

        if ($decision === AutoMappingDecision::AutoApplied) {
            DB::transaction(function () use ($donorCategoryId, $catalogId, $confidence, $existing): void {
                $this->mappingService->applyAutomaticMapping($donorCategoryId, $catalogId, $confidence, $existing);
            });
            $this->writeLog($donorCategoryId, $catalogId, $confidence, AutoMappingDecision::AutoApplied, null);

            return;
        }

        if ($decision === AutoMappingDecision::ManualRequired) {
            $reason = 'confidence_below_auto_threshold';
        } else {
            $reason = 'confidence_below_minimum';
        }

        $this->writeLog($donorCategoryId, $catalogId, $confidence, $decision, $reason);
    }

    private function decide(int $confidence): AutoMappingDecision
    {
        if ($confidence >= 90) {
            return AutoMappingDecision::AutoApplied;
        }
        if ($confidence >= 70) {
            return AutoMappingDecision::ManualRequired;
        }

        return AutoMappingDecision::Rejected;
    }

    private function writeLog(
        int $donorCategoryId,
        ?int $suggestedCatalogId,
        int $confidence,
        AutoMappingDecision $decision,
        ?string $reason,
    ): void {
        if ($this->isDuplicateOfLastLog($donorCategoryId, $suggestedCatalogId, $confidence, $decision)) {
            if (app()->bound(AutoMappingCommandContext::class)) {
                app(AutoMappingCommandContext::class)->skippedDuplicateLogs++;
            }

            return;
        }

        AutoMappingLog::query()->create([
            'donor_category_id' => $donorCategoryId,
            'suggested_catalog_category_id' => $suggestedCatalogId,
            'confidence' => $confidence,
            'decision' => $decision,
            'reason' => $reason,
            'algorithm_version' => self::ALGORITHM_VERSION,
            'created_at' => now(),
        ]);
    }

    private function isDuplicateOfLastLog(
        int $donorCategoryId,
        ?int $suggestedCatalogId,
        int $confidence,
        AutoMappingDecision $decision,
    ): bool {
        $last = AutoMappingLog::query()
            ->where('donor_category_id', $donorCategoryId)
            ->orderByDesc('id')
            ->first();

        if (! $last) {
            return false;
        }

        $lastCatalog = $last->suggested_catalog_category_id !== null
            ? (int) $last->suggested_catalog_category_id
            : null;
        $newCatalog = $suggestedCatalogId !== null ? (int) $suggestedCatalogId : null;

        if ($lastCatalog !== $newCatalog) {
            return false;
        }

        if ($last->decision !== $decision) {
            return false;
        }

        return (int) $last->confidence === $confidence;
    }
}
