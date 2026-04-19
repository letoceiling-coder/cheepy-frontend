#!/bin/bash
set -e
cd /c/OSPanel/domains/sadavod-laravel
git add app/Http/Controllers/Api/DashboardController.php \
        app/Http/Controllers/Api/ParserController.php \
        app/Jobs/DownloadPhotosJob.php \
        app/Jobs/EnsureSystemProductFromDonorJob.php \
        app/Services/DatabaseParserService.php
git commit -m "parser: fix infinite pagination, race in ingest, broken photos batch + dashboard

- DatabaseParserService: hard 300-page cap per category (defends against
  donor/crawler returning has_more=true forever; observed: jenskie-rubashki
  reached page 799 in incremental mode and held a worker for 2.5h).
- DatabaseParserService: incremental 'only new' mode now early-exits a
  category after N consecutive pages where every product is an existing
  external_id (CATEGORY EARLY-EXIT: incremental tail reached).
- DownloadPhotosJob: fix wrong namespace (App\\Services\\SadovodParser\\PhotoDownloadService
  did not exist -> every batch failed with ReflectionException) and align
  handle() signature with PhotoDownloadService::downloadBatch(iterable).
- EnsureSystemProductFromDonorJob: swallow SQL 1062/1213 (duplicate
  sp_attr_product_name_value_uniq + deadlock) as warning instead of
  failed_jobs; this is a known race for parallel ingest of donor products
  sharing the same attribute (color/size).
- ParserController::startDaemon: dispatch ParserJob immediately when queue
  is idle, instead of waiting for the next 60s daemon tick.
- DashboardController: expose categories.selected_for_parser (real filter
  from parser_settings.default_category_ids) so the dashboard tile no longer
  shows misleading '337 (enabled: 337)'."
git log -1 --oneline
