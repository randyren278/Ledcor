#!/usr/bin/env python3
from pathlib import Path
import sys
import pandas as pd
from openpyxl import load_workbook

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------
INPUT_FILE         = Path("NAP and port check  ORCA 05_14_2025 Epic completed new pull.xlsx")
OUTPUT_FILE        = Path("filteredfinal.xlsx")
SHEET_NAME         = "Your Jira Issues"

DATE_COL           = "Created"
NAP_COL            = "NAP Number"
CLIENT_NAP_COL     = "Client NAP Number"
MPT_COL            = "MPT Port Number"
COID_COL           = "COID"

# This is the header of the column in your sheet with the formula:
# =IF(OR(X1560="fail",X1559="fail"),"port# to check","")
SECONDARY_FLAG_COL = "Secondary port# check"

# These are columns *we* will add
FLAG_COL           = "Check Flag"
DUP_PORTS_COL      = "Duplicate MPT Ports"

IGNORE_COIDS       = ["ACME", "SYPL", "FAKE"]
CUTOFF_DATE        = pd.Timestamp("2024-03-01")

# ---------------------------------------------------------------------------
# LOAD SHEET
# ---------------------------------------------------------------------------
if not INPUT_FILE.exists():
    sys.exit(f"❌ Cannot find input file: {INPUT_FILE}")

df = pd.read_excel(INPUT_FILE, sheet_name=SHEET_NAME, engine="openpyxl")
print(f"▶ Loaded '{SHEET_NAME}' with {len(df)} rows")

# ---------------------------------------------------------------------------
# BASIC COLUMN CHECKS
# ---------------------------------------------------------------------------
required = [DATE_COL, NAP_COL, MPT_COL, COID_COL, SECONDARY_FLAG_COL]
missing = [c for c in required if c not in df.columns]
if missing:
    sys.exit(f"❌ Missing column(s): {', '.join(missing)}")

# ---------------------------------------------------------------------------
# 1) DROP IGNORED COIDs
# ---------------------------------------------------------------------------
pre_drop = len(df)
df = df[~df[COID_COL].isin(IGNORE_COIDS)]
print(f"ℹ Dropped {pre_drop - len(df)} rows with COID ∈ {IGNORE_COIDS}")

# ---------------------------------------------------------------------------
# 2) DATE FILTER (Created ≥ CUTOFF_DATE)
# ---------------------------------------------------------------------------
df[DATE_COL] = pd.to_datetime(df[DATE_COL], errors="coerce")
df = df.dropna(subset=[DATE_COL])
df = df[df[DATE_COL] >= CUTOFF_DATE]
print(f"ℹ Rows after date filter: {len(df)}")

# ---------------------------------------------------------------------------
# 3) IDENTIFY DUPLICATES WITHIN THE SAME COID & NAP
# ---------------------------------------------------------------------------
dup_mask = df.duplicated(subset=[COID_COL, NAP_COL, MPT_COL], keep=False)

# Build a map: (COID, NAP) → sorted list of duplicated MPT ports
port_map = {}
bad_groups = df.loc[dup_mask, [COID_COL, NAP_COL]].drop_duplicates().itertuples(index=False, name=None)
for coid, nap in bad_groups:
    ports = df.loc[
        (df[COID_COL] == coid) &
        (df[NAP_COL] == nap) &
        dup_mask,
        MPT_COL
    ].unique().tolist()
    port_map[(coid, nap)] = sorted(ports)
print(f"⚠ Found {len(port_map)} COID+NAP groups with duplicated ports")

# ---------------------------------------------------------------------------
# 4) FINAL FILTER: require both our internal flag AND the sheet's port-check flag
# ---------------------------------------------------------------------------
# internal_flag: rows whose (COID, NAP) appear in port_map
internal_flag  = df.apply(lambda r: (r[COID_COL], r[NAP_COL]) in port_map, axis=1)
# sheet_flag: the existing "#ports to check" column is non-empty
sheet_flag     = df[SECONDARY_FLAG_COL].astype(bool)
final_mask     = internal_flag & sheet_flag

print(f"ℹ Rows passing both flags: {final_mask.sum()}")

filtered_df = df.loc[final_mask].copy()

# ---------------------------------------------------------------------------
# 5) ANNOTATE – add Duplicate MPT Ports list and our Check Flag text
# ---------------------------------------------------------------------------
filtered_df[DUP_PORTS_COL] = filtered_df.apply(
    lambda r: ", ".join(map(str, port_map[(r[COID_COL], r[NAP_COL])])),
    axis=1
)
filtered_df[FLAG_COL] = filtered_df.apply(
    lambda r: f"🚩 Dup MPTs for COID {r[COID_COL]}, NAP {r[NAP_COL]} → ports {', '.join(map(str, port_map[(r[COID_COL], r[NAP_COL])]))}",
    axis=1
)

# ---------------------------------------------------------------------------
# 6) SORT – by COID ↑, NAP ↑, MPT ↑, Created ↓
# ---------------------------------------------------------------------------
filtered_df = filtered_df.sort_values(
    by=[COID_COL, NAP_COL, MPT_COL, DATE_COL],
    ascending=[True, True, True, False]
)

# ---------------------------------------------------------------------------
# 7) SAVE WITH EXCEL AUTO-FILTERS
# ---------------------------------------------------------------------------
filtered_df.to_excel(OUTPUT_FILE, sheet_name=SHEET_NAME, index=False)
wb = load_workbook(OUTPUT_FILE)
ws = wb[SHEET_NAME]
ws.auto_filter.ref = ws.dimensions
wb.save(OUTPUT_FILE)

print(f"✅ Saved to {OUTPUT_FILE} – review row count & filters")
