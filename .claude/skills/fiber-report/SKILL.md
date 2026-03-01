---
name: fiber-report
description: Generate FTTH topology reports with schematics, maps, and tables
triggers:
  - generate report
  - topology report
  - fiber report
  - export report
  - print report
  - schematic diagram
---

# Fiber Report Generation

## Purpose
Generate professional FTTH topology reports with schematic diagrams, satellite map views, calculation tables, and equipment inventories.

## When to Use
- User wants to export or print a topology report
- User asks for a schematic diagram of the topology
- User wants to see all ada calculations in a document
- User needs a report for project documentation

## Report Sections

### 1. Project Header
- Project name, city, district, date
- Standard (GPON B+), total buildings, total BB

### 2. Topology Schematic (per ada)
- Pentagon nodes for each building (color-coded by type)
- Cable lines between buildings (color-coded by cable type)
- Building names and BB counts as labels
- OLT and Antenna markers clearly identified
- Ring topology visualization

### 3. Satellite Map View (per ada)
- Esri satellite imagery background
- Pentagon markers at building coordinates
- Cable routes overlaid

### 4. Calculation Tables (per ada)
- **Splitter Plan**: Building, BB count, splitter type, port usage
- **Cable Plan**: From-To, cable type, core count, length
- **Loss Budget**: Path, splitter loss, fiber loss, connector loss, total, status
- **Equipment Inventory**: Item, quantity, unit price, total
- **Cost Summary**: Category totals and grand total

### 5. Overall Summary
- All adas combined statistics
- Total equipment inventory across adas
- Grand total cost
- Network overview map

## Visual Standards
- Dark theme (bg: #0F172A, text: #E2E8F0)
- Fonts: JetBrains Mono for data, Outfit for headings
- Pentagon icons match building type colors (mor, mavi, yesil, turuncu, sari)
- Cable lines match type colors (mavi, turuncu, kirmizi, indigo)
- Tables with alternating row colors for readability
- Responsive layout for screen and print

## Export Formats
- HTML (self-contained, single file)
- JSON (raw data export)
- CSV (table data export)
- PDF (via browser print)

## Learnings
<!-- Updated by self-annealing loop -->
