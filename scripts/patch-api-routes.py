#!/usr/bin/env python3
import sys

path = sys.argv[1] if len(sys.argv) > 1 else 'routes/api.php'

with open(path, 'r') as f:
    c = f.read()

old = """    // Settings
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingController::class, 'index']);
        Route::put('/', [SettingController::class, 'update']);
        Route::put('{key}', [SettingController::class, 'updateOne']);
    });
});"""

add = """    // Settings
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingController::class, 'index']);
        Route::put('/', [SettingController::class, 'update']);
        Route::put('{key}', [SettingController::class, 'updateOne']);
    });

    // Admin Users and Roles (requires users.manage)
    Route::middleware(AdminRoleMiddleware::class)->prefix('admin')->group(function () {
        Route::get('users', [AdminUserController::class, 'index']);
        Route::post('users', [AdminUserController::class, 'store']);
        Route::put('users/{id}', [AdminUserController::class, 'update']);
        Route::delete('users/{id}', [AdminUserController::class, 'destroy']);
        Route::get('roles', [AdminRoleController::class, 'index']);
        Route::post('roles', [AdminRoleController::class, 'store']);
        Route::put('roles/{id}', [AdminRoleController::class, 'update']);
        Route::delete('roles/{id}', [AdminRoleController::class, 'destroy']);
    });
});"""

if old in c:
    c = c.replace(old, add)
    with open(path, 'w') as f:
        f.write(c)
    print('OK')
else:
    print('OLD BLOCK NOT FOUND')
    sys.exit(1)
