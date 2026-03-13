const { JSDOM } = require("jsdom");
const { createCalculatorApp, formatValue } = require("./calculator-ui");

const createDom = () =>
  new JSDOM(`
    <main class="calculator">
      <section class="display">
        <div id="history"></div>
        <div id="current">0</div>
      </section>
      <section class="keys">
        <button data-action="clear">AC</button>
        <button data-action="delete">DEL</button>
        <button data-action="decimal">.</button>
        <button data-action="operator" data-value="/">/</button>
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
        <button data-action="equals">=</button>
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

  test("evaluates button-driven operations and updates the display", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    click(dom.window.document, '[data-action="number"][data-value="7"]');
    click(dom.window.document, '[data-action="operator"][data-value="+"]');
    click(dom.window.document, '[data-action="number"][data-value="8"]');
    click(dom.window.document, '[data-action="equals"]');

    expect(app.state.current).toBe("15");
    expect(dom.window.document.getElementById("current").textContent).toBe("15");
    expect(dom.window.document.getElementById("history").textContent).toBe("");
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
  });

  test("resets from error state and delete clears overwrite state", () => {
    const dom = createDom();
    const app = createCalculatorApp(dom.window.document, dom.window);

    app.handleAction("number", "9");
    app.handleAction("operator", "/");
    app.handleAction("number", "0");
    app.handleAction("equals");

    expect(app.state.current).toBe("Error");

    app.handleAction("number", "4");
    expect(app.state.current).toBe("4");

    app.handleAction("operator", "+");
    app.handleAction("delete");
    expect(app.state.current).toBe("0");
    expect(app.state.overwrite).toBe(false);
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
    expect(enterEvent.preventDefault).toHaveBeenCalled();
  });
});
