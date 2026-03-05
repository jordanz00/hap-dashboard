// Core data constants derived from the January 2026 report
const economicImpact = {
  gdpSharePercent: 19,
  totalEconomicOutputBillion: 195,
  communityBenefitBillion: 10.8,
  jobs: 300000,
  wagesBillion: 33
};

const currentFinancials = {
  hospitalsBelow4pctMarginPercent: 51,
  hospitalsNegativeMarginPercent: 37,
  closuresSince2016: 25,
  statewideShortfall2023Billion: 3.3
};

const reimbursementStats = {
  commercialBelowNationalMedianPpts: 29,
  medicaidCostCoveragePa: 0.87,
  medicaidCostCoverageNational: 1.26,
  medicareCostCoveragePa: 0.82
};

const scenarios = [
  {
    id: "baseline_no_hr1",
    name: "Baseline (No H.R. 1)",
    shortLabel: "Baseline",
    netMargin2030Percent: -1,
    revenueDelta2030Billion: -1,
    keyPoints: [
      "Population ages, shifting more patients into Medicare.",
      "Medicaid and Medicare reimbursement grow more slowly than costs.",
      "Enhanced ACA subsidies expire, reducing Marketplace coverage."
    ]
  },
  {
    id: "baseline_hr1",
    name: "Baseline with H.R. 1",
    shortLabel: "Baseline + H.R. 1",
    netMargin2030Percent: -3,
    revenueDelta2030Billion: -2.4,
    keyPoints: [
      "95,000 fewer ACA enrollees and 300,000 fewer Medicaid enrollees.",
      "Medicaid payments capped at Medicare rates.",
      "Higher uncompensated care and lower payments for covered services."
    ]
  },
  {
    id: "rainy_day",
    name: "Rainy Day (Downward Cycle)",
    shortLabel: "Rainy Day",
    netMargin2030Percent: -11,
    revenueDelta2030Billion: -7.4,
    projectedClosuresMin: 12,
    projectedClosuresMax: 14,
    keyPoints: [
      "Higher unemployment and out‑migration reduce Commercial coverage.",
      "Medicare sequestration increases to 4%.",
      "Loss of 340B discounts increases drug costs at some hospitals."
    ]
  },
  {
    id: "sustainability",
    name: "Sustainability Prevails (Upward Cycle)",
    shortLabel: "Sustainability",
    netMargin2030Percent: 5,
    revenueDelta2030Billion: 3.7,
    keyPoints: [
      "Commercial reimbursement rises to the national median.",
      "Pragmatic medical liability reform reduces premium costs.",
      "AI and operational improvements enhance productivity and can support quality."
    ]
  }
];

// Simple lever model: map qualitative settings to an indicative scenario band
function inferScenarioBand(settings) {
  const score =
    (settings.medicaid === "transformed" ? 2 : settings.medicaid === "improved" ? 1 : 0) +
    (settings.liability === "transformed" ? 2 : settings.liability === "improved" ? 1 : 0) +
    (settings.regs === "transformed" ? 1 : settings.regs === "improved" ? 0.5 : 0) +
    (settings.ai === "transformed" ? 1 : settings.ai === "improved" ? 0.5 : 0);

  if (score >= 3.5) return "sustainability";
  if (score >= 1.5) return "baseline_no_hr1";
  return "rainy_day";
}

function bandDescription(bandId) {
  switch (bandId) {
    case "sustainability":
      return {
        label: "Trajectory: approaching Sustainability Prevails",
        detail:
          "A package of stronger reimbursement, liability reform, streamlined administration, and productivity‑enhancing AI moves hospitals toward sustainable 5% margins and preserves access."
      };
    case "baseline_no_hr1":
      return {
        label: "Trajectory: near Baseline",
        detail:
          "Incremental improvements moderate financial pressure but leave many hospitals with thin or negative margins, limiting investment and leaving some communities at risk."
      };
    case "rainy_day":
    default:
      return {
        label: "Trajectory: close to Rainy Day",
        detail:
          "Without material changes, hospitals remain under significant financial strain, with heightened risk of service reductions and closures by 2030."
      };
  }
}

