(function () {
  const DATA = window.POKEMON_DATA || [];
  const STAT_KEYS = ["hp", "attack", "defense", "spAttack", "spDefense", "speed"];
  const STAT_LABELS = {
    hp: "HP",
    attack: "物攻",
    defense: "物防",
    spAttack: "特攻",
    spDefense: "特防",
    speed: "速度",
  };
  const FIXED_MAPPING = {
    hp: "chinese",
    attack: "math",
    spAttack: "english",
  };
  const SUBJECTS = {
    chinese: { name: "语文", max: 150, defaultScore: 120 },
    math: { name: "数学", max: 150, defaultScore: 120 },
    english: { name: "外语", max: 150, defaultScore: 120 },
    physics: { name: "物理", max: 100, defaultScore: 80 },
    chemistry: { name: "化学", max: 100, defaultScore: 80 },
    biology: { name: "生物", max: 100, defaultScore: 80 },
    politics: { name: "政治", max: 100, defaultScore: 80 },
    history: { name: "历史", max: 100, defaultScore: 80 },
    geography: { name: "地理", max: 100, defaultScore: 80 },
    technology: { name: "技术", max: 100, defaultScore: 80 },
  };
  const ELECTIVE_IDS = [
    "physics",
    "chemistry",
    "biology",
    "politics",
    "history",
    "geography",
    "technology",
  ];
  const ELECTIVE_STAT_KEYS = ["defense", "spDefense", "speed"];
  const TYPE_COLORS = {
    Normal: "#8b8276",
    Fire: "#d85d2a",
    Water: "#2879b8",
    Electric: "#cc9b10",
    Grass: "#4f8b57",
    Ice: "#4da9b1",
    Fighting: "#a94336",
    Poison: "#8c5aa3",
    Ground: "#aa7a32",
    Flying: "#7387bd",
    Psychic: "#c34c80",
    Bug: "#778e2f",
    Rock: "#8c7a4c",
    Ghost: "#5d5a95",
    Dragon: "#5d65bd",
    Dark: "#574a42",
    Steel: "#6f8990",
    Fairy: "#c76c99",
  };
  const TYPE_ZH = {
    Normal: "一般",
    Fire: "火",
    Water: "水",
    Electric: "电",
    Grass: "草",
    Ice: "冰",
    Fighting: "格斗",
    Poison: "毒",
    Ground: "地面",
    Flying: "飞行",
    Psychic: "超能力",
    Bug: "虫",
    Rock: "岩石",
    Ghost: "幽灵",
    Dragon: "龙",
    Dark: "恶",
    Steel: "钢",
    Fairy: "妖精",
  };

  const electiveChoices = document.querySelector("#electiveChoices");
  const selectionHint = document.querySelector("#selectionHint");
  const mappingGrid = document.querySelector("#mappingGrid");
  const scoreGrid = document.querySelector("#scoreGrid");
  const matchButton = document.querySelector("#matchButton");
  const totalScore = document.querySelector("#totalScore");
  const pokemonName = document.querySelector("#pokemonName");
  const pokemonEnglish = document.querySelector("#pokemonEnglish");
  const typeList = document.querySelector("#typeList");
  const dexId = document.querySelector("#dexId");
  const generation = document.querySelector("#generation");
  const baseTotal = document.querySelector("#baseTotal");
  const dexLink = document.querySelector("#dexLink");
  const pokemonArt = document.querySelector("#pokemonArt");
  const scoreTitle = document.querySelector("#scoreTitle");
  const percentileBadge = document.querySelector("#percentileBadge");
  const statBars = document.querySelector("#statBars");
  const radar = document.querySelector("#radar");
  const ctx = radar.getContext("2d");

  const state = {
    selectedElectives: ["physics", "chemistry", "biology"],
    mapping: {
      hp: "chinese",
      attack: "math",
      defense: "physics",
      spAttack: "english",
      spDefense: "chemistry",
      speed: "biology",
    },
    scores: Object.fromEntries(
      Object.entries(SUBJECTS).map(([id, subject]) => [id, subject.defaultScore]),
    ),
  };

  const distributions = {
    total: DATA.map((pokemon) => pokemon.total).sort((a, b) => a - b),
  };

  STAT_KEYS.forEach((key) => {
    distributions[key] = DATA.map((pokemon) => pokemon.stats[key]).sort((a, b) => a - b);
  });

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function quantile(values, percentile) {
    const p = clamp(percentile, 0, 1);
    const index = p * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return values[lower];
    return lerp(values[lower], values[upper], index - lower);
  }

  function scoreToPercentile(score, maxScore) {
    const normalized = clamp(score / maxScore, 0, 1);
    const raw = 1 / (1 + Math.exp(-8.8 * (normalized - 0.58)));
    const low = 1 / (1 + Math.exp(5.104));
    const high = 1 / (1 + Math.exp(-3.696));
    return clamp((raw - low) / (high - low), 0, 1);
  }

  function getActiveSubjects() {
    return ["chinese", "math", "english", ...state.selectedElectives];
  }

  function getStatSubject(key) {
    return state.mapping[key];
  }

  function getCleanTotalScore() {
    return getActiveSubjects().reduce((sum, subjectId) => {
      const subject = SUBJECTS[subjectId];
      const score = clamp(Number(state.scores[subjectId]) || 0, 0, subject.max);
      return sum + score;
    }, 0);
  }

  function calculateTargetProfile() {
    const rawStats = {};

    STAT_KEYS.forEach((key) => {
      const subjectId = getStatSubject(key);
      const subject = SUBJECTS[subjectId];
      const score = clamp(Number(state.scores[subjectId]) || 0, 0, subject.max);
      const percentile = scoreToPercentile(score, subject.max);
      rawStats[key] = Math.round(quantile(distributions[key], percentile));
    });

    const cleanTotal = getCleanTotalScore();
    const totalPercentile = scoreToPercentile(cleanTotal, 750);
    const targetTotal = Math.round(quantile(distributions.total, totalPercentile));
    const rawTotal = STAT_KEYS.reduce((sum, key) => sum + rawStats[key], 0);
    const scale = rawTotal > 0 ? targetTotal / rawTotal : 1;
    const targetStats = {};

    STAT_KEYS.forEach((key) => {
      targetStats[key] = Math.max(1, Math.round(rawStats[key] * scale));
    });

    return {
      cleanTotal,
      totalPercentile,
      targetStats,
      targetTotal,
    };
  }

  function findMatch() {
    const profile = calculateTargetProfile();
    const { targetStats, targetTotal } = profile;

    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    DATA.forEach((pokemon) => {
      const shapeDistance = STAT_KEYS.reduce((sum, key) => {
        return sum + Math.abs(pokemon.stats[key] - targetStats[key]);
      }, 0);
      const totalDistance = Math.abs(pokemon.total - targetTotal);
      const distance = shapeDistance * 0.95 + totalDistance * 1.25;

      if (distance < bestDistance) {
        best = pokemon;
        bestDistance = distance;
      }
    });

    return {
      pokemon: best,
      targetStats,
      targetTotal,
      totalPercentile: profile.totalPercentile,
      distance: bestDistance,
    };
  }

  function nationalDexSlug(pokemon) {
    const specialCases = {
      29: "nidoran-f",
      32: "nidoran-m",
      83: "farfetchd",
      122: "mr-mime",
      250: "ho-oh",
      439: "mime-jr",
      474: "porygon-z",
      669: "flabebe",
      772: "type-null",
    };

    if (specialCases[pokemon.id]) return specialCases[pokemon.id];

    return pokemon.english
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[':]/g, "")
      .replace(/♀/g, "-f")
      .replace(/♂/g, "-m")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function nationalDexUrl(pokemon) {
    return `https://nationaldex.io/zh-CN/pokemon/${nationalDexSlug(pokemon)}`;
  }

  function officialArtworkUrl(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  function setElectiveSelection(subjectId) {
    const selected = state.selectedElectives;

    if (selected.includes(subjectId)) return;

    if (selected.length < 3) {
      selected.push(subjectId);
    } else {
      selected.shift();
      selected.push(subjectId);
    }

    ELECTIVE_STAT_KEYS.forEach((key, statIndex) => {
      if (!selected.includes(state.mapping[key])) {
        state.mapping[key] = selected[statIndex] || selected[0];
      }
    });

    reconcileElectiveMapping();
    renderAll();
  }

  function reconcileElectiveMapping() {
    const unused = state.selectedElectives.filter((id) => {
      return !ELECTIVE_STAT_KEYS.some((key) => state.mapping[key] === id);
    });

    ELECTIVE_STAT_KEYS.forEach((key) => {
      const subjectId = state.mapping[key];
      const duplicateCount = ELECTIVE_STAT_KEYS.filter((statKey) => {
        return state.mapping[statKey] === subjectId;
      }).length;

      if (!state.selectedElectives.includes(subjectId) || duplicateCount > 1) {
        state.mapping[key] = unused.shift() || state.selectedElectives[0];
      }
    });
  }

  function handleMappingChange(statKey, subjectId) {
    const oldSubject = state.mapping[statKey];
    const duplicateKey = ELECTIVE_STAT_KEYS.find((key) => {
      return key !== statKey && state.mapping[key] === subjectId;
    });

    state.mapping[statKey] = subjectId;
    if (duplicateKey) state.mapping[duplicateKey] = oldSubject;
    reconcileElectiveMapping();
    renderAll();
  }

  function handleScoreInput(subjectId, value) {
    const subject = SUBJECTS[subjectId];
    state.scores[subjectId] = clamp(Number(value) || 0, 0, subject.max);
    renderResult();
  }

  function renderElectiveChoices() {
    electiveChoices.replaceChildren(
      ...ELECTIVE_IDS.map((id) => {
        const button = document.createElement("button");
        const isActive = state.selectedElectives.includes(id);
        button.className = `choice-button${isActive ? " active" : ""}`;
        button.type = "button";
        button.textContent = SUBJECTS[id].name;
        button.addEventListener("click", () => setElectiveSelection(id));
        return button;
      }),
    );

    selectionHint.textContent = `已选择 ${state.selectedElectives.length} / 3`;
  }

  function renderMappingGrid() {
    const cards = STAT_KEYS.map((key) => {
      const card = document.createElement("div");
      const isFixed = Boolean(FIXED_MAPPING[key]);
      card.className = `map-card${isFixed ? " fixed" : ""}`;

      const label = document.createElement("label");
      label.textContent = STAT_LABELS[key];
      card.append(label);

      if (isFixed) {
        const fixed = document.createElement("strong");
        fixed.textContent = SUBJECTS[FIXED_MAPPING[key]].name;
        card.append(fixed);
      } else {
        const select = document.createElement("select");
        state.selectedElectives.forEach((subjectId) => {
          const option = document.createElement("option");
          option.value = subjectId;
          option.textContent = SUBJECTS[subjectId].name;
          select.append(option);
        });
        select.value = state.mapping[key];
        select.addEventListener("change", () => handleMappingChange(key, select.value));
        card.append(select);
      }

      return card;
    });

    mappingGrid.replaceChildren(...cards);
  }

  function renderScoreInputs() {
    scoreGrid.replaceChildren(
      ...getActiveSubjects().map((subjectId) => {
        const subject = SUBJECTS[subjectId];
        const statKey = STAT_KEYS.find((key) => state.mapping[key] === subjectId);
        const card = document.createElement("div");
        card.className = "score-card";

        const label = document.createElement("label");
        label.setAttribute("for", `score-${subjectId}`);
        label.textContent = `${subject.name}成绩`;

        const input = document.createElement("input");
        input.id = `score-${subjectId}`;
        input.type = "number";
        input.min = "0";
        input.max = String(subject.max);
        input.step = "1";
        input.value = state.scores[subjectId];
        input.addEventListener("input", () => handleScoreInput(subjectId, input.value));

        const meta = document.createElement("div");
        meta.className = "score-meta";
        meta.innerHTML = `<span>满分 ${subject.max}</span><span>${STAT_LABELS[statKey]}</span>`;

        card.append(label, input, meta);
        return card;
      }),
    );
  }

  function renderTypes(types) {
    typeList.replaceChildren(
      ...types.map((type) => {
        const pill = document.createElement("span");
        pill.className = "type-pill";
        pill.style.background = TYPE_COLORS[type] || "#6d6860";
        pill.textContent = TYPE_ZH[type] || type;
        return pill;
      }),
    );
  }

  function renderBars(targetStats, pokemonStats) {
    statBars.replaceChildren(
      ...STAT_KEYS.map((key) => {
        const subjectId = state.mapping[key];
        const row = document.createElement("div");
        row.className = "stat-row";

        const label = document.createElement("span");
        label.textContent = `${SUBJECTS[subjectId].name} / ${STAT_LABELS[key]}`;

        const track = document.createElement("div");
        track.className = "bar-track";

        const fill = document.createElement("div");
        fill.className = "bar-fill";
        fill.style.width = `${clamp((targetStats[key] / 180) * 100, 3, 100)}%`;

        const value = document.createElement("span");
        value.textContent = `${targetStats[key]}/${pokemonStats[key]}`;
        value.title = `目标 ${targetStats[key]}，匹配 ${pokemonStats[key]}`;

        track.append(fill);
        row.append(label, track, value);
        return row;
      }),
    );
  }

  function drawRadar(targetStats, pokemonStats) {
    const size = radar.width;
    const center = size / 2;
    const radius = size * 0.35;
    const max = 180;

    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = 1;
    ctx.font = "700 20px Microsoft YaHei, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let ring = 5; ring >= 1; ring -= 1) {
      const points = polygonPoints(radius * (ring / 5));
      ctx.beginPath();
      points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = ring === 5 ? "#c9bda9" : "#e4dac8";
      ctx.stroke();
    }

    STAT_KEYS.forEach((key, index) => {
      const angle = angleFor(index);
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#e1d7c6";
      ctx.stroke();

      const subjectName = SUBJECTS[state.mapping[key]].name;
      const labelX = center + Math.cos(angle) * (radius + 47);
      const labelY = center + Math.sin(angle) * (radius + 47);
      ctx.fillStyle = "#6d6860";
      ctx.fillText(`${subjectName}/${STAT_LABELS[key]}`, labelX, labelY);
    });

    drawShape(targetStats, max, "rgba(22, 127, 131, 0.2)", "#167f83");
    drawShape(pokemonStats, max, "rgba(217, 79, 61, 0.23)", "#d94f3d");

    function polygonPoints(r) {
      return STAT_KEYS.map((_, index) => {
        const angle = angleFor(index);
        return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
      });
    }

    function angleFor(index) {
      return -Math.PI / 2 + (Math.PI * 2 * index) / STAT_KEYS.length;
    }

    function drawShape(stats, shapeMax, fill, stroke) {
      ctx.beginPath();
      STAT_KEYS.forEach((key, index) => {
        const angle = angleFor(index);
        const value = clamp(stats[key] / shapeMax, 0, 1);
        const x = center + Math.cos(angle) * radius * value;
        const y = center + Math.sin(angle) * radius * value;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 4;
      ctx.fill();
      ctx.stroke();
    }
  }

  function renderResult() {
    const cleanTotal = getCleanTotalScore();
    const match = findMatch();
    const pokemon = match.pokemon;
    const courseText = state.selectedElectives.map((id) => SUBJECTS[id].name).join(" / ");

    totalScore.textContent = `${cleanTotal} / 750`;
    pokemonName.textContent = pokemon.name;
    pokemonEnglish.textContent = pokemon.english;
    dexId.textContent = `#${String(pokemon.id).padStart(3, "0")}`;
    generation.textContent = `第 ${pokemon.generation} 世代`;
    baseTotal.textContent = pokemon.total;
    scoreTitle.textContent = `${cleanTotal} 分`;
    percentileBadge.textContent = courseText;
    dexLink.href = nationalDexUrl(pokemon);
    pokemonArt.src = officialArtworkUrl(pokemon.id);
    pokemonArt.alt = pokemon.name;

    renderTypes(pokemon.types);
    renderBars(match.targetStats, pokemon.stats);
    drawRadar(match.targetStats, pokemon.stats);
  }

  function renderAll() {
    renderElectiveChoices();
    renderMappingGrid();
    renderScoreInputs();
    renderResult();
  }

  matchButton.addEventListener("click", renderResult);

  if (DATA.length === 0) {
    pokemonName.textContent = "数据未加载";
    pokemonEnglish.textContent = "请检查 data/pokemon.js";
    return;
  }

  renderAll();
})();
