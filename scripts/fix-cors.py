#!/usr/bin/env python3
path = '/var/www/online-parser.siteaacess.store/config/cors.php'
with open(path, 'r') as f:
    c = f.read()
old = "'allowed_origins' => ['*'],"
new = "'allowed_origins' => ['https://siteaacess.store', 'http://cheepy.loc'],"
c = c.replace(old, new)
with open(path, 'w') as f:
    f.write(c)
print('cors.php updated')