// Gauge data per KPI for the overview half-circle (value 0–100, label, sublabel)
const kpiGaugeData = {
  gdp: { value: 19, label: "19%", sublabel: "of PA GDP" },
  output: { value: 97.5, label: "$195B", sublabel: "economic output" },
  community: { value: 72, label: "$10.8B", sublabel: "community benefit" },
  jobs: { value: 75, label: "300K", sublabel: "jobs supported" },
  wages: { value: 66, label: "$33B+", sublabel: "wages & benefits" }
};

// Chart.js plugin for center text in the overview gauge (reads active KPI from chart)
const overviewGaugePlugin = {
  id: "overviewGaugePlugin",
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const kpi = chart.config._activeKpi || kpiGaugeData.gdp;

    ctx.save();
    const x = (chartArea.left + chartArea.right) / 2;
    const y = chartArea.top + (chartArea.bottom - chartArea.top) * 0.62;

    ctx.textAlign = "center";
    ctx.fillStyle = "#102a43";
    ctx.font = "bold 18px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(kpi.label, x, y);
    ctx.font = "11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#6b7b93";
    ctx.fillText(kpi.sublabel, x, y + 18);
    ctx.restore();
  }
};

const CHART_ANIM_DURATION = 1200;

// UI initialization
document.addEventListener("DOMContentLoaded", () => {
  renderScenarioCards();
  initClosuresMap();
  initClosuresScrollAnimations();
  initImpactCountUp();
  initChartsWhenVisible();
  initBackToTop();
});

function renderOverviewKPIs(overviewChart) {
  const container = document.getElementById("overview-kpis");
  if (!container) return;

  const formatter = new Intl.NumberFormat("en-US");

  const focusTitle = document.getElementById("kpi-focus-title");
  const focusText = document.getElementById("kpi-focus-text");

  const kpis = [
    {
      id: "gdp",
      label: "Share of state GDP",
      value: `${economicImpact.gdpSharePercent}%`,
      detail: "Hospitals and related activity as a share of the Commonwealth’s GDP.",
      focusTitle: "Hospitals’ share of the economy",
      focusText: `Hospitals’ direct and indirect activity represents about ${economicImpact.gdpSharePercent}% of Pennsylvania’s GDP.`
    },
    {
      id: "output",
      label: "Total economic output",
      value: `$${economicImpact.totalEconomicOutputBillion}B`,
      detail: "Direct and indirect contributions from hospitals statewide.",
      focusTitle: "Total statewide economic output",
      focusText: `Hospitals generate roughly $${economicImpact.totalEconomicOutputBillion} billion in total economic activity across the Commonwealth.`
    },
    {
      id: "community",
      label: "Community benefit",
      value: `$${economicImpact.communityBenefitBillion}B`,
      detail: "Includes shortfalls from Medicare/Medicaid, bad debt, and charity care.",
      focusTitle: "Community benefit and safety‑net role",
      focusText: `Hospitals provide about $${economicImpact.communityBenefitBillion} billion in community benefit, covering public program shortfalls, charity care, and bad debt.`
    },
    {
      id: "jobs",
      label: "Jobs supported",
      value: `${formatter.format(economicImpact.jobs)}`,
      detail: "Individuals employed directly by hospitals across Pennsylvania.",
      focusTitle: "Hospitals as major employers",
      focusText: `Hospitals directly employ more than ${formatter.format(
        economicImpact.jobs
      )} Pennsylvanians, in addition to supporting many more jobs through supply chains.`
    },
    {
      id: "wages",
      label: "Wages and benefits",
      value: `$${economicImpact.wagesBillion}B+`,
      detail: "Direct wages and benefits paid by hospitals.",
      focusTitle: "Wages and benefits",
      focusText: `Hospitals pay over $${economicImpact.wagesBillion} billion in wages and benefits, sustaining families and local economies statewide.`
    }
  ];

  let activeId = "gdp";

  const setActive = (id) => {
    activeId = id;
    const kpi = kpis.find((k) => k.id === id);
    if (kpi && focusTitle && focusText) {
      focusTitle.textContent = kpi.focusTitle;
      focusText.textContent = kpi.focusText;
    }
    container.querySelectorAll(".kpi-card").forEach((card) => {
      if (card.dataset.kpiId === id) {
        card.classList.add("kpi-active");
      } else {
        card.classList.remove("kpi-active");
      }
    });
    if (overviewChart && kpiGaugeData[id]) {
      const g = kpiGaugeData[id];
      overviewChart.data.datasets[0].data = [g.value, 100 - g.value];
      overviewChart.config._activeKpi = { label: g.label, sublabel: g.sublabel };
      overviewChart.update();
    }
  };

  for (const kpi of kpis) {
    const card = document.createElement("div");
    card.className = "kpi-card";
    card.dataset.kpiId = kpi.id;
    card.innerHTML = `
      <div class="kpi-label">${kpi.label}</div>
      <div class="kpi-value">${kpi.value}</div>
      <div class="kpi-detail">${kpi.detail}</div>
    `;
    card.addEventListener("click", () => setActive(kpi.id));
    container.appendChild(card);
  }

  // Set initial active tile
  setActive(activeId);
}

