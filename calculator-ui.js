(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }

  root.CalculatorApp = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const createState = () => ({
    current: "0",
    previous: "",
    operator: "",
    overwrite: false
  });

  const formatValue = (value) => {
    if (value === "Error") {
      return value;
    }

    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "Error";
    }

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 10
    }).format(number);
  };

  const createCalculatorApp = (documentRef, windowRef) => {
    const currentDisplay = documentRef.getElementById("current");
    const historyDisplay = documentRef.getElementById("history");
    const keys = documentRef.querySelector(".keys");
    const state = createState();

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

    const render = () => {
      currentDisplay.textContent = state.current === "Error" ? "Error" : formatValue(state.current);
      historyDisplay.textContent = state.previous && state.operator
        ? `${formatValue(state.previous)} ${state.operator}`
        : "";
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

    const chooseOperator = (operator) => {
      if (state.current === "Error") {
        return;
      }

      if (state.previous && !state.overwrite) {
        state.current = calculate();
        if (state.current === "Error") {
          state.previous = "";
          state.operator = "";
          return;
        }
      }

      state.previous = state.current;
      state.operator = operator;
      state.overwrite = true;
    };

    const evaluate = () => {
      if (!state.previous || !state.operator || state.current === "Error") {
        return;
      }

      state.current = calculate();
      state.previous = "";
      state.operator = "";
      state.overwrite = true;
    };

    const clearAll = () => {
      state.current = "0";
      state.previous = "";
      state.operator = "";
      state.overwrite = false;
    };

    const deleteLast = () => {
      if (state.overwrite || state.current === "Error") {
        state.current = "0";
        state.overwrite = false;
        return;
      }

      state.current = state.current.length > 1 ? state.current.slice(0, -1) : "0";
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
      } else {
        return;
      }

      render();
    };

    keys.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }

      handleAction(button.dataset.action, button.dataset.value);
    });

    windowRef.addEventListener("keydown", (event) => {
      const { key } = event;

      if (/^\d$/.test(key)) {
        handleAction("number", key);
      } else if (key === ".") {
        handleAction("decimal");
      } else if (["+", "-", "*", "/"].includes(key)) {
        handleAction("operator", key);
      } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        handleAction("equals");
      } else if (key === "Backspace") {
        handleAction("delete");
      } else if (key === "Escape") {
        handleAction("clear");
      }
    });

    render();

    return {
      state,
      render,
      handleAction
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
