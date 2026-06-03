import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// 引入元件與頁面
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Fridge from "./pages/Fridge";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import Search from "./pages/Search";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/recipes" component={Recipes} />
      <Route path="/recipe/:id" component={RecipeDetail} />
      <Route path="/search" component={Search} />
      <Route path="/about" component={About} />
      <Route path="/fridge" component={Fridge} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* 🚀 關鍵修復：把 Profile 移到 NotFound 的上面 */}
      <Route path="/profile" component={Profile} />
      
      {/* ⚠️ NotFound 必須永遠放在最後一行，當作所有未知網址的終極攔截網 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {/* 全局佈局：Navbar 在上，中間 Router 切換頁面，下方 Footer 固定 */}
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}