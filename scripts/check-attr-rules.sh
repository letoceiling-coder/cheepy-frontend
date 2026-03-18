#!/bin/bash
DIR=/var/www/online-parser.siteaacess.store
DB=$(grep '^DB_DATABASE' "$DIR/.env" | cut -d= -f2 | tr -d '\r')
USER=$(grep '^DB_USERNAME' "$DIR/.env" | cut -d= -f2 | tr -d '\r')
PASS=$(grep '^DB_PASSWORD' "$DIR/.env" | cut -d= -f2 | tr -d '\r')
M="mysql -u${USER} -p${PASS} ${DB} --skip-column-names"

echo "=== ATTRIBUTE RULES ==="
$M -e "SELECT attribute_key, COUNT(*) as cnt FROM attribute_rules GROUP BY attribute_key ORDER BY cnt DESC;" 2>/dev/null

echo ""
echo "=== TOTAL RULES / SYNONYMS ==="
$M -e "SELECT 'rules', COUNT(*) FROM attribute_rules UNION ALL SELECT 'synonyms', COUNT(*) FROM attribute_synonyms;" 2>/dev/null
