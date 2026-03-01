---
name: fiber-topology
description: Ada-based FTTH topology planning and PON calculations
triggers:
  - topology planning
  - ada planning
  - fiber calculation
  - splitter sizing
  - loss budget
  - OLT placement
  - cable plan
  - ring topology
---

# Fiber Topology Planning

## Purpose
Plan FTTH ring topologies on an ada (city block) basis. Handle building selection, optimal OLT/antenna placement, splitter sizing, cable routing, loss budget calculation, and equipment inventory.

## When to Use
- User wants to plan fiber topology for an ada
- User asks about splitter sizing, loss budget, or cable calculations
- User wants to add/remove buildings from an ada
- User wants to change OLT or antenna placement
- User asks about GPON standards or equipment

## Core Standards
- **GPON ITU-T G.984 Class B+**: 28 dB max optical loss budget
- **Fiber attenuation**: 0.35 dB/km @ 1310nm, 0.25 dB/km @ 1550nm
- **Connector loss**: 0.5 dB per mated pair
- **Splice loss**: 0.1 dB per fusion splice
- **Safety margin**: 1-3 dB recommended

## Ada Workflow

### Step 1: Building Selection
User clicks buildings on NVI map within one ada. Each building captures:
- Name, address, coordinates (lat/lng)
- BB (bagimsiz bolum / independent unit) count
- Floor count, electricity availability

### Step 2: Ada Completion ("Ada Bitir")
When user clicks "Ada Bitir":
1. Calculate optimal OLT building (weighted geometric median)
2. Place antenna at same building (co-location preferred)
3. Generate ring topology connecting all buildings
4. Calculate splitters per building
5. Calculate cable plan (backbone, distribution, drop)
6. Calculate loss budget for each path
7. Generate equipment inventory
8. Calculate costs

### Step 3: Review & Adjust
User can:
- Drag OLT/Antenna to different building
- Add/remove buildings
- Every change triggers full recalculation

## Splitter Sizing Rules
```
BB count | Splitter     | Loss (dB)
---------|-------------|----------
1-8      | 1:8         | 10.5
9-16     | 1:16        | 13.5
17-24    | 1:16 + 1:8  | 24.0
25-32    | 1:32        | 17.5
```

## Optimal OLT Placement Algorithm
```
For each building B in ada:
  score = sum(other.bb * haversineDistance(B, other)) for all other buildings
  if B.hasElectric: score *= 0.8  (20% bonus)
  if B.floor >= 3: score *= 0.95  (5% bonus for height)
Optimal = building with MINIMUM score
```

## Cable Types
| Type | Core Count | Use Case |
|------|-----------|----------|
| Backbone | 48 or 96 | OLT to first splitter |
| Distribution | 12 or 24 | Between splitters |
| Drop | 2 or 4 | Splitter to building |
| Ring | varies | Ring closure |

## Loss Budget Calculation
```
Path Loss = Splitter Loss
          + (Total Fiber Length km * 0.35)
          + (Connector Count * 0.5)
          + (Splice Count * 0.1)
          + Safety Margin (1 dB)

PASS if Path Loss <= 28 dB
FAIL if Path Loss > 28 dB
```

## Recalculation Triggers
Any of these changes triggers full recalculation:
- Building added/removed
- OLT or Antenna moved
- BB count changed
- Cable route modified

## Output Data
All calculations produce JSON-serializable data for:
- Topology schematic rendering
- Map overlay rendering
- Report generation
- Future backend sync (network monitoring)

## Learnings
<!-- Updated by self-annealing loop -->
