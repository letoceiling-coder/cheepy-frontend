# MIGRATIONS VERIFICATION — SERVER DATA

## 1. TABLES CHECK (SHOW TABLES)

```
product_sources
system_product_attributes
system_product_photos
system_products
```

All 4 tables exist.

---

## 2. STRUCTURE (DESCRIBE system_products)

```
Field	Type	Null	Key	Default	Extra
id	bigint(20) unsigned	NO	PRI	NULL	auto_increment
name	varchar(500)	NO		NULL	
description	text	YES		NULL	
price	varchar(100)	YES		NULL	
price_raw	int(10) unsigned	YES		NULL	
status	varchar(20)	NO	MUL	draft	
seller_id	bigint(20) unsigned	YES	MUL	NULL	
category_id	bigint(20) unsigned	YES	MUL	NULL	
brand_id	bigint(20) unsigned	YES	MUL	NULL	
created_at	timestamp	YES		NULL	
updated_at	timestamp	YES		NULL	
```

---

## 3. MIGRATIONS (migrate:status)

```
2026_03_21_100000_create_system_products_table .................... [17] Ran
2026_03_21_100001_create_product_sources_table .................... [17] Ran
2026_03_22_100000_add_donor_updated_at_to_product_sources_table ... [17] Ran
2026_03_22_110000_extend_system_products_for_marketplace .......... [17] Ran
2026_03_22_110001_create_system_product_attributes_table .......... [17] Ran
2026_03_22_110002_create_system_product_photos_table .............. [17] Ran
2026_03_22_120000_add_typed_values_to_system_product_attributes ... [17] Ran
2026_03_22_130000_add_attr_value_original_to_system_product_attributes  [17] Ran
2026_03_22_140000_add_unique_index_to_system_product_attributes ... [18] Ran
```

---

## 4. API RESPONSE

**Request:**
```
GET https://online-parser.siteaacess.store/api/v1/admin/system-products?per_page=2
Authorization: Bearer <JWT>
```

**HTTP Status:** 200

**Response JSON:**
```json
{"data":[],"meta":{"total":0,"per_page":2,"current_page":1,"last_page":1}}
```

---

## SUMMARY

| Check           | Result |
|----------------|--------|
| Tables exist   | OK     |
| Migrations ran | OK     |
| API status     | 200    |
| API JSON       | Valid  |
