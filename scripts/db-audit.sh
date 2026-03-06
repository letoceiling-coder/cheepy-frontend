#!/bin/bash
set -u
DIR=/var/www/online-parser.siteaacess.store
DB=$(grep '^DB_DATABASE' "$DIR/.env" | cut -d= -f2 | tr -d '\r')
USER=$(grep '^DB_USERNAME' "$DIR/.env" | cut -d= -f2 | tr -d '\r')
PASS=$(grep '^DB_PASSWORD' "$DIR/.env" | cut -d= -f2 | tr -d '\r')
M="mysql -u${USER} -p${PASS} ${DB} --skip-column-names"

echo '=== BASIC COUNTS ==='
$M -e "SELECT 'total_products', COUNT(*) FROM products UNION ALL SELECT 'with_description', COUNT(*) FROM products WHERE description IS NOT NULL AND description != '' UNION ALL SELECT 'with_attributes', COUNT(*) FROM product_attributes;"

echo ''
echo '=== ATTR_NAMES DISTRIBUTION ==='
$M -e "SELECT attr_name, COUNT(*) as cnt FROM product_attributes GROUP BY attr_name ORDER BY cnt DESC LIMIT 40;"

echo ''
echo '=== ATTR_VALUES sample: size ==='
$M -e "SELECT attr_value, COUNT(*) as cnt FROM product_attributes WHERE attr_name IN ('size','Размер','размер','Размеры') GROUP BY attr_value ORDER BY cnt DESC LIMIT 30;"

echo ''
echo '=== COUNTRY COUNTS ==='
$M -e "SELECT 'turkey', COUNT(*) FROM products WHERE LOWER(description) REGEXP 'турц|turkey';"
$M -e "SELECT 'china',  COUNT(*) FROM products WHERE LOWER(description) REGEXP 'китай|china';"
$M -e "SELECT 'russia', COUNT(*) FROM products WHERE LOWER(description) REGEXP 'россия|russia';"
$M -e "SELECT 'uzbek',  COUNT(*) FROM products WHERE LOWER(description) REGEXP 'узбекис';"
$M -e "SELECT 'kyrgyz', COUNT(*) FROM products WHERE LOWER(description) REGEXP 'киргиз|кыргыз|kyrgyz';"
$M -e "SELECT 'belarus',COUNT(*) FROM products WHERE LOWER(description) REGEXP 'беларус|белорус';"

echo ''
echo '=== MATERIAL COUNTS ==='
$M -e "SELECT 'cotton',     COUNT(*) FROM products WHERE LOWER(description) REGEXP 'хлопок|cotton';"
$M -e "SELECT 'polyester',  COUNT(*) FROM products WHERE LOWER(description) REGEXP 'полиэстер|polyester';"
$M -e "SELECT 'viscose',    COUNT(*) FROM products WHERE LOWER(description) REGEXP 'вискоза|viscose';"
$M -e "SELECT 'elastane',   COUNT(*) FROM products WHERE LOWER(description) REGEXP 'эластан|elastan|спандекс|spandex';"
$M -e "SELECT 'wool',       COUNT(*) FROM products WHERE LOWER(description) REGEXP 'шерсть|wool';"
$M -e "SELECT 'acrylic',    COUNT(*) FROM products WHERE LOWER(description) REGEXP 'акрил|acrylic';"
$M -e "SELECT 'linen',      COUNT(*) FROM products WHERE LOWER(description) REGEXP 'лён|лен |linen|льняной';"
$M -e "SELECT 'composition',COUNT(*) FROM products WHERE LOWER(description) REGEXP 'состав';"

echo ''
echo '=== BRAND COUNTS ==='
$M -e "SELECT COUNT(*) as has_brand_label FROM products WHERE LOWER(description) REGEXP 'бренд|brand';"

echo ''
echo '=== ARTICLE COUNTS ==='
$M -e "SELECT COUNT(*) as has_article FROM products WHERE LOWER(description) REGEXP 'артикул|арт\\.'"

echo ''
echo '=== SIZE LATIN COUNTS ==='
$M -e "SELECT COUNT(*) as has_letter_size FROM products WHERE description REGEXP 'XS|XXL|2XL|3XL';"
$M -e "SELECT COUNT(*) as has_M_L_XL FROM products WHERE description REGEXP '[ (]M[ (-]|[ (]L[ (-]|[ (]XL[ (-]';"

echo ''
echo '=== PACK QTY COUNTS ==='
$M -e "SELECT COUNT(*) FROM products WHERE LOWER(description) REGEXP 'в упак|штук|в уп\\.'"

echo ''
echo '=== COLOR COUNTS ==='
$M -e "SELECT COUNT(*) FROM products WHERE LOWER(description) REGEXP 'цвет|color';"

echo ''
echo '=== SAMPLE DESCRIPTIONS (30) ==='
$M -e "SELECT id, SUBSTRING(IFNULL(description,''),1,400) FROM products WHERE description IS NOT NULL AND description != '' ORDER BY id DESC LIMIT 30;"

echo ''
echo '=== SAMPLE COUNTRY LINES ==='
$M -e "SELECT SUBSTRING(IFNULL(description,''),1,300) FROM products WHERE LOWER(description) REGEXP 'пр\\.-?во|производств|страна|made in|сделано' LIMIT 15;"

echo ''
echo '=== SAMPLE MATERIAL LINES ==='
$M -e "SELECT SUBSTRING(IFNULL(description,''),1,300) FROM products WHERE LOWER(description) REGEXP 'состав' LIMIT 15;"

echo ''
echo '=== SAMPLE SIZE LINES ==='
$M -e "SELECT SUBSTRING(IFNULL(description,''),1,300) FROM products WHERE description REGEXP 'XL|XXL|2XL' LIMIT 15;"

echo ''
echo '=== SAMPLE BRAND LINES ==='
$M -e "SELECT SUBSTRING(IFNULL(description,''),1,300) FROM products WHERE LOWER(description) REGEXP 'бренд|brand' LIMIT 10;"

echo ''
echo '=== EXISTING CHARACTERISTICS JSON KEYS ==='
$M -e "SELECT SUBSTRING(characteristics,1,500) FROM products WHERE characteristics IS NOT NULL AND characteristics != '[]' AND characteristics != '{}' LIMIT 20;"
