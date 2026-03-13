const { JSDOM } = require("jsdom");
const { createCalculatorApp, formatValue } = require("./calculator-ui");

const createDom = () =>
  new JSDOM(`
    <main class="app-shell">
      <section class="panel hero">
        <ul id="history-list"></ul>
      </section>
      <section class="panel calculator">
        <section class="display">
          <div id="expression"></div>
          <div id="history"></div>
          <div id="current">0</div>
        </section>
        <section class="keys">
          <button data-action="clear">AC</button>
          <button data-action="delete">DEL</button>
          <button data-action="sign">+/-</button>
          <button data-action="operator" data-value="/">/</button>
          <button data-action="percent">%</button>
          <button data-action="number" data-value="7">7</button>
          <button data-action="number" data-value="8">8</button>
          <button data-action="number" data-value="9">9</button>
          <button data-action="operator" data-value="*">*</button>
          <button data-action="number" data-value="4">4</button>
          <button data-action="number" data-value="5">5</button>
          <button data-action="number" data-value="6">6</button>
          <button data-action="operator" data-value="-">-</button>
          <button data-action="number" data-value="1">1</button>
          <button data-action="number" data-value="2">2</button>
          <button data-action="number" data-value="3">3</button>
          <button data-action="operator" data-value="+">+</button>
          <button data-action="number" data-value="0">0</button>
          <button data-action="decimal">.</button>
          <button data-action="equals">=</button>
        </section>
      </section>
    </main>
  `);

const click = (documentRef, selector) => {
  documentRef.querySelector(selector).dispatchEvent(
    new documentRef.defaultView.MouseEvent("click", { bubbles: true })
  );
};

describe("calculator-ui", () => {
  test("formats numbers for display", () => {
    expect(formatValue("1234.5")).toBe("1,234.5");
    expect(formatValue("Error")).toBe("Error");
    expect(formatValue("Infinity")).toBe("Error");
  });

  test("evaluates button-driven operations and records result history", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    click(dom.window.document, '[data-action="number"][data-value="7"]');
    click(dom.window.document, '[data-action="operator"][data-value="+"]');
    click(dom.window.document, '[data-action="number"][data-value="8"]');
    click(dom.window.document, '[data-action="equals"]');

    expect(app.state.current).toBe("15");
    expect(dom.window.document.getElementById("current").textContent).toBe("15");
    expect(dom.window.document.getElementById("history").textContent).toBe("");
    expect(dom.window.document.getElementById("expression").textContent).toBe("7 + 8 =");
    expect(dom.window.document.querySelectorAll(".history-item")).toHaveLength(1);
    expect(dom.window.document.getElementById("history-list").textContent).toContain("7 + 8");
  });

  test("supports chained operations and decimal input without duplicating decimals", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    app.handleAction("number", "1");
    app.handleAction("decimal");
    app.handleAction("decimal");
    app.handleAction("number", "5");
    app.handleAction("operator", "+");
    app.handleAction("number", "2");
    app.handleAction("operator", "*");
    app.handleAction("number", "3");
    app.handleAction("equals");

    expect(app.state.current).toBe("10.5");
    expect(dom.window.document.getElementById("current").textContent).toBe("10.5");
    expect(dom.window.document.getElementById("expression").textContent).toBe("3.5 * 3 =");
  });

  test("supports sign toggle, percent, and error recovery", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    app.handleAction("number", "5");
    app.handleAction("sign");
    expect(app.state.current).toBe("-5");

    app.handleAction("percent");
    expect(app.state.current).toBe("-0.05");

    app.handleAction("operator", "/");
    app.handleAction("number", "0");
    app.handleAction("equals");
    expect(app.state.current).toBe("Error");

    app.handleAction("number", "4");
    expect(app.state.current).toBe("4");
  });

  test("deleting a negative single digit resets to zero instead of leaving an invalid dash", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    app.handleAction("number", "5");
    app.handleAction("sign");
    app.handleAction("delete");

    expect(app.state.current).toBe("0");
    expect(dom.window.document.getElementById("current").textContent).toBe("0");
  });

  test("limits result history to the latest five entries", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    for (let index = 1; index <= 6; index += 1) {
      app.handleAction("clear");
      app.handleAction("number", String(index));
      app.handleAction("operator", "+");
      app.handleAction("number", "1");
      app.handleAction("equals");
    }

    expect(app.state.history).toHaveLength(5);
    expect(app.state.history[0].expression).toBe("6 + 1");
    expect(app.state.history[4].expression).toBe("2 + 1");
    expect(dom.window.document.querySelectorAll(".history-item")).toHaveLength(5);
  });

  test("reuses a previous result when a history item is activated", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    app.handleAction("number", "9");
    app.handleAction("operator", "-");
    app.handleAction("number", "4");
    app.handleAction("equals");

    const historyItem = dom.window.document.querySelector(".history-item");
    historyItem.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    expect(app.state.current).toBe("5");
    expect(app.state.expression).toBe("9 - 4 =");
    expect(dom.window.document.getElementById("current").textContent).toBe("5");
  });

  test("renders empty history and supports delete plus clear keyboard shortcuts", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    expect(dom.window.document.querySelector(".empty-history").textContent).toBe("No calculations yet.");

    app.handleAction("number", "1");
    app.handleAction("number", "2");
    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Backspace" }));
    expect(app.state.current).toBe("1");

    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape" }));
    expect(app.state.current).toBe("0");
    expect(app.state.previous).toBe("");
    expect(app.state.operator).toBe("");
    expect(dom.window.document.getElementById("expression").textContent).toBe("");
  });

  test("ignores unsupported actions and keyboard input, and resets delete after overwrite", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    app.handleAction("number", "9");
    app.handleAction("operator", "+");
    app.handleAction("number", "1");
    app.handleAction("equals");

    expect(app.state.overwrite).toBe(true);
    app.handleAction("delete");
    expect(app.state.current).toBe("0");
    expect(app.state.overwrite).toBe(false);

    app.handleAction("unknown", "ignored");
    expect(app.state.current).toBe("0");

    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "x" }));
    expect(app.state.current).toBe("0");
  });

  test("supports equals and percent keyboard input", () => {
    const dom = createDom();
    createCalculatorApp(dom.window.document, dom.window);

    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "9" }));
    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "%" }));
    expect(dom.window.document.getElementById("current").textContent).toBe("0.09");

    const equalsEvent = new dom.window.KeyboardEvent("keydown", { key: "=" });
    Object.defineProperty(equalsEvent, "preventDefault", { value: jest.fn() });

    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "+" }));
    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "1" }));
    dom.window.dispatchEvent(equalsEvent);

    expect(dom.window.document.getElementById("current").textContent).toBe("1.09");
    expect(equalsEvent.preventDefault).toHaveBeenCalled();
  });

  test("responds to keyboard controls", () => {
    const dom = createDom();
    createCalculatorApp(dom.window.document, dom.window);

    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "6" }));
    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "*" }));
    dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "7" }));
    const enterEvent = new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true });
    Object.defineProperty(enterEvent, "preventDefault", { value: jest.fn() });
    dom.window.dispatchEvent(enterEvent);

    expect(dom.window.document.getElementById("current").textContent).toBe("42");
    expect(dom.window.document.getElementById("expression").textContent).toBe("6 * 7 =");
    expect(enterEvent.preventDefault).toHaveBeenCalled();
  });
});
