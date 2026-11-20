<?php
// Disposable benchmark databases only. Run after the panel measurement phase.
if (getenv('PANEL_RUNTIME_BENCHMARK') !== 'disposable-fixture') {
    throw new RuntimeException('Refusing a non-benchmark database.');
}
require '/bench/vendor/autoload.php';
$app = require '/bench/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $e): never { fwrite(STDERR, $e->getMessage() . "\n"); exit(1); });
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Pterodactyl\Models\{Node,User};
$variant = $argv[1];
if (!in_array($variant, ['manta', 'wings'], true)) throw new RuntimeException('Unknown benchmark variant.');
$password = getenv('DAEMON_BENCHMARK_PASSWORD');
if (!$password || !getenv('DAEMON_BENCHMARK_HOST')) throw new RuntimeException('Missing private setup environment.');
if (DB::table('nodes')->where('name', 'like', 'Benchmark Daemon%')->exists()) throw new RuntimeException('Use fresh fixtures; daemon benchmark is already provisioned.');
$now = date('Y-m-d H:i:s');
$timestamps = ['created_at'=>$now,'updated_at'=>$now];
DB::beginTransaction();
$owner = User::forceCreate(['uuid'=>'00000000-0000-4000-8000-000000000099','username'=>'benchmark-daemon',
    'email'=>'daemon@example.test','name_first'=>'Benchmark','name_last'=>'Daemon','password'=>Hash::make($password),
    'root_admin'=>false,'language'=>'en','use_totp'=>false]);
