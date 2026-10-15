<?php

if (getenv('PANEL_RUNTIME_BENCHMARK') !== 'disposable-fixture') {
    throw new RuntimeException('Only disposable benchmark fixtures may be profiled.');
}
require '/bench/vendor/autoload.php';
$app = require '/bench/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$access = json_decode(file_get_contents('/bench/storage/benchmark-access.json'), true);
// Ensure both profiles include a last-used timestamp write, independently of
// whether a benchmark request happened during this same second.
Illuminate\Support\Facades\DB::table('api_keys')->where('identifier', substr($access['token'], 0, 16))->update(['last_used_at' => null]);
$queries = [];
Illuminate\Support\Facades\DB::listen(function ($event) use (&$queries) {
    $queries[] = ['sql' => $event->sql, 'ms' => $event->time];
});
$request = Illuminate\Http\Request::create('/api/client?per_page=50', 'GET', [], [], [], [
    'HTTP_ACCEPT' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $access['token'],
]);
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$start = microtime(true);
$response = $kernel->handle($request);
$elapsed = (microtime(true) - $start) * 1000;
$grouped = [];
foreach ($queries as $query) {
    $sql = preg_replace('/in \([^)]*\)/i', 'in (...)', $query['sql']);
    $grouped[$sql] = ($grouped[$sql] ?? 0) + 1;
}
arsort($grouped);
echo json_encode(['status' => $response->getStatusCode(), 'elapsedMs' => $elapsed, 'count' => count($queries), 'dbMs' => array_sum(array_column($queries, 'ms')), 'queries' => $grouped], JSON_PRETTY_PRINT) . PHP_EOL;
