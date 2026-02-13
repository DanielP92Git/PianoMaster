import json
import os

def count_keys(obj, prefix=''):
    count = 0
    for key in obj:
        if isinstance(obj[key], dict):
            count += count_keys(obj[key], prefix + key + '.')
        else:
            count += 1
    return count

def get_all_keys(obj, prefix=''):
    keys = []
    for key in obj:
        full_key = prefix + key
        if isinstance(obj[key], dict):
            keys.extend(get_all_keys(obj[key], full_key + '.'))
        else:
            keys.append(full_key)
    return keys

# Load files
en_common = json.load(open('src/locales/en/common.json', encoding='utf-8'))
he_common = json.load(open('src/locales/he/common.json', encoding='utf-8'))
en_trail = json.load(open('src/locales/en/trail.json', encoding='utf-8'))
he_trail = json.load(open('src/locales/he/trail.json', encoding='utf-8'))

# Count keys
print("=== Key Counts ===")
print(f"EN common.json: {count_keys(en_common)} keys")
print(f"HE common.json: {count_keys(he_common)} keys")
print(f"EN trail.json: {count_keys(en_trail)} keys")
print(f"HE trail.json: {count_keys(he_trail)} keys")

# Find missing keys
en_common_keys = set(get_all_keys(en_common))
he_common_keys = set(get_all_keys(he_common))
en_trail_keys = set(get_all_keys(en_trail))
he_trail_keys = set(get_all_keys(he_trail))

missing_in_he_common = en_common_keys - he_common_keys
missing_in_he_trail = en_trail_keys - he_trail_keys

print("\n=== Missing in Hebrew common.json ===")
print(f"Total missing: {len(missing_in_he_common)}")
if missing_in_he_common:
    for key in sorted(missing_in_he_common)[:20]:  # Show first 20
        print(f"  - {key}")
    if len(missing_in_he_common) > 20:
        print(f"  ... and {len(missing_in_he_common) - 20} more")

print("\n=== Missing in Hebrew trail.json ===")
print(f"Total missing: {len(missing_in_he_trail)}")
if missing_in_he_trail:
    for key in sorted(missing_in_he_trail)[:20]:  # Show first 20
        print(f"  - {key}")
    if len(missing_in_he_trail) > 20:
        print(f"  ... and {len(missing_in_he_trail) - 20} more")

# Extra keys in Hebrew (not in English)
extra_in_he_common = he_common_keys - en_common_keys
extra_in_he_trail = he_trail_keys - en_trail_keys

print("\n=== Extra keys in Hebrew common.json (not in English) ===")
print(f"Total extra: {len(extra_in_he_common)}")
if extra_in_he_common:
    for key in sorted(extra_in_he_common)[:20]:
        print(f"  - {key}")

print("\n=== Extra keys in Hebrew trail.json (not in English) ===")
print(f"Total extra: {len(extra_in_he_trail)}")
if extra_in_he_trail:
    for key in sorted(extra_in_he_trail)[:20]:
        print(f"  - {key}")
