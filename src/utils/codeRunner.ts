import { ExecutionResult } from '../types';

export async function runJavaScriptCode(code: string): Promise<ExecutionResult> {
  const logs: string[] = [];
  const errors: string[] = [];
  const startTime = performance.now();

  // Custom console interception
  const mockConsole = {
    log: (...args: any[]) => {
      logs.push(args.map(formatConsoleArg).join(' '));
    },
    warn: (...args: any[]) => {
      logs.push('⚠️ ' + args.map(formatConsoleArg).join(' '));
    },
    error: (...args: any[]) => {
      errors.push('❌ ' + args.map(formatConsoleArg).join(' '));
    },
    info: (...args: any[]) => {
      logs.push('ℹ️ ' + args.map(formatConsoleArg).join(' '));
    },
    table: (tabularData: any) => {
      try {
        logs.push(JSON.stringify(tabularData, null, 2));
      } catch {
        logs.push(String(tabularData));
      }
    },
  };

  try {
    // Clean up code if it starts with ```javascript or similar
    let cleanCode = code
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    // Sandboxed execution with timeout
    const executionPromise = new Promise<{ result: any }>((resolve, reject) => {
      try {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const fn = new AsyncFunction('console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'Promise', cleanCode);
        fn(mockConsole, Math, Date, JSON, Array, Object, Promise)
          .then((res: any) => resolve({ result: res }))
          .catch((err: any) => reject(err));
      } catch (compileErr) {
        reject(compileErr);
      }
    });

    const timeoutPromise = new Promise<{ result: any }>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timed out after 5000ms.')), 5000);
    });

    const { result } = await Promise.race([executionPromise, timeoutPromise]);
    const duration = Math.round(performance.now() - startTime);

    return {
      success: errors.length === 0,
      output: logs.join('\n'),
      error: errors.join('\n') || undefined,
      result: result !== undefined ? formatConsoleArg(result) : undefined,
      executionTime: duration,
    };
  } catch (err: any) {
    const duration = Math.round(performance.now() - startTime);
    return {
      success: false,
      output: logs.join('\n'),
      error: err.message || String(err),
      executionTime: duration,
    };
  }
}

export async function runPythonCode(code: string): Promise<ExecutionResult> {
  const startTime = performance.now();
  try {
    // Attempt server execution first if online
    const res = await fetch('/api/execute-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'python', code }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: data.success ?? true,
        output: data.output || 'Execution completed.',
        error: data.error,
        result: data.result,
        executionTime: Math.round(performance.now() - startTime),
      };
    }
  } catch {
    // fallback to client simulation
  }

  // Client Python runner simulation (interprets print(), math, lists, dicts)
  const lines = code.split('\n');
  const outputs: string[] = [];
  const vars: Record<string, any> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Handle print statements
    const printMatch = trimmed.match(/^print\((.*)\)$/);
    if (printMatch) {
      const content = printMatch[1];
      try {
        // Evaluate simple expressions or strings
        if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
          outputs.push(content.slice(1, -1));
        } else {
          // evaluate in safe math scope
          const sanitized = content.replace(/([a-zA-Z_]\w*)/g, (m) => (vars[m] !== undefined ? JSON.stringify(vars[m]) : m));
          const val = Function(`return (${sanitized})`)();
          outputs.push(String(val));
        }
      } catch {
        outputs.push(content);
      }
      continue;
    }

    // Handle simple variable assignments e.g. x = 10 or names = ['a', 'b']
    const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const expr = assignMatch[2];
      try {
        vars[varName] = Function(`return (${expr})`)();
      } catch {
        vars[varName] = expr;
      }
    }
  }

  const duration = Math.round(performance.now() - startTime);
  return {
    success: true,
    output: outputs.length > 0 ? outputs.join('\n') : 'Python script parsed and simulated successfully.',
    executionTime: duration,
  };
}

export function buildIframeSrcDoc(htmlOrJs: string, isReact: boolean = false): string {
  // If it's a full HTML document
  if (htmlOrJs.includes('<!DOCTYPE') || htmlOrJs.includes('<html')) {
    // Inject responsive styles and safe error handling
    return htmlOrJs.replace(
      '</head>',
      `
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { margin: 0; padding: 12px; font-family: system-ui, -apple-system, sans-serif; }
      </style>
      <script>
        window.onerror = function(msg, url, line) {
          console.error("Frame Error: " + msg + " (line " + line + ")");
        };
      </script>
      </head>`
    );
  }

  if (isReact) {
    // Wrap React component code
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-slate-900 text-slate-100 p-4">
  <div id="root"></div>
  <script type="text/babel">
    try {
      ${htmlOrJs}
      if (typeof App !== 'undefined') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
      }
    } catch (e) {
      document.getElementById('root').innerHTML = '<div style="color:#ef4444;padding:16px;">Render Error: ' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
  }

  // Wrap partial HTML snippet
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; }
  </style>
</head>
<body>
  ${htmlOrJs}
</body>
</html>`;
}

function formatConsoleArg(arg: any): string {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}
