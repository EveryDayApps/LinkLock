import AppDrawerContent from "./components/core/DrawerContent";
import { Button } from "./components/ui/button";
import { Sheet, SheetTrigger } from "./components/ui/sheet";

function App() {
  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Options</Button>
        </SheetTrigger>
        <AppDrawerContent />
      </Sheet>
    </div>
  );
}

export default App;
