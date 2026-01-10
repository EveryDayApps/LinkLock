import { Button } from "@/components/ui/button";
import { useState } from "react";

function App() {
  const [count, setCount] = useState<number>(0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 rounded-lg border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Counter</h1>

        <div className="text-4xl font-bold">{count}</div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCount((c) => c - 1)}>
            −
          </Button>

          <Button onClick={() => setCount((c) => c + 1)}>+</Button>

          <Button variant="destructive" onClick={() => setCount(0)}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
