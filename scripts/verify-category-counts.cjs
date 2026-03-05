#!/usr/bin/env node
/**
 * Verify category counts: frontend (public/menu) vs admin (categories) vs expected.
 * Usage: node scripts/verify-category-counts.cjs [API_BASE]
 * Example: node scripts/verify-category-counts.cjs https://online-parser.siteaacess.store/api/v1
 */

const base = process.argv[2] || 'https://online-parser.siteaacess.store/api/v1';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function countTreeNodes(nodes) {
  if (!Array.isArray(nodes)) return 0;
  let n = nodes.length;
  for (const node of nodes) {
    if (node.children?.length) n += countTreeNodes(node.children);
  }
  return n;
}

async function main() {
  console.log('=== Category count verification ===');
  console.log('API:', base);
  console.log('');

  try {
    const menu = await fetchJson(`${base}/public/menu`);
    const cats = menu.categories || [];
    const menuCount = countTreeNodes(cats);
    console.log('1. GET /public/menu');
    console.log('   Top-level categories:', cats.length);
    console.log('   Total nodes (with children):', menuCount);

    console.log('');
    console.log('2. GET /categories?tree=true (requires auth)');
    console.log('   Use with Authorization header to compare admin tree');
    console.log('');

    console.log('3. Database');
    console.log('   Run on server: mysql -e "SELECT COUNT(*) FROM categories;" DB');
    console.log('');
    console.log('Expected: public menu count should match admin /categories tree');
    console.log('          both reflect same DB categories table');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
