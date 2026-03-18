# Queue System

## Workers (Supervisor)

parser-worker_00-03: RunParserJob
parser-worker-photos_00-01: DownloadPhotosJob
reverb: Laravel Reverb WebSocket

## Commands

supervisorctl status
supervisorctl restart all

## Jobs

RunParserJob - parse products
DownloadPhotosJob - download product photos
