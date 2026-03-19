<?php

namespace App\Support;

/**
 * Bound only during catalog:auto-map-categories to collect per-run counters.
 */
final class AutoMappingCommandContext
{
    public int $skippedDuplicateLogs = 0;
}
