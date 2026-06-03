import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ChefHat, LogOut, User, Refrigerator, BarChart3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, logout, isAuthenticated: originalIsAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  // 💡 統一讀取 LocalStorage 判斷登入狀態
  const storedName = localStorage.getItem("current_user_name");
  const isAuthenticated = originalIsAuthenticated || !!storedName;
  const displayUserName = user?.name || storedName || "大廚";

  // 🚀 關鍵修改：動態生成導覽列
  const navLinks = [
    // 所有人都能看到的：食譜
    { href: "/recipes", label: "食譜", active: location.startsWith("/recipe") || location === "/recipes" },
    
    // 🔒 只有登入後 (isAuthenticated 為 true) 才會顯示的專屬功能
    ...(isAuthenticated ? [
      { href: "/fridge", label: "我的冰箱", icon: Refrigerator, active: location.startsWith("/fridge") },
    ] : []),
    
    // 所有人都能看到的：關於我們
    { href: "/about", label: "關於我們", active: location === "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        
        {/* ================= Logo 區塊 ================= */}
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
          <div className="bg-yellow-400 p-1.5 rounded-lg shadow-sm">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-extrabold text-foreground tracking-wider">好食光</span>
        </Link>

        {/* ================= 中間導覽列 ================= */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    link.active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ================= 右側 Auth 區塊 ================= */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-bold rounded-xl shadow-sm">
                  <User className="h-4 w-4 text-yellow-500" />
                  <span className="max-w-[100px] truncate">
                    {displayUserName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                
                {/* 🚀 新增：個人資料按鈕 */}
                <DropdownMenuItem 
                  onClick={() => setLocation('/profile')}
                  className="cursor-pointer font-bold text-gray-700 focus:text-yellow-600 focus:bg-yellow-50 mb-1"
                >
                  <User className="mr-2 h-4 w-4" />
                  個人資料
                </DropdownMenuItem>

                {/* 登出按鈕 */}
                <DropdownMenuItem 
                  onClick={() => {
                    // 登出：清除狀態並返回首頁
                    logout(); 
                    localStorage.removeItem("current_user_name");
                    window.location.href = "/"; 
                  }}
                  className="cursor-pointer font-bold text-red-500 focus:text-red-600 focus:bg-red-50 border-t border-gray-100 pt-2"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="bg-yellow-400 text-white hover:bg-yellow-500 font-bold px-6 rounded-full shadow-sm"
              onClick={() => { setLocation('/login'); }}
            >
              登入
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}