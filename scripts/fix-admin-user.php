<?php
$base = '/var/www/online-parser.siteaacess.store';
require $base . '/vendor/autoload.php';
$app = require $base . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = App\Models\AdminUser::updateOrCreate(
    ['email' => 'dsc-23@yandex.ru'],
    [
        'name' => 'Джон Уик',
        'password' => Illuminate\Support\Facades\Hash::make('123123123'),
        'role' => 'admin',
        'is_active' => true,
    ]
);
$u->refresh();
echo "AdminUser updated. Hash::check(123123123): " . (Illuminate\Support\Facades\Hash::check('123123123', $u->password) ? 'OK' : 'FAIL');
