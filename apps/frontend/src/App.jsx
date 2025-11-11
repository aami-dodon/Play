import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";

function App() {
  return (
    <Card className="prose prose-sm mx-auto mt-10 w-full max-w-xl items-center justify-center text-center text-muted-foreground dark:prose-invert">
      <p>
        Routes are registered in <code>src/main.jsx</code>. This placeholder lives outside the router and
        can be removed when you no longer need it.
      </p>
      <Button className="mx-auto mt-4 w-fit" type="button">
        Back to quizzes
      </Button>
    </Card>
  );
}

export default App;
