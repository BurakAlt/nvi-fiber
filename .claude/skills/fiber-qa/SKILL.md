---
name: fiber-qa
description: Validate fiber calculations, loss budgets, splitter sizing, and topology correctness
triggers:
  - test calculations
  - validate fiber
  - check loss budget
  - verify topology
  - QA test
  - fiber test
---

# Fiber QA Testing

## Purpose
Quality assurance for fiber network calculations. Validate GPON compliance, loss budgets, splitter sizing, cable plans, and topology correctness.

## When to Use
- After implementing or modifying calculation logic
- Before shipping any fiber planning feature
- When fiber calculations seem incorrect
- To validate edge cases (max distance, max BB, etc.)

## Test Categories

### 1. Splitter Sizing Tests
```
Input: BB=1   → Expected: 1:8,  loss=10.5 dB
Input: BB=8   → Expected: 1:8,  loss=10.5 dB
Input: BB=9   → Expected: 1:16, loss=13.5 dB
Input: BB=16  → Expected: 1:16, loss=13.5 dB
Input: BB=17  → Expected: 1:16+1:8, loss=24.0 dB
Input: BB=24  → Expected: 1:16+1:8, loss=24.0 dB
Input: BB=25  → Expected: 1:32, loss=17.5 dB
Input: BB=32  → Expected: 1:32, loss=17.5 dB
Input: BB=0   → Expected: error/warning
Input: BB=33  → Expected: error (exceeds max)
```

### 2. Loss Budget Tests
```
Scenario: Short path, small splitter
  Splitter: 1:8 (10.5 dB)
  Fiber: 0.5 km (0.175 dB)
  Connectors: 4 (2.0 dB)
  Splices: 2 (0.2 dB)
  Margin: 1.0 dB
  Total: 13.875 dB → PASS (< 28 dB)

Scenario: Long path, cascade splitter
  Splitter: 1:16+1:8 (24.0 dB)
  Fiber: 5 km (1.75 dB)
  Connectors: 8 (4.0 dB)
  Splices: 6 (0.6 dB)
  Margin: 1.0 dB
  Total: 31.35 dB → FAIL (> 28 dB)
```

### 3. OLT Placement Tests
- Verify OLT placed at building with minimum weighted distance
- Verify electricity requirement is respected
- Verify floor height bonus applied correctly
- Test with 2, 5, 10, 20 buildings

### 4. Ring Topology Tests
- All buildings connected in a ring
- No orphan buildings
- Ring closure cable exists
- Cable types assigned correctly based on position

### 5. Cable Plan Tests
- Backbone cable from OLT to first splitter
- Distribution cables between nodes
- Drop cables to end buildings
- Total cable length matches sum of segments

### 6. Inventory Tests
- Equipment count matches topology
- No duplicate items
- Costs multiply correctly
- Grand total is sum of all categories

### 7. Edge Cases
- Single building in ada
- Two buildings in ada
- All buildings at same coordinates
- Building with 0 BB
- Building with max BB (32+)
- Very long distances (> 20 km)
- Ada with no electricity in any building

## Validation Process
1. Run each test category
2. Compare actual vs expected output
3. Flag any deviation
4. Report PASS/FAIL with details
5. If FAIL: identify root cause and fix

## Learnings
<!-- Updated by self-annealing loop -->
