(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  const themes = {
    wood: {
      topLow: "#c89b6d",
      topHigh: "#a56f45",
      sideLight: "#d7b08b",
      sideDark: "#7a4d30",
      background: "#f6f3ee",
      shadow: "rgba(0, 0, 0, 0.18)",
      panelGlow: "rgba(255, 246, 238, 0.92)",
    },
    monochrome: {
      topLow: "#d5d9e0",
      topHigh: "#99a1b3",
      sideLight: "#eef2f7",
      sideDark: "#5a6476",
      background: "#eef1f6",
      shadow: "rgba(18, 26, 41, 0.18)",
      panelGlow: "rgba(255, 255, 255, 0.9)",
    },
    neon: {
      topLow: "#2ef2c9",
      topHigh: "#13a5ff",
      sideLight: "#87ffe8",
      sideDark: "#0853a2",
      background: "#06111f",
      shadow: "rgba(0, 0, 0, 0.35)",
      panelGlow: "rgba(20, 31, 50, 0.9)",
    },
  };

  const defaultOptions = {
    cellSize: 48,
    gap: 4,
    depthScale: 18,
    projectionX: 0.26,
    projectionY: 0.58,
    radius: 2,
    lightDirection: "top-left",
    theme: "wood",
    palette: themes.wood,
    animation: {
      preset: "stagger-rise",
      duration: 900,
      stagger: 35,
      easing: "easeOutExpo",
    },
  };

  const state = {
    instance: null,
    currentMatrix: [
      [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 2, 2, 2, 3, 3, 2, 2, 2, 1, 1, 1, 0],
      [1, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1, 1],
      [1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1],
      [1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1],
      [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2],
      [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2],
      [2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2],
      [2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2],
      [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2],
      [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2],
      [1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1],
      [1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1],
      [1, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1, 1],
      [0, 1, 1, 1, 2, 2, 2, 3, 3, 2, 2, 2, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0],
    ],
    currentOptions: mergeOptions(defaultOptions, {}),
    lastStatusIsError: false,
  };

  function cloneMatrix(matrix) {
    return matrix.map((row) => row.slice());
  }

  function mergeOptions(base, override) {
    return {
      ...base,
      ...override,
      palette: {
        ...base.palette,
        ...(override.palette || {}),
      },
      animation: {
        ...base.animation,
        ...(override.animation || {}),
      },
    };
  }

  function getContainerElement(container) {
    if (typeof container === "string") {
      return document.querySelector(container);
    }
    if (container instanceof Element) {
      return container;
    }
    return null;
  }

  function normalizeMatrix(matrix) {
    if (!Array.isArray(matrix) || matrix.length === 0) {
      throw new Error("Matrix must be a non-empty 2D array.");
    }

    const width = Array.isArray(matrix[0]) ? matrix[0].length : 0;
    if (!width) {
      throw new Error("Matrix rows must contain at least one value.");
    }

    return matrix.map((row, rowIndex) => {
      if (!Array.isArray(row) || row.length !== width) {
        throw new Error(
          `Matrix must be rectangular. Row ${rowIndex + 1} has an unexpected length.`
        );
      }

      return row.map((value) => {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
          throw new Error("Matrix values must be finite numbers.");
        }

        return Math.max(0, Math.round(numericValue));
      });
    });
  }

  function resolvePalette(options) {
    const themePalette = themes[options.theme] || themes.wood;
    return {
      ...themePalette,
      ...(options.palette || {}),
    };
  }

  function getLightConfig(direction) {
    const isTopLeft = direction !== "top-right";
    return {
      shadowOffsetX: isTopLeft ? 8 : -8,
      shadowOffsetY: 10,
      lightFace: isTopLeft ? "left" : "right",
      darkFace: isTopLeft ? "right" : "left",
      leftFaceColorKey: isTopLeft ? "sideLight" : "sideDark",
      rightFaceColorKey: isTopLeft ? "sideDark" : "sideLight",
    };
  }

  function createSvgElement(tagName, attributes) {
    const element = document.createElementNS(SVG_NS, tagName);
    Object.entries(attributes || {}).forEach(([name, value]) => {
      element.setAttribute(name, String(value));
    });
    return element;
  }

  function createRoundedRectPath(x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    if (!r) {
      return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
    }

    return [
      `M ${x + r} ${y}`,
      `H ${x + width - r}`,
      `Q ${x + width} ${y} ${x + width} ${y + r}`,
      `V ${y + height - r}`,
      `Q ${x + width} ${y + height} ${x + width - r} ${y + height}`,
      `H ${x + r}`,
      `Q ${x} ${y + height} ${x} ${y + height - r}`,
      `V ${y + r}`,
      `Q ${x} ${y} ${x + r} ${y}`,
      "Z",
    ].join(" ");
  }

  function createRectPoints(x, y, width, height) {
    return {
      topLeft: [x, y],
      topRight: [x + width, y],
      bottomRight: [x + width, y + height],
      bottomLeft: [x, y + height],
    };
  }

  function pointsToString(points) {
    return points.map((point) => point.join(",")).join(" ");
  }

  function hexToRgb(color) {
    const normalized = color.replace("#", "");
    if (normalized.length !== 6) {
      return null;
    }

    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  function interpolateHexColor(startColor, endColor, ratio) {
    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);
    if (!start || !end) {
      return endColor || startColor;
    }

    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const toHex = (value) => Math.round(value).toString(16).padStart(2, "0");
    const r = start.r + (end.r - start.r) * clampedRatio;
    const g = start.g + (end.g - start.g) * clampedRatio;
    const b = start.b + (end.b - start.b) * clampedRatio;

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function getHeightRatio(height, settings) {
    const span = settings.maxHeight - settings.minHeight;
    if (span <= 0) {
      return 1;
    }

    return (height - settings.minHeight) / span;
  }

  function getTopFill(height, settings) {
    return interpolateHexColor(
      settings.palette.topLow,
      settings.palette.topHigh,
      getHeightRatio(height, settings)
    );
  }

  function buildBlockGeometry(col, row, heightValue, settings) {
    const colStep = settings.cellSize + settings.gap;
    const baseX = settings.padding + settings.maxLiftX + col * colStep;
    const rowTop = settings.padding + row * settings.rowStride;
    const depth = heightValue * settings.depthScale;
    const liftX = depth * settings.projectionX;
    const liftY = depth * settings.projectionY;
    const baseY = rowTop + settings.maxLiftY;
    const topX = baseX - liftX;
    const topY = baseY - liftY;
    const topRect = createRectPoints(topX, topY, settings.cellSize, settings.cellSize);
    const baseRect = createRectPoints(baseX, baseY, settings.cellSize, settings.cellSize);

    return {
      x: topX,
      y: topY,
      rowTop,
      baseY,
      topX,
      topY,
      depth,
      liftX,
      liftY,
      topRect,
      baseRect,
    };
  }

  function createFacePolygon(facePoints, fill, opacity) {
    const polygon = createSvgElement("polygon", {
      points: pointsToString(facePoints),
      fill,
    });
    if (typeof opacity === "number") {
      polygon.setAttribute("fill-opacity", opacity.toFixed(3));
    }
    return polygon;
  }

  function createShadowPath(geometry, lightConfig, palette, radius) {
    const blurDrift = Math.max(8, geometry.liftY * 0.5 + geometry.liftX * 0.35);
    const offsetX = lightConfig.shadowOffsetX;
    const offsetY = lightConfig.shadowOffsetY;
    const x =
      geometry.baseRect.topLeft[0] + Math.min(0, offsetX) - blurDrift * 0.25;
    const y = geometry.baseRect.topLeft[1] + offsetY * 0.35;
    const width =
      geometry.baseRect.topRight[0] -
      geometry.baseRect.topLeft[0] +
      Math.abs(offsetX) +
      blurDrift;
    const height =
      geometry.baseRect.bottomLeft[1] -
      geometry.baseRect.topLeft[1] +
      geometry.liftY * 0.2 +
      blurDrift * 0.35;
    const path = createSvgElement("path", {
      d: createRoundedRectPath(x, y, width, height, radius + 3),
      fill: palette.shadow,
      "fill-opacity": "0.28",
      filter: "url(#block-shadow-blur)",
    });
    return path;
  }

  function createBlockGroup(block, settings) {
    const geometry = buildBlockGeometry(block.col, block.row, block.height, settings);
    const group = createSvgElement("g", {
      class: "block",
      "data-row": block.row,
      "data-col": block.col,
      "data-height": block.height,
      transform: `translate(0 ${settings.entryOffset})`,
      opacity: "0",
    });

    group.dataset.baseTranslateY = "0";
    group.dataset.pulseDepth = geometry.depth.toFixed(2);

    const hasDepth = geometry.depth > 0;

    const leftFacePoints = [
      geometry.topRect.topLeft,
      geometry.topRect.bottomLeft,
      geometry.baseRect.bottomLeft,
      geometry.baseRect.topLeft,
    ];
    const rightFacePoints = [
      geometry.topRect.topRight,
      geometry.topRect.bottomRight,
      geometry.baseRect.bottomRight,
      geometry.baseRect.topRight,
    ];
    const frontFacePoints = [
      geometry.topRect.bottomLeft,
      geometry.topRect.bottomRight,
      geometry.baseRect.bottomRight,
      geometry.baseRect.bottomLeft,
    ];

    const topPath = createSvgElement("path", {
      d: createRoundedRectPath(
        geometry.topX,
        geometry.topY,
        settings.cellSize,
        settings.cellSize,
        settings.radius
      ),
      fill: getTopFill(block.height, settings),
      stroke: "rgba(255,255,255,0.14)",
      "stroke-width": "1",
    });

    if (hasDepth) {
      const shadow = createShadowPath(
        geometry,
        settings.lightConfig,
        settings.palette,
        settings.radius
      );
      const leftFace = createFacePolygon(
        leftFacePoints,
        settings.palette[settings.lightConfig.leftFaceColorKey]
      );
      const rightFace = createFacePolygon(
        rightFacePoints,
        settings.palette[settings.lightConfig.rightFaceColorKey]
      );
      const frontFace = createFacePolygon(
        frontFacePoints,
        settings.palette.sideDark,
        0.12 + getHeightRatio(block.height, settings) * 0.18
      );
      group.append(shadow, leftFace, rightFace, frontFace);
    }

    group.append(topPath);
    return group;
  }

  function createDefs(svg, palette) {
    const defs = createSvgElement("defs");

    const shadowFilter = createSvgElement("filter", {
      id: "block-shadow-blur",
      x: "-20%",
      y: "-20%",
      width: "160%",
      height: "180%",
    });
    shadowFilter.append(
      createSvgElement("feGaussianBlur", {
        in: "SourceGraphic",
        stdDeviation: "8",
      })
    );

    const panelGradient = createSvgElement("linearGradient", {
      id: "panel-gradient",
      x1: "0%",
      x2: "100%",
      y1: "0%",
      y2: "100%",
    });
    panelGradient.append(
      createSvgElement("stop", {
        offset: "0%",
        "stop-color": palette.panelGlow,
      }),
      createSvgElement("stop", {
        offset: "100%",
        "stop-color": palette.background,
      })
    );

    defs.append(panelGradient, shadowFilter);
    svg.append(defs);
  }

  function calculateLayout(matrix, options) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const flatMatrix = matrix.flat();
    const maxHeight = Math.max(...flatMatrix);
    const minHeight = Math.min(...flatMatrix);
    const padding = Math.max(28, options.cellSize * 0.6);
    const maxDepth = maxHeight * options.depthScale;
    const maxLiftX = maxDepth * options.projectionX;
    const maxLiftY = maxDepth * options.projectionY;
    const rowStride = options.cellSize + options.gap;
    const width =
      padding * 2 +
      cols * options.cellSize +
      (cols - 1) * options.gap +
      maxLiftX;
    const height =
      padding * 2 +
      (rows - 1) * rowStride +
      options.cellSize +
      maxLiftY;

    return {
      rows,
      cols,
      padding,
      width,
      height,
      maxHeight,
      minHeight,
      maxDepth,
      maxLiftX,
      maxLiftY,
      rowStride,
    };
  }

  function clearContainer(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  function createEmptyState(container, message) {
    clearContainer(container);
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = message;
    container.appendChild(empty);
  }

  function animateBlocks(blocks, animationOptions) {
    if (!window.anime || !blocks.length) {
      return null;
    }

    anime.remove(blocks);
    const preset = animationOptions.preset || "stagger-rise";
    const common = {
      targets: blocks,
      duration: animationOptions.duration,
      easing: animationOptions.easing,
      delay: anime.stagger(animationOptions.stagger),
    };

    if (preset === "wave") {
      return anime({
        ...common,
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.92, 1],
        delay: anime.stagger(animationOptions.stagger, {
          grid: [Number(blocks[0].dataset.cols || 1), Number(blocks[0].dataset.rows || 1)],
          from: "center",
        }),
      });
    }

    if (preset === "pulse-depth") {
      return anime
        .timeline({
          easing: animationOptions.easing,
        })
        .add({
          ...common,
          opacity: [0, 1],
          translateY: [24, 0],
        })
        .add(
          {
            targets: blocks,
            scaleY: [
              { value: 1.04, duration: animationOptions.duration * 0.28 },
              { value: 1, duration: animationOptions.duration * 0.4 },
            ],
            transformOrigin: "50% 100%",
            delay: anime.stagger(Math.max(20, animationOptions.stagger * 0.6)),
          },
          "-=420"
        );
    }

    return anime({
      ...common,
      opacity: [0, 1],
      translateY: [34, 0],
      scale: [0.94, 1],
    });
  }

  function createRendererInstance(container, matrix, options) {
    const normalizedMatrix = normalizeMatrix(matrix);
    const mergedOptions = mergeOptions(defaultOptions, options || {});
    const palette = resolvePalette(mergedOptions);
    const layout = calculateLayout(normalizedMatrix, mergedOptions);
    const lightConfig = getLightConfig(mergedOptions.lightDirection);
    const settings = {
      ...layout,
      ...mergedOptions,
      palette,
      lightConfig,
      entryOffset: Math.max(20, mergedOptions.depthScale * 1.3),
    };

    clearContainer(container);

    const svg = createSvgElement("svg", {
      viewBox: `0 0 ${layout.width} ${layout.height}`,
      role: "img",
      "aria-label": `Block wall pattern with ${layout.rows} rows and ${layout.cols} columns`,
      preserveAspectRatio: "xMidYMid meet",
    });
    createDefs(svg, palette);

    const stageBackground = createSvgElement("rect", {
      x: "0",
      y: "0",
      width: layout.width,
      height: layout.height,
      rx: Math.max(20, mergedOptions.radius * 4 + 12),
      fill: "url(#panel-gradient)",
    });
    svg.append(stageBackground);

    const frame = createSvgElement("rect", {
      x: 1.5,
      y: 1.5,
      width: layout.width - 3,
      height: layout.height - 3,
      rx: Math.max(20, mergedOptions.radius * 4 + 12),
      fill: "none",
      stroke: "rgba(255,255,255,0.28)",
      "stroke-width": "3",
    });
    svg.append(frame);

    const blocksLayer = createSvgElement("g", { class: "blocks-layer" });
    const blocks = [];
    const blockEntries = [];
    normalizedMatrix.forEach((row, rowIndex) => {
      row.forEach((heightValue, colIndex) => {
        blockEntries.push({
          row: rowIndex,
          col: colIndex,
          height: heightValue,
        });
      });
    });

    blockEntries
      .sort((a, b) => {
        if (a.row !== b.row) {
          return a.row - b.row;
        }
        if (a.height !== b.height) {
          return a.height - b.height;
        }
        return a.col - b.col;
      })
      .forEach((entry) => {
        const block = createBlockGroup(entry, settings);
        block.dataset.rows = String(layout.rows);
        block.dataset.cols = String(layout.cols);
        blocks.push(block);
        blocksLayer.appendChild(block);
      });
    svg.append(blocksLayer);

    container.style.background = palette.background;
    container.appendChild(svg);

    return {
      container,
      svg,
      blocks,
      matrix: normalizedMatrix,
      options: mergedOptions,
      replayAnimation() {
        this.animation = animateBlocks(this.blocks, this.options.animation);
      },
      destroy() {
        if (this.animation) {
          this.animation.pause();
        }
        clearContainer(container);
      },
    };
  }

  function renderBlockPattern(container, matrix, options) {
    const element = getContainerElement(container);
    if (!element) {
      throw new Error("Renderer container was not found.");
    }

    if (element.__blockPatternInstance) {
      element.__blockPatternInstance.destroy();
    }

    const instance = createRendererInstance(element, matrix, options);
    element.__blockPatternInstance = instance;
    instance.replayAnimation();
    return instance;
  }

  function parsePlainTextMatrix(input) {
    const rows = input
      .trim()
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/[\s,]+/).filter(Boolean).map(Number));

    if (!rows.length) {
      throw new Error("Matrix must be a non-empty 2D array.");
    }

    return normalizeMatrix(rows);
  }

  function parseMatrixInput(input) {
    try {
      return parsePlainTextMatrix(input);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Matrix")) {
        throw error;
      }

      throw new Error("Matrix input must be rows of numbers separated by spaces.");
    }
  }

  function formatMatrix(matrix) {
    return matrix.map((row) => row.join(" ")).join("\n");
  }

  function generateRandomMatrix(rows, cols, minHeight, maxHeight) {
    const lower = Math.min(minHeight, maxHeight);
    const upper = Math.max(minHeight, maxHeight);
    return Array.from({ length: rows }, () =>
      Array.from(
        { length: cols },
        () => Math.floor(Math.random() * (upper - lower + 1)) + lower
      )
    );
  }

  function setStatus(message, isError) {
    const statusElement = document.getElementById("statusMessage");
    statusElement.textContent = message || "";
    statusElement.classList.toggle("is-error", Boolean(isError));
    state.lastStatusIsError = Boolean(isError);
  }

  function updateRangeOutputs() {
    ["cellSize", "gap", "depthScale", "radius"].forEach((id) => {
      const input = document.getElementById(id);
      const output = document.getElementById(`${id}Value`);
      output.value = input.value;
      output.textContent = input.value;
    });
  }

  function buildOptionsFromControls() {
    const theme = document.getElementById("theme").value;
    return mergeOptions(defaultOptions, {
      cellSize: Number(document.getElementById("cellSize").value),
      gap: Number(document.getElementById("gap").value),
      depthScale: Number(document.getElementById("depthScale").value),
      radius: Number(document.getElementById("radius").value),
      theme,
      palette: themes[theme],
      animation: {
        preset: document.getElementById("animationPreset").value,
      },
    });
  }

  function syncControlsToState() {
    document.getElementById("matrixInput").value = formatMatrix(state.currentMatrix);
    document.getElementById("cellSize").value = String(state.currentOptions.cellSize);
    document.getElementById("gap").value = String(state.currentOptions.gap);
    document.getElementById("depthScale").value = String(state.currentOptions.depthScale);
    document.getElementById("radius").value = String(state.currentOptions.radius);
    document.getElementById("theme").value = state.currentOptions.theme;
    document.getElementById("animationPreset").value =
      state.currentOptions.animation.preset;
    updateRangeOutputs();
  }

  function applyRender() {
    const matrixInput = document.getElementById("matrixInput").value;

    try {
      const matrix = parseMatrixInput(matrixInput);
      const options = buildOptionsFromControls();
      state.currentMatrix = matrix;
      state.currentOptions = options;
      state.instance = renderBlockPattern("#app", matrix, options);
      setStatus(
        `Rendered ${matrix.length}x${matrix[0].length} matrix using the ${options.theme} theme.`,
        false
      );
    } catch (error) {
      createEmptyState(
        document.getElementById("app"),
        error.message || "Unable to render the matrix."
      );
      setStatus(error.message || "Unable to render the matrix.", true);
    }
  }

  function populateSelect(selectId, values) {
    const select = document.getElementById(selectId);
    Object.keys(values).forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      select.appendChild(option);
    });
  }

  function populateAnimationSelect() {
    const select = document.getElementById("animationPreset");
    ["stagger-rise", "wave", "pulse-depth"].forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset;
      option.textContent = preset;
      select.appendChild(option);
    });
  }

  function setupControlEvents() {
    ["cellSize", "gap", "depthScale", "radius"].forEach((id) => {
      document.getElementById(id).addEventListener("input", updateRangeOutputs);
    });

    document.getElementById("renderButton").addEventListener("click", applyRender);
    document.getElementById("replayButton").addEventListener("click", () => {
      if (!state.instance) {
        applyRender();
        return;
      }

      state.instance.replayAnimation();
      setStatus("Animation replayed.", false);
    });
    document.getElementById("randomizeButton").addEventListener("click", () => {
      try {
        const currentMatrix = parseMatrixInput(
          document.getElementById("matrixInput").value
        );
        const randomMatrix = generateRandomMatrix(
          currentMatrix.length,
          currentMatrix[0].length,
          0,
          3
        );
        document.getElementById("matrixInput").value = formatMatrix(randomMatrix);
        applyRender();
        setStatus("Randomized the current grid with height values from 0 to 3.", false);
      } catch (error) {
        setStatus(
          error.message || "Fix the matrix input before randomizing.",
          true
        );
      }
    });
  }

  function initializeDemo() {
    populateSelect("theme", themes);
    populateAnimationSelect();

    state.currentOptions = mergeOptions(defaultOptions, {
      theme: "wood",
      palette: themes.wood,
      animation: { preset: "stagger-rise" },
    });
    syncControlsToState();
    setupControlEvents();
    applyRender();
  }

  window.renderBlockPattern = renderBlockPattern;
  document.addEventListener("DOMContentLoaded", initializeDemo);
})();
