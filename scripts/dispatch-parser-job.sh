#!/bin/bash
cd /var/www/online-parser.siteaacess.store
php artisan tinker --execute='
$opts = App\Support\ParserJobOptions::buildFromSettings();
$j = App\Models\ParserJob::create(["type"=>"menu_only","options"=>$opts,"status"=>"pending"]);
App\Jobs\RunParserJob::dispatch($j->id);
echo "Dispatched ".$j->id;
'
