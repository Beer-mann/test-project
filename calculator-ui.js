(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }

  root.CalculatorApp = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const HISTORY_LIMIT = 5;
  const STORAGE_KEYS = {
    history: "northstar-history",
    theme: "northstar-theme"
  };
  const DISPLAY_FORMATTER = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 10
  });
  const KEY_TIMEOUT_MS = 130;
  const THEMES = {
    aurora: "Aurora",
    midnight: "Midnight"
  };

  const createState = () => ({
    current: "0",
    previous: "",
    operator: "",
    overwrite: false,
    expression: "",
    history: [],
    theme: "aurora",
    status: "Tape sync is on."
  });

  const formatValue = (value) => {
    if (value === "Error") {
      return value;
    }

    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "Error";
    }

    return DISPLAY_FORMATTER.format(number);
  };

  const buildExpression = (left, operator, right) =>
    `${formatValue(left)} ${operator} ${formatValue(right)}`;

  const safeParse = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (_error) {
      return fallback;
    }
  };

  const readStorage = (storageRef, key, fallback) => {
    if (!storageRef) {
      return fallback;
    }

    try {
      const value = storageRef.getItem(key);
      return value === null ? fallback : value;
    } catch (_error) {
      return fallback;
    }
  };

  const writeStorage = (storageRef, key, value) => {
    if (!storageRef) {
      return;
    }

    try {
      storageRef.setItem(key, value);
    } catch (_error) {
      // Storage can fail in private mode or limited environments.
    }
  };

  const createCalculatorApp = (documentRef, windowRef) => {
    const currentDisplay = documentRef.getElementById("current");
    const historyDisplay = documentRef.getElementById("history");
    const expressionDisplay = documentRef.getElementById("expression");
    const historyList = documentRef.getElementById("history-list");
    const keys = documentRef.querySelector(".keys");
    const statusDisplay = documentRef.getElementById("status");
    const sessionCount = documentRef.getElementById("session-count");
    const lastResult = documentRef.getElementById("last-result");
    const themeName = documentRef.getElementById("theme-name");
    const themeToggle = documentRef.getElementById("theme-toggle");
    const clearHistoryButton = documentRef.getElementById("clear-history");
    const copyResultButton = documentRef.getElementById("copy-result");
    const buttonPressTimeouts = new Map();
    const storage = windowRef.localStorage;
    const state = createState();

    const setStatus = (message) => {
      state.status = message;
    };

    const persistHistory = () => {
      writeStorage(storage, STORAGE_KEYS.history, JSON.stringify(state.history));
    };

    const persistTheme = () => {
      writeStorage(storage, STORAGE_KEYS.theme, state.theme);
    };

    const applyTheme = () => {
      if (documentRef.body) {
        documentRef.body.dataset.theme = state.theme;
      }
    };

    const updateStats = () => {
      if (sessionCount) {
        const label = state.history.length === 1 ? "saved" : "saved";
        sessionCount.textContent = `${state.history.length} ${label}`;
      }

      if (lastResult) {
        lastResult.textContent = state.history[0] ? formatValue(state.history[0].result) : "--";
      }

      if (themeName) {
        themeName.textContent = THEMES[state.theme] || THEMES.aurora;
      }

      if (themeToggle) {
        const nextTheme = state.theme === "aurora" ? THEMES.midnight : THEMES.aurora;
        themeToggle.textContent = `Switch to ${nextTheme}`;
      }
    };

    const flashKey = (selector) => {
      if (!selector) {
        return;
      }

      const button = keys?.querySelector(selector);
      if (!button) {
        return;
      }

      button.classList.add("is-active");
      if (buttonPressTimeouts.has(button)) {
        windowRef.clearTimeout(buttonPressTimeouts.get(button));
      }

      const timeoutId = windowRef.setTimeout(() => {
        button.classList.remove("is-active");
        buttonPressTimeouts.delete(button);
      }, KEY_TIMEOUT_MS);
      buttonPressTimeouts.set(button, timeoutId);
    };

    const calculate = () => {
      const previous = Number(state.previous);
      const current = Number(state.current);

      if (!state.operator || Number.isNaN(previous) || Number.isNaN(current)) {
        return state.current;
      }

      switch (state.operator) {
        case "+":
          return String(previous + current);
        case "-":
          return String(previous - current);
        case "*":
          return String(previous * current);
        case "/":
          return current === 0 ? "Error" : String(previous / current);
        default:
          return state.current;
      }
    };

    const renderHistoryList = () => {
      if (!historyList) {
        return;
      }

      historyList.textContent = "";

      if (state.history.length === 0) {
        const empty = documentRef.createElement("li");
        empty.className = "empty-history";
        empty.textContent = "No calculations yet.";
        historyList.appendChild(empty);
        return;
      }

      state.history.forEach((entry, index) => {
        const item = documentRef.createElement("li");
        item.className = "history-item";
        item.dataset.historyIndex = String(index);
        item.tabIndex = 0;
        item.setAttribute("role", "button");
        item.setAttribute("aria-label", `Reuse result ${formatValue(entry.result)}`);

        const expression = documentRef.createElement("span");
        expression.className = "history-expression";
        expression.textContent = entry.expression;

        const result = documentRef.createElement("span");
        result.className = "history-result";
        result.textContent = `= ${formatValue(entry.result)}`;

        item.appendChild(expression);
        item.appendChild(result);
        historyList.appendChild(item);
      });
    };

    const render = () => {
      currentDisplay.textContent = state.current === "Error" ? "Error" : formatValue(state.current);
      historyDisplay.textContent = state.previous && state.operator
        ? `${formatValue(state.previous)} ${state.operator}`
        : "";
      expressionDisplay.textContent = state.expression;

      if (statusDisplay) {
        statusDisplay.textContent = state.status;
      }

      applyTheme();
      updateStats();
      renderHistoryList();
    };

    const pushHistory = (expression, result) => {
      state.history.unshift({ expression, result });
      if (state.history.length > HISTORY_LIMIT) {
        state.history = state.history.slice(0, HISTORY_LIMIT);
      }
      persistHistory();
    };

    const inputNumber = (digit) => {
      if (state.current === "Error" || state.overwrite) {
        state.current = digit;
        state.overwrite = false;
        return;
      }

      state.current = state.current === "0" ? digit : state.current + digit;
    };

    const inputDecimal = () => {
      if (state.current === "Error" || state.overwrite) {
        state.current = "0.";
        state.overwrite = false;
        return;
      }

      if (!state.current.includes(".")) {
        state.current += ".";
      }
    };

    const toggleSign = () => {
      if (state.current === "Error") {
        return;
      }

      const number = Number(state.current);
      if (Number.isNaN(number) || number === 0) {
        state.current = "0";
        return;
      }

      state.current = String(number * -1);
      state.overwrite = false;
    };

    const applyPercent = () => {
      if (state.current === "Error") {
        return;
      }

      const number = Number(state.current);
      if (Number.isNaN(number)) {
        return;
      }

      state.current = String(number / 100);
      state.overwrite = false;
    };

    const chooseOperator = (operator) => {
      if (state.current === "Error") {
        return;
      }

      if (state.previous && !state.overwrite) {
        const chainedExpression = buildExpression(state.previous, state.operator, state.current);
        state.current = calculate();
        state.expression = state.current === "Error" ? chainedExpression : `${chainedExpression} =`;

        if (state.current === "Error") {
          state.previous = "";
          state.operator = "";
          setStatus("Cannot divide by zero.");
          return;
        }
      }

      state.previous = state.current;
      state.operator = operator;
      state.overwrite = true;
      setStatus(`Operator ${operator} selected.`);
    };

    const evaluate = () => {
      if (!state.previous || !state.operator || state.current === "Error") {
        return;
      }

      const expression = buildExpression(state.previous, state.operator, state.current);
      state.current = calculate();
      state.expression = `${expression} =`;

      if (state.current !== "Error") {
        pushHistory(expression, state.current);
        setStatus("Calculation saved to tape.");
      } else {
        setStatus("Cannot divide by zero.");
      }

      state.previous = "";
      state.operator = "";
      state.overwrite = true;
    };

    const clearAll = () => {
      state.current = "0";
      state.previous = "";
      state.operator = "";
      state.overwrite = false;
      state.expression = "";
      setStatus("Calculator reset.");
    };

    const clearHistory = () => {
      state.history = [];
      persistHistory();
      setStatus("Tape cleared.");
    };

    const deleteLast = () => {
      if (state.overwrite || state.current === "Error") {
        state.current = "0";
        state.overwrite = false;
        setStatus("Entry cleared.");
        return;
      }

      const nextValue = state.current.length > 1 ? state.current.slice(0, -1) : "0";
      state.current = nextValue === "-" ? "0" : nextValue;
      setStatus("Removed the last digit.");
    };

    const reuseHistory = (index) => {
      const entry = state.history[index];
      if (!entry) {
        return;
      }

      state.current = entry.result;
      state.previous = "";
      state.operator = "";
      state.overwrite = true;
      state.expression = `${entry.expression} =`;
      setStatus("Loaded a saved result.");
    };

    const toggleTheme = () => {
      state.theme = state.theme === "aurora" ? "midnight" : "aurora";
      persistTheme();
      setStatus(`Theme set to ${THEMES[state.theme]}.`);
    };

    const copyResult = async () => {
      const value = currentDisplay.textContent;

      try {
        if (windowRef.navigator?.clipboard?.writeText) {
          await windowRef.navigator.clipboard.writeText(value);
          setStatus("Result copied to clipboard.");
        } else {
          setStatus("Clipboard unavailable in this browser.");
        }
      } catch (_error) {
        setStatus("Clipboard unavailable in this browser.");
      }

      render();
    };

    const handleAction = (action, value) => {
      if (action === "number") {
        inputNumber(value);
      } else if (action === "decimal") {
        inputDecimal();
      } else if (action === "operator") {
        chooseOperator(value);
      } else if (action === "equals") {
        evaluate();
      } else if (action === "clear") {
        clearAll();
      } else if (action === "delete") {
        deleteLast();
      } else if (action === "sign") {
        toggleSign();
      } else if (action === "percent") {
        applyPercent();
        setStatus("Converted to percent.");
      } else {
        return;
      }

      render();
    };

    const loadInitialState = () => {
      const savedHistory = safeParse(readStorage(storage, STORAGE_KEYS.history, "[]"), []);
      if (Array.isArray(savedHistory)) {
        state.history = savedHistory
          .filter((entry) => entry && typeof entry.expression === "string" && typeof entry.result === "string")
          .slice(0, HISTORY_LIMIT);
      }

      const savedTheme = readStorage(storage, STORAGE_KEYS.theme, "aurora");
      state.theme = THEMES[savedTheme] ? savedTheme : "aurora";
    };

    loadInitialState();

    keys.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }

      handleAction(button.dataset.action, button.dataset.value);
    });

    historyList?.addEventListener("click", (event) => {
      const item = event.target.closest("[data-history-index]");
      if (!item) {
        return;
      }

      reuseHistory(Number(item.dataset.historyIndex));
      render();
    });

    historyList?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const item = event.target.closest("[data-history-index]");
      if (!item) {
        return;
      }

      event.preventDefault();
      reuseHistory(Number(item.dataset.historyIndex));
      render();
    });

    themeToggle?.addEventListener("click", () => {
      toggleTheme();
      render();
    });

    clearHistoryButton?.addEventListener("click", () => {
      clearHistory();
      render();
    });

    copyResultButton?.addEventListener("click", () => {
      copyResult();
    });

    windowRef.addEventListener("keydown", (event) => {
      const { key } = event;

      if (/^\d$/.test(key)) {
        flashKey(`[data-action="number"][data-value="${key}"]`);
        handleAction("number", key);
      } else if (key === ".") {
        flashKey('[data-action="decimal"]');
        handleAction("decimal");
      } else if (["+", "-", "*", "/"].includes(key)) {
        flashKey(`[data-action="operator"][data-value="${key}"]`);
        handleAction("operator", key);
      } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        flashKey('[data-action="equals"]');
        handleAction("equals");
      } else if (key === "Backspace") {
        flashKey('[data-action="delete"]');
        handleAction("delete");
      } else if (key === "Escape") {
        flashKey('[data-action="clear"]');
        handleAction("clear");
      } else if (key === "%") {
        flashKey('[data-action="percent"]');
        handleAction("percent");
      }
    });

    render();

    return {
      state,
      render,
      handleAction,
      copyResult,
      toggleTheme,
      clearHistory
    };
  };

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    createCalculatorApp(document, window);
  }

  return {
    createCalculatorApp,
    formatValue
  };
});
