#!/bin/bash
# Run on server to add admin users/roles routes
cd /var/www/online-parser.siteaacess.store

# Add imports after SettingController
sed -i '/use App\\Http\\Controllers\\Api\\SettingController;/a use App\\Http\\Controllers\\Api\\AdminUserController;\nuse App\\Http\\Controllers\\Api\\AdminRoleController;\nuse App\\Http\\Middleware\\AdminRoleMiddleware;' routes/api.php

# Add admin routes before the closing of Settings (before "    });" that closes the JWT group)
# We insert before the last "    });" in the file - actually we need to add before "    });" that closes Settings
# The structure is: Settings prefix group... }); then }); for JWT group
# So we add our block after the Settings Route::put and before the closing });
# Let's add after "Route::put('{key}', [SettingController::class, 'updateOne']);"
sed -i "/Route::put('{key}', \[SettingController::class, 'updateOne'\]);/a\\
\\
    // Admin Users and Roles (requires users.manage)\\
    Route::middleware(AdminRoleMiddleware::class)->prefix('admin')->group(function () {\\
        Route::get('users', [AdminUserController::class, 'index']);\\
        Route::post('users', [AdminUserController::class, 'store']);\\
        Route::put('users/{id}', [AdminUserController::class, 'update']);\\
        Route::delete('users/{id}', [AdminUserController::class, 'destroy']);\\
        Route::get('roles', [AdminRoleController::class, 'index']);\\
        Route::post('roles', [AdminRoleController::class, 'store']);\\
        Route::put('roles/{id}', [AdminRoleController::class, 'update']);\\
        Route::delete('roles/{id}', [AdminRoleController::class, 'destroy']);\\
    });" routes/api.php
