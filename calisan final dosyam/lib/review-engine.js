/**
 * Review Engine - Topology Quality Classifier
 * Evaluates ada fiber plans across predefined categories with pass/warning/fail ratings
 * Inspired by Anthropic Review Classifier pattern
 */

const ReviewEngine = (() => {

  // ─── CATEGORY DEFINITIONS ────────────────────────────────────────

  const CATEGORIES = {
    lossBudget:  { name: 'Kayip Butcesi',        weight: 0.30, icon: 'dB' },
    standard:    { name: 'Standart Uyumu',        weight: 0.20, icon: 'ITU' },
    splitter:    { name: 'Splitter Konfigurasyon', weight: 0.15, icon: 'SPL' },
    olt:         { name: 'OLT Yerlesimi',         weight: 0.15, icon: 'OLT' },
    cable:       { name: 'Kablo Yonlendirme',     weight: 0.10, icon: 'CBL' },
    cost:        { name: 'Maliyet Verimliligi',   weight: 0.10, icon: 'TL' }
  };

  const STATUS = { pass: 'pass', warning: 'warning', fail: 'fail' };

  // Score thresholds for status
  function statusFromScore(score) {
    if (score >= 80) return STATUS.pass;
    if (score >= 50) return STATUS.warning;
    return STATUS.fail;
  }

  // ─── CATEGORY EVALUATORS ─────────────────────────────────────────

  /**
   * Loss Budget: margin adequacy + worst case
   */
  function evalLossBudget(ada) {
    const results = [];
    const lb = ada.calculations.lossBudget || [];
    if (lb.length === 0) return [{ subcategory: 'Veri Yok', status: STATUS.warning, score: 50, detail: 'Kayip butcesi hesaplanmamis' }];

    // Sub 1: Margin adequacy (all buildings)
    const margins = lb.map(l => l.margin);
    const minMargin = Math.min(...margins);
    const avgMargin = margins.reduce((s, m) => s + m, 0) / margins.length;
    const failCount = margins.filter(m => m < 0).length;
    const warnCount = margins.filter(m => m >= 0 && m < 3).length;

    let score1;
    if (failCount > 0) score1 = Math.max(0, 30 - failCount * 15);
    else if (warnCount > 0) score1 = Math.max(50, 80 - warnCount * 10);
    else if (minMargin >= 5) score1 = 100;
    else score1 = Math.round(80 + (minMargin - 3) * 10);

    results.push({
      subcategory: 'Marj Yeterliligi',
      status: statusFromScore(score1),
      score: score1,
      detail: failCount > 0
        ? `${failCount} bina limit asimi! Min marj: ${minMargin} dB`
        : warnCount > 0
          ? `${warnCount} bina dusuk marjli. Ort: ${avgMargin.toFixed(1)} dB`
          : `Tum binalar yeterli. Min: ${minMargin.toFixed(1)} dB, Ort: ${avgMargin.toFixed(1)} dB`
    });

    // Sub 2: Worst case building
    const worst = lb.reduce((w, l) => l.totalLoss > w.totalLoss ? l : w, lb[0]);
    const worstScore = worst.margin >= 5 ? 100 : worst.margin >= 3 ? 85 : worst.margin >= 0 ? 60 : 0;
    results.push({
      subcategory: 'En Kotu Bina',
      status: statusFromScore(worstScore),
      score: worstScore,
      detail: `${worst.buildingName}: ${worst.totalLoss} dB (marj: ${worst.margin} dB, mesafe: ${worst.distanceM}m)`
    });

    return results;
  }

  /**
   * GPON B+ Standard compliance
   */
  function evalStandard(ada) {
    const results = [];
    const lb = ada.calculations.lossBudget || [];
    const cables = ada.calculations.cables || [];

    // Sub 1: 28 dB limit
    const overLimit = lb.filter(l => l.totalLoss > PonEngine.CONSTANTS.maxLossBudget);
    const limitScore = overLimit.length === 0 ? 100 : Math.max(0, 50 - overLimit.length * 25);
    results.push({
      subcategory: '28 dB Limit',
      status: statusFromScore(limitScore),
      score: limitScore,
      detail: overLimit.length === 0
        ? 'Tum binalar 28 dB siniri icinde'
        : `${overLimit.length} bina 28 dB sinirini asiyor!`
    });

    // Sub 2: Core count compliance
    const backbone = cables.filter(c => c.type === 'backbone');
    const distribution = cables.filter(c => c.type === 'distribution');
    const bbCoreOk = backbone.every(c => c.cores >= 48);
    const distCoreOk = distribution.every(c => c.cores >= 12);
    const coreScore = (bbCoreOk && distCoreOk) ? 100 : (!bbCoreOk && !distCoreOk) ? 30 : 65;
    results.push({
      subcategory: 'Kor Sayisi',
      status: statusFromScore(coreScore),
      score: coreScore,
      detail: `Backbone: ${bbCoreOk ? 'OK (>=48)' : 'YETERSIZ'}, Dagitim: ${distCoreOk ? 'OK (>=12)' : 'YETERSIZ'}`
    });

    return results;
  }

  /**
   * Splitter configuration efficiency
   */
  function evalSplitter(ada) {
    const results = [];
    const splitters = ada.calculations.splitters || [];
    if (splitters.length === 0) return [{ subcategory: 'Veri Yok', status: STATUS.warning, score: 50, detail: 'Splitter hesabi yok' }];

    // Sub 1: Port utilization (idle port ratio)
    let totalPorts = 0, totalBB = 0;
    for (const s of splitters) {
      totalPorts += s.totalPorts || 0;
      totalBB += s.bb || 0;
    }
    const utilization = totalPorts > 0 ? (totalBB / totalPorts) * 100 : 0;
    const idleRatio = 100 - utilization;
    const sizeScore = idleRatio < 30 ? 100 : idleRatio < 50 ? 70 : idleRatio < 70 ? 45 : 20;
    results.push({
      subcategory: 'Boyutlandirma',
      status: statusFromScore(sizeScore),
      score: sizeScore,
      detail: `Port kullanim: %${Math.round(utilization)}, Atil: %${Math.round(idleRatio)} (${totalBB}/${totalPorts} port)`
    });

    // Sub 2: Cascade efficiency
    const needsCascade = splitters.filter(s => s.bb > 16);
    const hasCascade = splitters.filter(s => s.cascade && s.cascade.level1);
    const cascadeOk = needsCascade.length === 0 || hasCascade.length > 0;
    const cascadeScore = cascadeOk ? 100 : 40;
    results.push({
      subcategory: 'Kaskad Verimliligi',
      status: statusFromScore(cascadeScore),
      score: cascadeScore,
      detail: cascadeOk
        ? `${hasCascade.length} binada 2-seviye kaskad aktif`
        : `${needsCascade.length} bina >16 BB ama kaskad yok`
    });

    return results;
  }

  /**
   * OLT placement quality
   */
  function evalOLT(ada) {
    const results = [];
    const blds = ada.buildings;
    if (blds.length === 0) return [{ subcategory: 'Veri Yok', status: STATUS.warning, score: 50, detail: 'Bina yok' }];

    // Sub 1: Position optimality
    const currentOLTId = ada.topology.oltBuildingId;
    const optimalOLTId = PonEngine.findOptimalOLT(blds);
    const currentOLT = blds.find(b => b.id === currentOLTId);
    const optimalOLT = blds.find(b => b.id === optimalOLTId);

    let posScore = 100;
    let posDetail = '';
    if (currentOLTId === optimalOLTId) {
      posDetail = `OLT optimal konumda: ${currentOLT?.name || '?'}`;
    } else if (currentOLT && optimalOLT) {
      const drift = PonEngine.safeDist(currentOLT, optimalOLT);
      posScore = drift < 50 ? 90 : drift < 150 ? 70 : drift < 300 ? 50 : 30;
      posDetail = `OLT, optimalden ${Math.round(drift)}m uzakta (Optimal: ${optimalOLT.name})`;
    } else {
      posScore = 60;
      posDetail = 'OLT konumu dogrulanamadi';
    }
    results.push({ subcategory: 'Konum Optimaligi', status: statusFromScore(posScore), score: posScore, detail: posDetail });

    // Sub 2: Capacity utilization
    const cap = ada.calculations.oltCapacity;
    if (cap) {
      const capScore = cap.utilization <= 80 ? 100 : cap.utilization <= 90 ? 65 : 30;
      results.push({
        subcategory: 'Kapasite Kullanimi',
        status: statusFromScore(capScore),
        score: capScore,
        detail: `%${cap.utilization} doluluk, ${cap.requiredPorts} port (${cap.totalBB} BB, ${cap.totalONT} ONT)`
      });
    }

    return results;
  }

  /**
   * Cable routing efficiency
   */
  function evalCable(ada) {
    const results = [];
    const cables = ada.calculations.cables || [];
    const blds = ada.buildings;
    if (cables.length === 0 || blds.length < 2) return [{ subcategory: 'Veri Yok', status: STATUS.warning, score: 50, detail: 'Kablo verisi yok' }];

    // Sub 1: MST efficiency (total cable vs crow-fly sum)
    const distCables = cables.filter(c => c.type === 'distribution');
    const totalDist = distCables.reduce((s, c) => s + c.distanceM, 0);
    const oltB = blds.find(b => b.id === ada.topology.oltBuildingId);
    const crowFlySum = oltB ? blds.filter(b => b.id !== oltB.id).reduce((s, b) => s + PonEngine.safeDist(oltB, b), 0) : totalDist;
    const efficiency = crowFlySum > 0 ? (crowFlySum / Math.max(crowFlySum, totalDist)) * 100 : 100;
    const mstScore = efficiency >= 80 ? 100 : efficiency >= 60 ? 75 : efficiency >= 40 ? 50 : 30;
    results.push({
      subcategory: 'MST Verimliligi',
      status: statusFromScore(mstScore),
      score: mstScore,
      detail: `Dagitim kablo: ${totalDist}m, Kus ucusu: ${Math.round(crowFlySum)}m (%${Math.round(efficiency)} verimlilik)`
    });

    // Sub 2: Drop cable reasonableness
    const drops = cables.filter(c => c.type === 'drop');
    const avgDrop = drops.length > 0 ? drops.reduce((s, c) => s + c.distanceM, 0) / drops.length : 0;
    const maxDrop = drops.length > 0 ? Math.max(...drops.map(c => c.distanceM)) : 0;
    const dropScore = maxDrop <= 50 ? 100 : maxDrop <= 100 ? 80 : maxDrop <= 200 ? 55 : 30;
    results.push({
      subcategory: 'Drop Kablo',
      status: statusFromScore(dropScore),
      score: dropScore,
      detail: `Ort: ${Math.round(avgDrop)}m, Maks: ${maxDrop}m (${drops.length} bina)`
    });

    return results;
  }

  /**
   * Cost efficiency
   */
  function evalCost(ada) {
    const results = [];
    const totalCost = ada.calculations.costs?.total || 0;
    const totalBB = ada.buildings.reduce((s, b) => s + b.bb, 0);
    if (totalBB === 0) return [{ subcategory: 'Veri Yok', status: STATUS.warning, score: 50, detail: 'BB verisi yok' }];

    // Sub 1: Cost per BB (benchmark: 2000-5000 TL is good for Turkey FTTH)
    const perBB = totalCost / totalBB;
    const bbScore = perBB <= 3000 ? 100 : perBB <= 5000 ? 80 : perBB <= 8000 ? 55 : 30;
    results.push({
      subcategory: 'BB Basi Maliyet',
      status: statusFromScore(bbScore),
      score: bbScore,
      detail: `${Math.round(perBB).toLocaleString('tr-TR')} TL/BB (Hedef: <5.000 TL)`
    });

    // Sub 2: Cost per subscriber
    const subs = Math.ceil(totalBB * PonEngine.CONSTANTS.penetrationTarget);
    const perSub = totalCost / subs;
    const subScore = perSub <= 5000 ? 100 : perSub <= 8000 ? 75 : perSub <= 12000 ? 50 : 25;
    results.push({
      subcategory: 'Abone Basi Maliyet',
      status: statusFromScore(subScore),
      score: subScore,
      detail: `${Math.round(perSub).toLocaleString('tr-TR')} TL/abone (${subs} abone, %70 penetrasyon)`
    });

    return results;
  }

  // ─── MAIN REVIEW FUNCTION ────────────────────────────────────────

  /**
   * Run full review on an ada - returns structured review report
   * @param {Object} ada - Ada object with buildings, topology, calculations
   * @returns {{ categories: Array, overallScore: number, overallStatus: string, summary: string }}
   */
  function reviewAda(ada) {
    if (!ada || ada.buildings.length === 0) {
      return { categories: [], overallScore: 0, overallStatus: STATUS.fail, summary: 'Bos ada - degerlendirme yapilamaz' };
    }

    const evaluators = {
      lossBudget: evalLossBudget,
      standard:   evalStandard,
      splitter:   evalSplitter,
      olt:        evalOLT,
      cable:      evalCable,
      cost:       evalCost
    };

    const categories = [];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [key, evalFn] of Object.entries(evaluators)) {
      const cat = CATEGORIES[key];
      const subcategories = evalFn(ada);
      const catScore = subcategories.length > 0
        ? Math.round(subcategories.reduce((s, sc) => s + sc.score, 0) / subcategories.length)
        : 50;

      categories.push({
        key,
        name: cat.name,
        icon: cat.icon,
        weight: cat.weight,
        score: catScore,
        status: statusFromScore(catScore),
        subcategories
      });

      weightedSum += catScore * cat.weight;
      totalWeight += cat.weight;
    }

    const overallScore = Math.round(weightedSum / totalWeight);
    const overallStatus = statusFromScore(overallScore);

    const passCount = categories.filter(c => c.status === STATUS.pass).length;
    const warnCount = categories.filter(c => c.status === STATUS.warning).length;
    const failCount = categories.filter(c => c.status === STATUS.fail).length;

    const summary = `Skor: ${overallScore}/100 | ${passCount} gecti, ${warnCount} uyari, ${failCount} basarisiz`;

    return { categories, overallScore, overallStatus, summary };
  }

  /**
   * Review all adas - aggregate scores
   */
  function reviewAll(adas) {
    if (!adas || adas.length === 0) return { adaReviews: [], overallScore: 0, overallStatus: STATUS.fail, summary: 'Ada yok' };

    const adaReviews = adas.map(ada => ({
      adaId: ada.id,
      adaName: ada.name,
      buildingCount: ada.buildings.length,
      review: reviewAda(ada)
    }));

    const scores = adaReviews.map(r => r.review.overallScore);
    const overallScore = Math.round(scores.reduce((s, sc) => s + sc, 0) / scores.length);
    const overallStatus = statusFromScore(overallScore);
    const summary = `${adas.length} ada, ortalama skor: ${overallScore}/100`;

    return { adaReviews, overallScore, overallStatus, summary };
  }

  // Public API
  return {
    CATEGORIES,
    reviewAda,
    reviewAll,
    statusFromScore
  };
})();
