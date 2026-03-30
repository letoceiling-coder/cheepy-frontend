<?php
/**
 * Создаёт или обновляет администратора в БД Laravel (бекенд online-parser).
 * Запуск на сервере из каталога бекенда или с корректным $base:
 *   php scripts/fix-admin-user.php
 *
 * Email: dsc-23@yandex.ru
 * Пароль: 123123123
 * Имя: Джон Уик
 * Роль: admin (администратор)
 */
$base = '/var/www/online-parser.siteaacess.store';
require $base . '/vendor/autoload.php';
$app = require $base . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = 'dsc-23@yandex.ru';
$passwordPlain = '123123123';

$existedBefore = App\Models\AdminUser::where('email', $email)->exists();

$u = App\Models\AdminUser::updateOrCreate(
    ['email' => $email],
    [
        'name' => 'Джон Уик',
        'password' => Illuminate\Support\Facades\Hash::make($passwordPlain),
        'role' => 'admin',
        'is_active' => true,
    ]
);
$u->refresh();

$ok = Illuminate\Support\Facades\Hash::check($passwordPlain, $u->password);
$action = $existedBefore ? 'обновлён' : 'создан';

echo "OK: пользователь {$action}. id={$u->id}, email={$u->email}, name={$u->name}, role={$u->role}\n";
echo 'Проверка пароля: ' . ($ok ? 'OK' : 'FAIL') . "\n";
