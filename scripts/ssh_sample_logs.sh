#!/usr/bin/env bash
cd /var/www/online-parser.siteaacess.store
php artisan tinker --execute='var_export(Illuminate\Support\Facades\DB::table("auto_mapping_logs")->orderByDesc("id")->limit(3)->get()->toArray());'
