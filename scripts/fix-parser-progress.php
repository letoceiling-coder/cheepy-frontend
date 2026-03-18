<?php
$path = '/var/www/online-parser.siteaacess.store/app/Http/Controllers/Api/ParserController.php';
$content = file_get_contents($path);
$old = 'public function progress(Request $request): Response';
$new = 'public function progress(Request $request): \Symfony\Component\HttpFoundation\Response';
$content = str_replace($old, $new, $content);
file_put_contents($path, $content);
echo "Fixed\n";