$root = '/benchdata/'.$variant;
$port = $variant === 'manta' ? 18083 : 18084;
$sftp = $variant === 'manta' ? 2023 : 2024;
$nodeId = DB::table('nodes')->insertGetId($timestamps + [
    'uuid'=>(string)Str::uuid(),'name'=>'Benchmark Daemon '.ucfirst($variant),'description'=>'Isolated current-release benchmark',
    'location_id'=>DB::table('locations')->value('id'),'fqdn'=>getenv('DAEMON_BENCHMARK_HOST'),'scheme'=>'http',
    'public'=>false,'behind_proxy'=>false,'memory'=>8192,'disk'=>32768,'memory_overallocate'=>0,'disk_overallocate'=>0,
    'upload_size'=>100,'daemon_token_id'=>Str::random(16),'daemon_token'=>encrypt(Str::random(64)),
    'daemonListen'=>$port,'daemonSFTP'=>$sftp,'daemonBase'=>$root.'/volumes',
]);
$nest = DB::table('nests')->value('id');
$servers = [];
foreach (['paper','bedrock'] as $kind) {
    $gamePort = ($variant === 'manta' ? 27015 : 27115) + ($kind === 'bedrock' ? 1 : 0);
    $image = getenv($kind === 'paper' ? 'BENCHMARK_PAPER_IMAGE' : 'BENCHMARK_BEDROCK_IMAGE');
    if (!$image || !str_contains($image, '@sha256:')) throw new RuntimeException('Pin game images by digest.');
    $startup = $kind === 'paper'
        ? 'java -Xms128M -Xmx1400M -Dterminal.jline=false -Dterminal.ansi=true -jar server.jar --nogui'
        : 'LD_LIBRARY_PATH=. ./bedrock_server';
    $egg = DB::table('eggs')->insertGetId($timestamps + [
        'uuid'=>(string)Str::uuid(),'nest_id'=>$nest,'author'=>'benchmark@example.test','name'=>'Benchmark '.ucfirst($kind),
        'description'=>'Matching cached binaries; no timed installation or download.',
        'docker_images'=>json_encode(['Benchmark'=>$image]),'startup'=>$startup,
        'config_files'=>'{}','config_startup'=>json_encode(['done'=>$kind==='paper'?'Done (':'Server started.']),
        'config_logs'=>'{}','config_stop'=>'stop','script_install'=>'','script_is_privileged'=>false,
        'script_entry'=>'sh','script_container'=>'alpine:3.22',
    ]);
    $allocation = DB::table('allocations')->insertGetId($timestamps + ['node_id'=>$nodeId,'ip'=>'127.0.0.1','port'=>$gamePort]);
    $uuid = (string)Str::uuid();
    $name = 'Benchmark '.ucfirst($variant).' '.ucfirst($kind);
    $record = $timestamps + [
        'uuid'=>$uuid,'name'=>$name,'description'=>'Dedicated benchmark fixture',
        'node_id'=>$nodeId,'owner_id'=>$owner->id,'memory'=>$kind==='paper'?1536:512,'swap'=>0,'disk'=>4096,
        'io'=>500,'cpu'=>200,'oom_disabled'=>false,'allocation_id'=>$allocation,'nest_id'=>$nest,'egg_id'=>$egg,
        'startup'=>$startup,'image'=>$image,'database_limit'=>0,'allocation_limit'=>2,'backup_limit'=>2,
        'status'=>null,'installed_at'=>$now,
    ];
    if (Illuminate\Support\Facades\Schema::hasColumn('servers','uuidShort')) $record['uuidShort'] = substr($uuid,0,8);
    $id = DB::table('servers')->insertGetId($record);
    DB::table('allocations')->where('id',$allocation)->update(['server_id'=>$id]);
    if ($kind === 'bedrock') DB::table('allocations')->insert($timestamps + ['node_id'=>$nodeId,'ip'=>'127.0.0.1','port'=>$gamePort+1,'server_id'=>$id]);
    $servers[] = ['id'=>$id,'uuid'=>$uuid,'name'=>$name,'kind'=>$kind,'identifier'=>substr($uuid,0,8),'port'=>$gamePort];
}
$node = Node::findOrFail($nodeId);
$config = $node->getConfiguration();
$config['remote'] = 'http://benchmark-panel';
$config['allowed_origins'] = ['http://benchmark-panel'];
$config['ignore_panel_config_updates'] = true;
$config['system'] = array_replace_recursive($config['system'], [
    'root_directory'=>$root,'log_directory'=>$root.'/logs','archive_directory'=>$root.'/archives',
    'backup_directory'=>$root.'/backups','tmp_directory'=>$root.'/tmp','timezone'=>'UTC',
    'username'=>$variant==='manta'?'aquadactyl':'pterodactyl',
    'user'=>['uid'=>988,'gid'=>988],
    'machine_id'=>['directory'=>$root.'/machine-id'],'passwd'=>['directory'=>$root.'/etc'],
]);
$subnet = $variant === 'manta' ? '172.30.21' : '172.30.22';
$config['docker']['network'] = ['name'=>'benchmark-'.$variant,'network_mode'=>'benchmark-'.$variant,
    'bridge_name'=>'bench-'.substr($variant,0,5),'interface'=>$subnet.'.1',
    'interfaces'=>['v4'=>['subnet'=>$subnet.'.0/24','gateway'=>$subnet.'.1'],'v6'=>['enabled'=>false]]];
$private = [
    'node'=>['id'=>$nodeId,'name'=>$node->name,'container'=>$variant,'base'=>'http://172.17.0.1:'.$port,
        'token'=>$node->getDecryptedKey(),'sftp_port'=>$sftp,'data_root'=>$root,'servers'=>$servers],
    'yaml'=>Symfony\Component\Yaml\Yaml::dump($config,10,2,Symfony\Component\Yaml\Yaml::DUMP_EMPTY_ARRAY_AS_SEQUENCE),
];
file_put_contents('/bench/storage/daemon-benchmark-'.$variant.'.json', json_encode($private,JSON_THROW_ON_ERROR));
chmod('/bench/storage/daemon-benchmark-'.$variant.'.json',0600);
DB::commit();
echo "Provisioned disposable ".$variant." fixtures.\n";
