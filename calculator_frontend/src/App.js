import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * CalculatorButton - Stateless button component for calculator controls.
 * @param {string} children - Button label.
 * @param {function} onClick - Click handler.
 * @param {string} className - Additional class for styling.
 * @param {string} ariaLabel - For accessibility.
 */
function CalculatorButton({ children, onClick, className, ariaLabel }) {
  return (
    <button
      className={`calc-btn${className ? " " + className : ""}`}
      onClick={onClick}
      aria-label={ariaLabel || children}
      tabIndex="0"
      type="button"
    >
      {children}
    </button>
  );
}

/**
 * Main Calculator App
 * - Performs addition, subtraction, multiplication, division
 * - Responsive, modern, minimal
 * - Supports keyboard and mouse input
 * - Session calculation history
 * - Clear/Reset functionality
 */
// PUBLIC_INTERFACE
function App() {
  // Calculator state
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState(null);
  const [pendingOp, setPendingOp] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  // Calculator color palette for light theme
  // These are dynamically applied in App.css as CSS vars.
  const palette = {
    accent: "#FFC107",
    primary: "#1976D2",
    secondary: "#424242",
    background: "#fff",
  };

  // Focus trap for accessibility/keyboard handling
  const wrapperRef = useRef(null);

  // Keyboard event handler
  useEffect(() => {
    function handleKeyDown(e) {
      // If focus is in input, don't intercept keys
      if (
        document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      )
        return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        inputDigit(e.key);
      }
      if ([".", ","].includes(e.key)) {
        e.preventDefault();
        inputDot();
      }
      if (["+", "-", "*", "/"].includes(e.key)) {
        e.preventDefault();
        inputOperator(e.key);
      }
      if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      }
      if (["Escape", "c", "C"].includes(e.key)) {
        e.preventDefault();
        handleClear();
      }
    }
    window.addEventListener("keydown", handleKeyDown, false);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, false);
    };
    // eslint-disable-next-line
  }, [display, accumulator, pendingOp, waitingForOperand, history]);

  // Input handlers (mouse/click & keyboard)
  // PUBLIC_INTERFACE
  function inputDigit(d) {
    if (error) return;
    if (waitingForOperand) {
      setDisplay(d);
      setWaitingForOperand(false);
    } else if (display.length < 14) {
      setDisplay(display === "0" ? d : display + d);
    }
  }
  // PUBLIC_INTERFACE
  function inputDot() {
    if (error) return;
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }
  // PUBLIC_INTERFACE
  function inputOperator(op) {
    if (error) return;
    // If there is a pending operation, resolve it
    if (pendingOp && !waitingForOperand) {
      const result = performCalculation(accumulator, display, pendingOp);
      if (result.error) {
        setError(result.error);
        setDisplay(result.error);
        setAccumulator(null);
        setPendingOp(null);
        setWaitingForOperand(false);
        return;
      }
      setAccumulator(result.value);
      setDisplay(String(result.value));
      setHistory((prev) => [
        ...prev,
        {
          expr: `${formatNum(accumulator)} ${pendingOp} ${formatNum(display)}`,
          result: result.value,
        },
      ]);
    } else if (!waitingForOperand) {
      setAccumulator(Number(display));
    }
    setPendingOp(op);
    setWaitingForOperand(true);
  }
  // PUBLIC_INTERFACE
  function handleEquals() {
    if (error || !pendingOp) return;
    const result = performCalculation(accumulator, display, pendingOp);
    if (result.error) {
      setError(result.error);
      setDisplay(result.error);
      setAccumulator(null);
      setPendingOp(null);
      setWaitingForOperand(false);
      return;
    }
    setHistory((prev) => [
      ...prev,
      {
        expr: `${formatNum(accumulator)} ${pendingOp} ${formatNum(display)}`,
        result: result.value,
      },
    ]);
    setDisplay(String(result.value));
    setAccumulator(null);
    setPendingOp(null);
    setWaitingForOperand(true);
  }
  // PUBLIC_INTERFACE
  function handleClear() {
    setDisplay("0");
    setAccumulator(null);
    setPendingOp(null);
    setError(null);
    setWaitingForOperand(false);
  }
  // PUBLIC_INTERFACE
  function handleBackspace() {
    if (error || waitingForOperand) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith("-"))) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  }

  // Simple arithmetic calculation logic with error handling
  // PUBLIC_INTERFACE
  function performCalculation(left, right, op) {
    const lnum = Number(left);
    const rnum = Number(right);
    let value = null;
    switch (op) {
      case "+":
        value = lnum + rnum;
        break;
      case "-":
        value = lnum - rnum;
        break;
      case "*":
        value = lnum * rnum;
        break;
      case "/":
        if (rnum === 0) {
          return { error: "Error: Div/0" };
        }
        value = lnum / rnum;
        break;
      default:
        return { error: "Invalid op" };
    }
    // Force max precision 10
    value = Math.round(value * 1e10) / 1e10;
    // Avoid super-long decimals
    value = Number.isFinite(value) ? value : "Error";
    return { value };
  }

  // UI Utility: format number for output (max 10 digits, avoid .0)
  function formatNum(val) {
    let v = String(val);
    if (v.endsWith(".0")) v = v.slice(0, -2);
    if (v.length > 14) v = Number(v).toExponential(8);
    return v;
  }

  // Color palette applied via inline CSS vars for accenting the calculator
  useEffect(() => {
    for (const key in palette) {
      document.documentElement.style.setProperty(`--calc-${key}`, palette[key]);
    }
  }, []);

  // Prevent scroll/zoom on keys for better UX
  useEffect(() => {
    function stopWheel(e) {
      if (
        document.activeElement &&
        wrapperRef.current &&
        wrapperRef.current.contains(document.activeElement)
      ) {
        e.preventDefault();
      }
    }
    window.addEventListener("wheel", stopWheel, { passive: false });
    return () => window.removeEventListener("wheel", stopWheel);
  }, []);

  // Button layout (label, onClick, aria)
  const buttons = [
    [
      { label: "7", onClick: () => inputDigit("7") },
      { label: "8", onClick: () => inputDigit("8") },
      { label: "9", onClick: () => inputDigit("9") },
      { label: "÷", onClick: () => inputOperator("/") , className: "op-btn", ariaLabel: "divide"},
    ],
    [
      { label: "4", onClick: () => inputDigit("4") },
      { label: "5", onClick: () => inputDigit("5") },
      { label: "6", onClick: () => inputDigit("6") },
      { label: "×", onClick: () => inputOperator("*"), className: "op-btn", ariaLabel: "multiply"},
    ],
    [
      { label: "1", onClick: () => inputDigit("1") },
      { label: "2", onClick: () => inputDigit("2") },
      { label: "3", onClick: () => inputDigit("3") },
      { label: "−", onClick: () => inputOperator("-"), className: "op-btn", ariaLabel: "subtract"},
    ],
    [
      { label: "0", onClick: () => inputDigit("0"), className: "zero" },
      { label: ".", onClick: () => inputDot(), ariaLabel: "decimal"},
      { label: "=", onClick: handleEquals, className: "eq-btn", ariaLabel: "equals"},
      { label: "+", onClick: () => inputOperator("+"), className: "op-btn", ariaLabel: "add"},
    ],
    [
      { label: "C", onClick: handleClear, className: "clear-btn", ariaLabel: "Clear/Reset" },
      { label: "⌫", onClick: handleBackspace, ariaLabel: "Backspace" }
    ]
  ];

  // Render
  return (
    <div className="calc-root" ref={wrapperRef}>
      <main className="calc-main">
        <section className="calc-panel" aria-label="Calculator interface" role="region">
          <div className="calc-display" title={display} aria-live="polite" aria-atomic="true" tabIndex={0}>
            {display}
          </div>
          <div className="calc-buttons" role="group" aria-label="Calculator keypad">
            {buttons.slice(0,4).map((row, i) => (
              <div key={`row${i}`} className="calc-row">
                {row.map((btn, j) => (
                  <CalculatorButton
                    key={btn.label}
                    {...btn}
                  >
                    {btn.label}
                  </CalculatorButton>
                ))}
              </div>
            ))}
            <div className="calc-row misc-row">
              {buttons[4].map(btn => (
                <CalculatorButton
                  key={btn.label}
                  {...btn}
                >
                  {btn.label}
                </CalculatorButton>
              ))}
            </div>
          </div>
        </section>
        <aside className="calc-history-panel" aria-label="Session Calculation History">
          <div className="calc-history-title">History</div>
          <ul className="calc-history-list">
            {history.length === 0 && (
              <li className="calc-history-item calc-history-empty">No calculations yet.</li>
            )}
            {history.slice(-10).reverse().map((item, idx) => (
              <li className="calc-history-item" key={history.length - idx - 1}>
                <span className="calc-history-expr">
                  {item.expr}
                </span>
                <span className="calc-history-result">
                  = {formatNum(item.result)}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </main>
      <footer className="calc-footer">
        <span className="credits">
          Web Calculator &mdash; Modern Minimal React &copy; 2024
        </span>
        <span className="kbrd-help">
          Use keyboard <kbd>0</kbd>-<kbd>9</kbd> <kbd>.</kbd> <kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd> <kbd>Enter</kbd> <kbd>=</kbd> <kbd>Backspace</kbd> <kbd>C</kbd>
        </span>
      </footer>
    </div>
  );
}

export default App;
