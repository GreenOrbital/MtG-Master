import { Switch, Route, Router as WouterRouter } from "wouter";
import { Landing } from "@/pages/Landing";
import { Datenschutz } from "@/pages/Datenschutz";
import { Impressum } from "@/pages/Impressum";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/impressum" component={Impressum} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