function initEconomicShareChart() {
  const ctx = document.getElementById("economicShareChart");
  if (!ctx) return null;
  const existing = Chart.getChart(ctx);
  if (existing) return existing;

  const g = kpiGaugeData.gdp;
  const chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Active metric", "Remaining"],
      datasets: [
        {
          data: [g.value, 100 - g.value],
          backgroundColor: ["#0072bc", "#e2e8f0"],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed}%`
          }
        }
      },
      rotation: -90,
      circumference: 180,
      cutout: "70%"
    },
    plugins: [overviewGaugePlugin]
  });
  chart.config._activeKpi = { label: g.label, sublabel: g.sublabel };
  return chart;
}

function initMarginChart() {
  const ctx = document.getElementById("marginChart");
  if (!ctx || Chart.getChart(ctx)) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Below 4% margin", "Negative margin"],
      datasets: [
        {
          label: "% of hospitals",
          data: [
            currentFinancials.hospitalsBelow4pctMarginPercent,
            currentFinancials.hospitalsNegativeMarginPercent
          ],
          backgroundColor: ["#0072bc", "#b91c1c"]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: CHART_ANIM_DURATION },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y}% of hospitals`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`
          }
        }
      }
    }
  });
}

function initReimbursementChart() {
  const ctx = document.getElementById("reimbursementChart");
  if (!ctx || Chart.getChart(ctx)) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Commercial", "Medicaid", "Medicare"],
      datasets: [
        {
          label: "Pennsylvania",
          data: [
            100 - reimbursementStats.commercialBelowNationalMedianPpts,
            reimbursementStats.medicaidCostCoveragePa * 100,
            reimbursementStats.medicareCostCoveragePa * 100
          ],
          backgroundColor: "#0072bc"
        },
        {
          label: "National / cost benchmark",
          data: [100, reimbursementStats.medicaidCostCoverageNational * 100, 100],
          backgroundColor: "#8ed8f8"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: CHART_ANIM_DURATION },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}% of cost`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 140,
          ticks: {
            callback: (value) => `${value}%`
          }
        }
      }
    }
  });
}

function initScenarioMarginChart() {
  const ctx = document.getElementById("scenarioMarginChart");
  if (!ctx || Chart.getChart(ctx)) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: scenarios.map((s) => s.shortLabel),
      datasets: [
        {
          label: "2030 net margin",
          data: scenarios.map((s) => s.netMargin2030Percent),
          backgroundColor: scenarios.map((s) => {
            if (s.id === "sustainability") return "#fbb040";
            if (s.id === "rainy_day") return "#b91c1c";
            return "#0072bc";
          })
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: CHART_ANIM_DURATION },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y}% net margin`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `${value}%`
          }
        }
      }
    }
  });
}

function initBondRatingChart() {
  const ctx = document.getElementById("bondRatingChart");
  if (!ctx || Chart.getChart(ctx)) return;

  const ratingScale = {
    "AAA": 9,
    "AA+": 8,
    "AA": 7,
    "AA-": 6,
    "A+": 5,
    "A": 4,
    "A-": 3,
    "BBB+": 2,
    "BBB": 1,
    "BBB-": 0
  };

  const inverseScale = Object.entries(ratingScale).reduce((acc, [k, v]) => {
    acc[v] = k;
    return acc;
  }, {});

  const paSystem = "A";
  const natSystem = "A+";
  const paStandalone = "BBB+";
  const natStandalone = "A-";

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Hospital systems", "Stand‑alone hospitals"],
      datasets: [
        {
          label: "Pennsylvania",
          data: [ratingScale[paSystem], ratingScale[paStandalone]],
          backgroundColor: "#0072bc"
        },
        {
          label: "National median",
          data: [ratingScale[natSystem], ratingScale[natStandalone]],
          backgroundColor: "#8ed8f8"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: CHART_ANIM_DURATION },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const grade = inverseScale[ctx.parsed.y];
              return `${ctx.dataset.label}: ${grade}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 6,
          ticks: {
            stepSize: 1,
            callback: (value) => inverseScale[value] || ""
          }
        }
      }
    }
  });
}

