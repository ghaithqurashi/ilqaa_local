export interface PresentationSlideData {
  id: number;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  category: string;
  speakerNotes: string;
  kpis?: { label: string; val: string; sub: string }[];
  storyData?: {
    character: string;
    conflict: string;
    rootCauses: { title: string; desc: string }[];
  };
  mathComparison?: {
    traditional: {
      title: string;
      timePerStudent: string;
      coverage: string;
      feedback: string;
      data: string;
    };
    ilqaaSolution: {
      title: string;
      timePerStudent: string;
      coverage: string;
      feedback: string;
      data: string;
    };
  };
  pillars?: {
    num: string;
    name: string;
    tabKey: string;
    tag: string;
    desc: string;
  }[];
  uiFeatureHighlights?: {
    title: string;
    desc: string;
  }[];
  navTarget?: string;
  timelineSteps?: {
    weeks: string;
    phase: string;
    desc: string;
  }[];
  impactGrid?: {
    metric: string;
    title: string;
    desc: string;
  }[];
  askCards?: {
    step: string;
    title: string;
    desc: string;
  }[];
  highlights: { label: string; desc: string }[];
}

export function generatePresentationHtml(slides: PresentationSlideData[], isRtl: boolean = true): string {
  const slidesHtml = slides.map((s, idx) => {
    let customSectionHtml = "";

    if (s.category === "overview" && s.kpis) {
      customSectionHtml = `
        <div class="grid grid-3">
          ${s.kpis.map(k => `
            <div class="card kpi-card">
              <div class="kpi-label">${k.label}</div>
              <div class="kpi-val">${k.val}</div>
              <div class="kpi-sub">${k.sub}</div>
            </div>
          `).join("")}
        </div>
      `;
    } else if (s.category === "problem" && s.storyData) {
      customSectionHtml = `
        <div class="card story-box">
          <div class="story-header">⚠️ شخصية القصة والتحدي: <strong>${s.storyData.character}</strong></div>
          <div class="story-quote">"${s.storyData.conflict}"</div>
          <div class="grid grid-3" style="margin-top: 15px;">
            ${s.storyData.rootCauses.map(rc => `
              <div class="sub-card">
                <div class="sub-title">🔥 ${rc.title}</div>
                <div class="sub-desc">${rc.desc}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    } else if (s.category === "bottleneck" && s.mathComparison) {
      customSectionHtml = `
        <div class="grid grid-2">
          <div class="card traditional-card">
            <div class="card-header red-header">⏱️ ${s.mathComparison.traditional.title}</div>
            <div class="metric-row"><span class="m-label">وقت التدريب لكل طالب:</span> <span class="m-val red-text">${s.mathComparison.traditional.timePerStudent}</span></div>
            <div class="metric-row"><span class="m-label">نسبة مشاركة الفصل:</span> <span class="m-val red-text">${s.mathComparison.traditional.coverage}</span></div>
            <div class="metric-row"><span class="m-label">التغذية الراجعة:</span> <span class="m-val red-text">${s.mathComparison.traditional.feedback}</span></div>
            <div class="metric-row"><span class="m-label">توثيق البيانات:</span> <span class="m-val red-text">${s.mathComparison.traditional.data}</span></div>
          </div>
          <div class="card solution-card">
            <div class="card-header green-header">🚀 ${s.mathComparison.ilqaaSolution.title}</div>
            <div class="metric-row"><span class="m-label">وقت التدريب لكل طالب:</span> <span class="m-val green-text">${s.mathComparison.ilqaaSolution.timePerStudent}</span></div>
            <div class="metric-row"><span class="m-label">نسبة مشاركة الفصل:</span> <span class="m-val green-text">${s.mathComparison.ilqaaSolution.coverage}</span></div>
            <div class="metric-row"><span class="m-label">التغذية الراجعة:</span> <span class="m-val green-text">${s.mathComparison.ilqaaSolution.feedback}</span></div>
            <div class="metric-row"><span class="m-label">توثيق البيانات:</span> <span class="m-val green-text">${s.mathComparison.ilqaaSolution.data}</span></div>
          </div>
        </div>
      `;
    } else if (s.category === "solution" && s.pillars) {
      customSectionHtml = `
        <div class="grid grid-3">
          ${s.pillars.map(p => `
            <div class="card pillar-card">
              <div class="pillar-num">${p.num}</div>
              <div class="pillar-title">${p.name}</div>
              <div class="pillar-tag">${p.tag}</div>
              <div class="pillar-desc">${p.desc}</div>
            </div>
          `).join("")}
        </div>
      `;
    } else if (s.uiFeatureHighlights) {
      customSectionHtml = `
        <div class="grid grid-2">
          ${s.uiFeatureHighlights.map(f => `
            <div class="card feature-card">
              <div class="feature-title">✨ ${f.title}</div>
              <div class="feature-desc">${f.desc}</div>
            </div>
          `).join("")}
        </div>
      `;
    } else if (s.category === "roadmap" && s.timelineSteps) {
      customSectionHtml = `
        <div class="grid grid-3">
          ${s.timelineSteps.map(t => `
            <div class="card timeline-card">
              <div class="timeline-badge">${t.weeks}</div>
              <div class="timeline-phase">${t.phase}</div>
              <div class="timeline-desc">${t.desc}</div>
            </div>
          `).join("")}
        </div>
      `;
    } else if (s.category === "impact" && s.impactGrid) {
      customSectionHtml = `
        <div class="grid grid-2">
          ${s.impactGrid.map(im => `
            <div class="card impact-card">
              <div class="impact-metric">${im.metric}</div>
              <div class="impact-title">${im.title}</div>
              <div class="impact-desc">${im.desc}</div>
            </div>
          `).join("")}
        </div>
      `;
    } else if (s.category === "the_ask" && s.askCards) {
      customSectionHtml = `
        <div class="grid grid-3">
          ${s.askCards.map(ask => `
            <div class="card ask-card">
              <div class="ask-num">${ask.step}</div>
              <div class="ask-title">${ask.title}</div>
              <div class="ask-desc">${ask.desc}</div>
            </div>
          `).join("")}
        </div>
      `;
    }

    const highlightsHtml = `
      <div class="highlights-grid">
        ${s.highlights.map(h => `
          <div class="hl-item">
            <div class="hl-title">✅ ${h.label}</div>
            <div class="hl-desc">${h.desc}</div>
          </div>
        `).join("")}
      </div>
    `;

    return `
      <section class="slide" id="slide-${idx + 1}">
        <div class="slide-inner">
          <div class="slide-header">
            <div class="badge">${s.badge}</div>
            <div class="slide-count">شريحة ${idx + 1} من ${slides.length}</div>
          </div>

          <h1 class="slide-title">${s.title}</h1>
          <p class="slide-subtitle">${s.subtitle}</p>

          <div class="slide-body">
            ${customSectionHtml}
            ${highlightsHtml}
          </div>

          <div class="speaker-notes">
            <div class="notes-header">🎙️ ملاحظات المتحدث وسيناريو الإلقاء أمام اللجنة (Speaker Script):</div>
            <div class="notes-text">"${s.speakerNotes}"</div>
          </div>

          <div class="slide-footer">
            <span>منظومة «إلقاء» للذكاء الاصطناعي الصوتي والخطابي 🇶🇦</span>
            <span>ملف العرض الاستثماري — وزارة التربية والتعليم والتعليم العالي</span>
          </div>
        </div>
      </section>
    `;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="${isRtl ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ملف عرض وزارة التربية والتعليم والتعليم العالي — منصة إلقاء 🇶🇦</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --maroon: #8A1538;
      --maroon-dark: #46081B;
      --maroon-deep: #1A030A;
      --gold: #D4AF37;
      --gold-light: #FDE68A;
      --bg-dark: #0D0206;
      --card-bg: rgba(26, 7, 14, 0.85);
      --border-color: rgba(212, 175, 55, 0.35);
      --text-main: #FFFFFF;
      --text-sub: #E2E8F0;
      --text-muted: #94A3B8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Cairo', 'Tajawal', -apple-system, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      line-height: 1.6;
      direction: ${isRtl ? "rtl" : "ltr"};
    }

    /* Print and Page Control */
    @page {
      size: A4 landscape;
      margin: 8mm;
    }

    .slide {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 30px;
      page-break-after: always;
      background: radial-gradient(circle at 10% 20%, #2A0512 0%, #0D0206 80%);
      border-bottom: 2px solid var(--maroon);
    }

    @media print {
      body {
        background: #0D0206;
      }
      .slide {
        min-height: 100vh;
        height: 100vh;
        padding: 20px;
        page-break-after: always;
        page-break-inside: avoid;
        border: none;
      }
      .no-print {
        display: none !important;
      }
    }

    .slide-inner {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      background: var(--card-bg);
      border: 1.5px solid var(--border-color);
      border-radius: 24px;
      padding: 35px 40px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
      position: relative;
    }

    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .badge {
      background: linear-gradient(135deg, rgba(138, 21, 56, 0.4), rgba(212, 175, 55, 0.2));
      border: 1px solid var(--gold);
      color: var(--gold-light);
      padding: 6px 16px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .slide-count {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
      font-family: monospace;
    }

    .slide-title {
      font-size: 28px;
      font-weight: 900;
      color: #FFFFFF;
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .slide-subtitle {
      font-size: 15px;
      color: var(--text-sub);
      margin-bottom: 24px;
      line-height: 1.5;
      max-width: 95%;
    }

    /* Grids */
    .grid {
      display: grid;
      gap: 15px;
      margin-bottom: 20px;
    }

    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }

    .card {
      background: rgba(18, 4, 9, 0.9);
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 16px;
      padding: 16px 18px;
    }

    /* KPI Card */
    .kpi-card {
      text-align: center;
      background: linear-gradient(135deg, rgba(42, 5, 18, 0.8), rgba(13, 2, 6, 0.9));
      border: 1px solid rgba(212, 175, 55, 0.4);
    }
    .kpi-label { font-size: 13px; color: var(--gold-light); font-weight: 700; }
    .kpi-val { font-size: 32px; font-weight: 900; color: #FFFFFF; margin: 4px 0; font-family: monospace; }
    .kpi-sub { font-size: 11px; color: var(--text-muted); }

    /* Story Box */
    .story-box {
      background: rgba(45, 10, 20, 0.5);
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .story-header { font-size: 14px; color: #FCA5A5; margin-bottom: 8px; }
    .story-quote {
      background: rgba(0,0,0,0.5);
      border-right: 4px solid #EF4444;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      line-height: 1.6;
      color: #FEE2E2;
      font-style: italic;
    }
    .sub-card {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      padding: 12px;
    }
    .sub-title { font-size: 13px; font-weight: 700; color: #FDE047; margin-bottom: 4px; }
    .sub-desc { font-size: 12px; color: #CBD5E1; line-height: 1.4; }

    /* Comparison Cards */
    .traditional-card { border-color: rgba(239, 68, 68, 0.35); }
    .solution-card { border-color: rgba(34, 197, 94, 0.35); }
    .card-header { font-size: 14px; font-weight: 800; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .red-header { color: #F87171; }
    .green-header { color: #4ADE80; }
    .metric-row { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .m-label { color: var(--text-muted); }
    .m-val { font-weight: 700; }
    .red-text { color: #FCA5A5; }
    .green-text { color: #86EFAC; }

    /* Pillars */
    .pillar-card { position: relative; }
    .pillar-num { font-size: 24px; font-weight: 900; color: var(--gold); font-family: monospace; }
    .pillar-title { font-size: 15px; font-weight: 800; color: #FFFFFF; margin: 4px 0; }
    .pillar-tag { font-size: 10px; color: var(--gold-light); text-transform: uppercase; font-family: monospace; margin-bottom: 6px; }
    .pillar-desc { font-size: 12px; color: var(--text-sub); line-height: 1.5; }

    /* Features */
    .feature-card { background: rgba(15, 23, 42, 0.6); }
    .feature-title { font-size: 13px; font-weight: 800; color: #38BDF8; margin-bottom: 4px; }
    .feature-desc { font-size: 12px; color: #CBD5E1; line-height: 1.4; }

    /* Timeline & Roadmap */
    .timeline-card { border-color: rgba(99, 102, 241, 0.4); }
    .timeline-badge { display: inline-block; background: rgba(99, 102, 241, 0.2); border: 1px solid #818CF8; color: #C7D2FE; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 20px; margin-bottom: 6px; }
    .timeline-phase { font-size: 14px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px; }
    .timeline-desc { font-size: 12px; color: var(--text-sub); line-height: 1.4; }

    /* Impact Grid */
    .impact-card { border-color: rgba(45, 212, 191, 0.35); }
    .impact-metric { font-size: 26px; font-weight: 900; color: #2DD4BF; font-family: monospace; }
    .impact-title { font-size: 13px; font-weight: 700; color: #FFFFFF; margin: 2px 0 4px 0; }
    .impact-desc { font-size: 12px; color: #94A3B8; line-height: 1.4; }

    /* Ask Cards */
    .ask-card { border-color: var(--gold); background: linear-gradient(135deg, rgba(70, 8, 27, 0.6), rgba(18, 4, 9, 0.8)); }
    .ask-num { width: 30px; height: 30px; border-radius: 8px; background: rgba(212, 175, 55, 0.2); color: var(--gold-light); display: flex; align-items: center; justify-content: center; font-weight: 900; font-family: monospace; margin-bottom: 8px; }
    .ask-title { font-size: 14px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px; }
    .ask-desc { font-size: 12px; color: var(--text-sub); line-height: 1.4; }

    /* Highlights Section */
    .highlights-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .hl-item {
      background: rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .hl-title { font-size: 12px; font-weight: 700; color: #67E8F9; margin-bottom: 2px; }
    .hl-desc { font-size: 11px; color: var(--text-muted); line-height: 1.3; }

    /* Speaker Notes */
    .speaker-notes {
      margin-top: 18px;
      background: rgba(88, 28, 135, 0.2);
      border: 1px solid rgba(168, 85, 247, 0.35);
      border-radius: 14px;
      padding: 12px 16px;
    }
    .notes-header {
      font-size: 12px;
      font-weight: 800;
      color: #E9D5FF;
      margin-bottom: 6px;
    }
    .notes-text {
      font-size: 12px;
      color: #F1F5F9;
      line-height: 1.6;
      font-style: italic;
      background: rgba(0,0,0,0.3);
      padding: 8px 12px;
      border-radius: 8px;
    }

    /* Footer */
    .slide-footer {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px solid rgba(212, 175, 55, 0.2);
      font-weight: 600;
    }

    /* Floating Action Bar for Web Browsing */
    .floating-bar {
      position: fixed;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(18, 4, 9, 0.95);
      border: 1.5px solid var(--gold);
      border-radius: 50px;
      padding: 10px 24px;
      display: flex;
      gap: 15px;
      align-items: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      z-index: 1000;
    }
    .btn {
      background: var(--maroon);
      color: #FFF;
      border: 1px solid var(--gold);
      padding: 8px 18px;
      border-radius: 30px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn:hover {
      background: #A31C44;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.2);
    }
    .btn-secondary:hover {
      background: rgba(255,255,255,0.2);
    }
  </style>
</head>
<body>

  <!-- Floating Navigation Bar for Web Mode -->
  <div class="floating-bar no-print">
    <button onclick="window.print()" class="btn">
      🖨️ طباعة / حفظ كملف PDF للابتوب
    </button>
    <a href="#slide-1" class="btn btn-secondary">
      ⏮️ البداية
    </a>
    <span style="font-size: 12px; color: var(--gold-light); font-weight: 700;">
      عرض وزارة التربية والتعليم (10 شرائح) 🇶🇦
    </span>
  </div>

  ${slidesHtml}

</body>
</html>`;
}
