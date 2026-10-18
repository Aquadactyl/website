<?php

// Only used inside the disposable benchmark stack. Never run against a real panel.
if (getenv('PANEL_RUNTIME_BENCHMARK') !== 'disposable-fixture') {
    throw new RuntimeException('Benchmark fixture environment is required.');
}
require '/bench/vendor/autoload.php';
$app = require '/bench/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Pterodactyl\Models\ApiKey;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Api\KeyCreationService;

$access = '/bench/storage/benchmark-access.json';
// Laravel's console exception renderer may return exit code zero for standalone
// scripts. Fixture failures must stop the container instead of passing health checks.
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, $error->getMessage() . PHP_EOL);
    exit(1);
});
if (User::query()->exists()) {
    if (!file_exists($access)) {
        throw new RuntimeException('Existing database has no benchmark credentials; use fresh volumes.');
    }
    exit(0);
}

$user = User::forceCreate([
    'uuid' => '00000000-0000-4000-8000-000000000001',
    'username' => 'benchmark',
    'email' => 'benchmark@example.test',
    'name_first' => 'Benchmark',
    'name_last' => 'Account',
    'password' => Hash::make(getenv('BENCHMARK_PASSWORD')),
    'root_admin' => false,
    'language' => 'en',
    'use_totp' => false,
]);
$now = date('Y-m-d H:i:s');
$location = DB::table('locations')->insertGetId(['short' => 'bench', 'long' => 'Benchmark fixture', 'created_at' => $now, 'updated_at' => $now]);
$node = DB::table('nodes')->insertGetId([
    'uuid' => '00000000-0000-4000-8000-000000000002', 'public' => true,
    'name' => 'Benchmark Node', 'description' => 'Fixture only; no daemon or game server is contacted.',
    'location_id' => $location, 'fqdn' => '127.0.0.1', 'scheme' => 'http', 'behind_proxy' => false,
    'memory' => 32768, 'memory_overallocate' => 0, 'disk' => 1048576, 'disk_overallocate' => 0,
    'upload_size' => 100, 'daemon_token_id' => Str::random(16), 'daemon_token' => encrypt(Str::random(64)),
    'daemonListen' => 19999, 'daemonSFTP' => 2022, 'daemonBase' => '/tmp/benchmark-servers',
    'created_at' => $now, 'updated_at' => $now,
]);
$nest = DB::table('nests')->insertGetId(['uuid' => '00000000-0000-4000-8000-000000000003', 'author' => 'benchmark@example.test', 'name' => 'Benchmark', 'description' => 'Fixture', 'created_at' => $now, 'updated_at' => $now]);
$egg = DB::table('eggs')->insertGetId([
    'uuid' => '00000000-0000-4000-8000-000000000004', 'nest_id' => $nest,
    'author' => 'benchmark@example.test', 'name' => 'Benchmark Egg', 'description' => 'No game execution',
    'docker_images' => json_encode(['Fixture' => 'alpine:3.22']), 'startup' => 'echo benchmark',
    'config_files' => '{}', 'config_startup' => '{}', 'config_logs' => '{}', 'config_stop' => 'stop',
    'script_install' => '', 'script_is_privileged' => false, 'script_entry' => 'sh', 'script_container' => 'alpine:3.22',
    'created_at' => $now, 'updated_at' => $now,
]);
for ($i = 1; $i <= 50; $i++) {
    $allocation = DB::table('allocations')->insertGetId(['node_id' => $node, 'ip' => '127.0.0.1', 'port' => 30000 + $i, 'created_at' => $now, 'updated_at' => $now]);
    $server = [
        'uuid' => sprintf('10000000-0000-4000-8000-%012d', $i),
        'name' => sprintf('Benchmark Server %02d', $i), 'description' => 'Identical database fixture; no running daemon.',
        'node_id' => $node, 'owner_id' => $user->id, 'memory' => 1024, 'swap' => 0, 'disk' => 4096,
        'io' => 500, 'cpu' => 100, 'oom_disabled' => true, 'allocation_id' => $allocation,
        'nest_id' => $nest, 'egg_id' => $egg, 'startup' => 'echo benchmark', 'image' => 'alpine:3.22',
        'database_limit' => 0, 'allocation_limit' => 1, 'backup_limit' => 0,
        'status' => 'suspended', 'created_at' => $now, 'updated_at' => $now, 'installed_at' => $now,
    ];
    if (Illuminate\Support\Facades\Schema::hasColumn('servers', 'uuidShort')) {
        $server['uuidShort'] = sprintf('%08x', $i);
    }
    $id = DB::table('servers')->insertGetId($server);
    DB::table('allocations')->where('id', $allocation)->update(['server_id' => $id]);
}
if (class_exists(KeyCreationService::class)) {
    $key = $app->make(KeyCreationService::class)->setKeyType(ApiKey::TYPE_ACCOUNT)->handle([
        'user_id' => $user->id, 'memo' => 'Disposable benchmark', 'allowed_ips' => [],
    ]);
} else {
    // v2 removed KeyCreationService; create the same legacy Sanctum client key.
    $key = $user->apiKeys()->forceCreate([
        'identifier' => ApiKey::generateTokenIdentifier(ApiKey::TYPE_ACCOUNT),
        'key_type' => ApiKey::TYPE_ACCOUNT,
        'token' => encrypt(Str::random(ApiKey::KEY_LENGTH)),
        'memo' => 'Disposable benchmark', 'allowed_ips' => [],
    ]);
}
file_put_contents($access, json_encode([
    'username' => $user->username, 'password' => getenv('BENCHMARK_PASSWORD'),
    'token' => $key->identifier . decrypt($key->token),
]));
chmod($access, 0600);
echo "Created matching benchmark fixture: one user, one node, one egg, 50 suspended server records.\n";