function initChartsWhenVisible() {
  const chartConfigs = [
    {
      container: document.querySelector("#overview .mini-chart-wrapper"),
      init: () => {
        const ch = initEconomicShareChart();
        if (ch) renderOverviewKPIs(ch);
      }
    },
    {
      container: document.querySelector("#marginChart")?.closest(".chart-container"),
      init: initMarginChart
    },
    {
      container: document.querySelector("#reimbursementChart")?.closest(".chart-container"),
      init: initReimbursementChart
    },
    {
      container: document.querySelector("#bondRatingChart")?.closest(".chart-container"),
      init: initBondRatingChart
    },
    {
      container: document.querySelector("#scenarioMarginChart")?.closest(".chart-container"),
      init: initScenarioMarginChart
    },
    {
      container: document.getElementById("levers"),
      init: () => {
        if (document.getElementById("lever-outcome-label")?.hasAttribute("data-inited")) return;
        document.getElementById("lever-outcome-label")?.setAttribute("data-inited", "1");
        initLeverSimulator();
      }
    }
  ];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const config = chartConfigs.find((c) => c.container === entry.target);
        if (config?.init) {
          config.init();
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  chartConfigs.forEach((config) => {
    if (config.container) observer.observe(config.container);
  });
}

function renderScenarioCards() {
  const container = document.getElementById("scenario-cards");
  if (!container) return;

  const summaries = {
    baseline_no_hr1: "If nothing changes: hospitals slowly lose money.",
    baseline_hr1: "If federal cuts happen: bigger losses for hospitals.",
    rainy_day: "Worst case: deep losses and 12–14 more closures.",
    sustainability: "If we act: hospitals can be financially healthy again."
  };

  scenarios.forEach((s) => {
    const card = document.createElement("article");
    card.className = "scenario-card";

    const marginLabel =
      s.netMargin2030Percent > 0
        ? `+${s.netMargin2030Percent}% margin · $${Math.abs(s.revenueDelta2030Billion)}B net income`
        : `${s.netMargin2030Percent}% margin · $${Math.abs(s.revenueDelta2030Billion)}B shortfall`;

    const closureText =
      s.projectedClosuresMin && s.projectedClosuresMax
        ? `<li><strong>${s.projectedClosuresMin}–${s.projectedClosuresMax} hospitals</strong> at risk of closing by 2030.</li>`
        : "";

    const pointsHtml = s.keyPoints.map((p) => `<li>${p}</li>`).join("");
    const summary = summaries[s.id] || "";

    card.innerHTML = `
      <div class="scenario-chip">${s.name}</div>
      <p class="scenario-summary">${summary}</p>
      <p class="scenario-margin">${marginLabel}</p>
      <ul class="scenario-points">
        ${closureText}
        ${pointsHtml}
      </ul>
    `;
    container.appendChild(card);
  });
}

function initLeverSimulator() {
  const form = document.getElementById("lever-form");
  const labelEl = document.getElementById("lever-outcome-label");
  const detailEl = document.getElementById("lever-outcome-detail");
  const chartCanvas = document.getElementById("leverScenarioChart");
  if (!form || !labelEl || !detailEl || !chartCanvas) return;

  const leverDefaults = {
    medicaid: "current",
    liability: "current",
    regs: "current",
    ai: "current"
  };

  const getSettings = () => ({ ...leverDefaults });

  // Initialize button groups
  const leverGroups = form.querySelectorAll(".lever-group");
  leverGroups.forEach((group) => {
    const leverKey = group.getAttribute("data-lever");
    const buttons = group.querySelectorAll(".lever-option");
    buttons.forEach((btn) => {
      const level = btn.getAttribute("data-level");
      if (leverDefaults[leverKey] === level) {
        btn.classList.add("lever-active");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.setAttribute("aria-pressed", "false");
      }
      btn.addEventListener("click", () => {
        buttons.forEach((b) => {
          b.classList.remove("lever-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("lever-active");
        btn.setAttribute("aria-pressed", "true");
        leverDefaults[leverKey] = level;
        update();
      });
    });
  });

  let chart;

  const update = () => {
    const settings = getSettings();
    const bandId = inferScenarioBand(settings);
    const desc = bandDescription(bandId);
    labelEl.textContent = desc.label;
    detailEl.textContent = desc.detail;

    const bandScenario = scenarios.find((s) => s.id === bandId) || scenarios[2];

    if (!chart) {
      chart = new Chart(chartCanvas, {
        type: "bar",
        data: {
          labels: ["Indicative 2030 margin"],
          datasets: [
            {
              label: "Margin",
              data: [bandScenario.netMargin2030Percent],
              backgroundColor:
                bandScenario.id === "sustainability"
                  ? "#0f766e"
                  : bandScenario.id === "rainy_day"
                  ? "#b91c1c"
                  : "#1d4ed8"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: CHART_ANIM_DURATION },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.parsed.y}% net margin band`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `${value}%`
              }
            }
          }
        }
      });
    } else {
      chart.data.datasets[0].data = [bandScenario.netMargin2030Percent];
      chart.data.datasets[0].backgroundColor =
        bandScenario.id === "sustainability"
          ? "#0f766e"
          : bandScenario.id === "rainy_day"
          ? "#b91c1c"
          : "#1d4ed8";
      chart.update();
    }
  };

  update();
}

// Pennsylvania state boundary (Census GeoJSON coordinates [lng, lat])
const PA_BOUNDARY = [
  [-79.76278, 42.252649], [-79.76278, 42.000709], [-75.35932, 42.000709],
  [-75.249781, 41.863786], [-75.173104, 41.869263], [-75.052611, 41.754247],
  [-75.074519, 41.60637], [-74.89378, 41.436584], [-74.740426, 41.431108],
  [-74.69661, 41.359907], [-74.828057, 41.288707], [-74.882826, 41.179168],
  [-75.134765, 40.971045], [-75.052611, 40.866983], [-75.205966, 40.691721],
  [-75.195012, 40.576705], [-75.069042, 40.543843], [-75.058088, 40.417874],
  [-74.773287, 40.215227], [-74.82258, 40.127596], [-75.129289, 39.963288],
  [-75.145719, 39.88661], [-75.414089, 39.804456], [-75.616736, 39.831841],
  [-75.786521, 39.722302], [-79.477979, 39.722302], [-80.518598, 39.722302],
  [-80.518598, 40.636951], [-80.518598, 41.978802], [-80.332382, 42.033571],
  [-79.76278, 42.269079], [-79.76278, 42.252649]
];

function lonLatToPaMap(lon, lat) {
  const minLon = -80.518598, maxLon = -74.69661, minLat = 39.722302, maxLat = 42.269079;
  const w = 176, h = 100, padX = 12, padY = 10;
  const x = ((lon - minLon) / (maxLon - minLon)) * w + padX;
  const y = ((maxLat - lat) / (maxLat - minLat)) * h + padY;
  return { x, y };
}

function buildPaPathD() {
  const pts = PA_BOUNDARY.map(([lon, lat]) => lonLatToPaMap(lon, lat));
  return "M " + pts.map((p) => p.x.toFixed(2) + " " + p.y.toFixed(2)).join(" L ") + " Z";
}

// Ray-casting: true if (lon, lat) is inside the PA_BOUNDARY polygon
function isInsidePa(lon, lat) {
  const n = PA_BOUNDARY.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [lonI, latI] = PA_BOUNDARY[i];
    const [lonJ, latJ] = PA_BOUNDARY[j];
    if (((latI > lat) !== (latJ > lat)) &&
        (lon < (lonJ - lonI) * (lat - latI) / (latJ - latI) + lonI)) {
      inside = !inside;
    }
  }
  return inside;
}

const DROP_OFFSET = 28;
const DOT_ANIM_DURATION = 500;
const DOT_STAGGER_MS = 70;

function animateDotDrop(circle, finalCy, durationMs) {
  const startCy = parseFloat(circle.getAttribute("cy"));
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / durationMs, 1);
    const eased = 1 - Math.pow(1 - t, 2);
    const cy = startCy + (finalCy - startCy) * eased;
    circle.setAttribute("cy", cy.toFixed(2));
    circle.style.opacity = String(eased);
    if (t < 1) requestAnimationFrame(step);
    else {
      circle.setAttribute("cy", finalCy.toFixed(2));
      circle.style.opacity = "1";
    }
  }
  requestAnimationFrame(step);
}

function initClosuresMap() {
  const pathEl = document.getElementById("pa-outline-path");
  const group = document.getElementById("pa-dots-group");
  if (!pathEl || !group) return;

  pathEl.setAttribute("d", buildPaPathD());

  const totalDots = currentFinancials.closuresSince2016;
  const minLon = -80.45, maxLon = -74.9, minLat = 39.75, maxLat = 42.2;
  let placed = 0;
  let attempts = 0;
  const maxAttempts = totalDots * 80;
  while (placed < totalDots && attempts < maxAttempts) {
    const lon = minLon + Math.random() * (maxLon - minLon);
    const lat = minLat + Math.random() * (maxLat - minLat);
    if (!isInsidePa(lon, lat)) {
      attempts++;
      continue;
    }
    const { x, y } = lonLatToPaMap(lon, lat);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x.toFixed(2));
    circle.setAttribute("cy", (y - DROP_OFFSET).toFixed(2));
    circle.setAttribute("r", "2.5");
    circle.setAttribute("class", "pa-dot");
    circle.setAttribute("data-final-cy", y.toFixed(2));
    circle.style.opacity = "0";
    group.appendChild(circle);
    placed++;
    attempts = 0;
  }
}

function initClosuresScrollAnimations() {
  const mapShell = document.querySelector(".pa-map-shell");
  const closuresCountEl = document.getElementById("closures-count");
  const dotsGroup = document.getElementById("pa-dots-group");
  if (!mapShell || !dotsGroup) return;

  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting || hasAnimated) return;
      hasAnimated = true;

      const dots = dotsGroup.querySelectorAll(".pa-dot");
      dots.forEach((circle, i) => {
        const finalCy = parseFloat(circle.getAttribute("data-final-cy"));
        if (!Number.isFinite(finalCy)) return;
        setTimeout(() => {
          animateDotDrop(circle, finalCy, DOT_ANIM_DURATION);
        }, i * DOT_STAGGER_MS);
      });

      if (closuresCountEl) {
        const target = Number(closuresCountEl.getAttribute("data-count-to")) || 25;
        const durationMs = 1400;
        const start = performance.now();
        function countStep(now) {
          const elapsed = now - start;
          const t = Math.min(elapsed / durationMs, 1);
          const eased = easeOutQuart(t);
          const n = Math.round(target * eased);
          closuresCountEl.textContent = n;
          if (t < 1) requestAnimationFrame(countStep);
          else closuresCountEl.textContent = target;
        }
        requestAnimationFrame(countStep);
      }
    },
    { threshold: 0.2, rootMargin: "0px 0px -30px 0px" }
  );
  observer.observe(mapShell);
}

// Ease-out quart for count-up animation
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function formatImpactValue(value, format) {
  if (format === "minutes") return `+${Math.round(value)} min`;
  if (format === "jobs") return `${Math.round(value).toLocaleString()}+`;
  if (format === "wages") return `$${Math.round(value)}M+`;
  return String(Math.round(value));
}

function animateValue(el, target, format, durationMs) {
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / durationMs, 1);
    const eased = easeOutQuart(t);
    const current = target * eased;
    el.textContent = formatImpactValue(current, format);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = formatImpactValue(target, format);
  }
  requestAnimationFrame(step);
}

function initImpactCountUp() {
  const container = document.getElementById("impact-stats");
  if (!container) return;

  const durationMs = 1800;
  let hasAnimated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting || hasAnimated) return;
      hasAnimated = true;
      const values = container.querySelectorAll(".impact-value[data-count-to]");
      values.forEach((el) => {
        const target = Number(el.getAttribute("data-count-to"));
        const format = el.getAttribute("data-format") || "number";
        if (!Number.isFinite(target)) return;
        el.textContent = formatImpactValue(0, format);
        animateValue(el, target, format, durationMs);
      });
    },
    { threshold: 0.25, rootMargin: "0px 0px -40px 0px" }
  );

  observer.observe(container);
}

function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

