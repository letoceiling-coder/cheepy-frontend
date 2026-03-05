#!/bin/bash
mysql -N sadavod_parser -e "SHOW TABLES" | while read t; do
  echo "=== $t ==="
  mysql sadavod_parser -e "DESCRIBE $t"
  echo ""
done
