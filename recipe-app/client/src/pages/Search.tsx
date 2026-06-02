import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, ArrowRight, Clock, Flame, Frown, ChefHat, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// 🚀 萬用格式轉換器 (已同步 Recipes.tsx 的標籤與素食判斷邏輯)
const formatRecipe = (backendRecipe: any) => {
  const rawLabels = typeof backendRecipe.labels === 'string' ? backendRecipe.labels.split(',') : (backendRecipe.labels || []);
  const cleanLabels = rawLabels.map((l: string) => l.replace(/^#/, '').trim());

  // 💡 確保素食食譜擁有 "素食" 標籤
  const isVeg = backendRecipe.is_vegetarian === true || backendRecipe.is_vegetarian === 1 || cleanLabels.includes("素食可") || cleanLabels.includes("全素");
  if (isVeg && !cleanLabels.includes("素食")) {
    cleanLabels.push("素食");
  }

  return {
    id: backendRecipe.recipe_id || backendRecipe.id || Math.random().toString(),
    title: backendRecipe.title || backendRecipe.name || "美味神祕料理",
    description: backendRecipe.description || (backendRecipe.steps ? backendRecipe.steps.substring(0, 40) + "..." : "點擊查看美味食譜詳細步驟與所需食材"),
    imageUrl: backendRecipe.image_url || backendRecipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800",
    cookTime: backendRecipe.cook_time || "?", 
    difficulty: backendRecipe.difficulty || "未知", 
    labels: cleanLabels, // 👈 新增標籤屬性
  };
};

export default function Search() {
  // 1. 🚀 在元件最上方取得登入狀態
  const { user, isAuthenticated: originalIsAuthenticated } = useAuth();
  const isAuthenticated = originalIsAuthenticated || !!localStorage.getItem("current_user_name");

  // 取得網址列上的搜尋關鍵字
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";

  // 狀態管理
  const [inputValue, setInputValue] = useState(initialQuery);     
  const [currentQuery, setCurrentQuery] = useState(initialQuery); 
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // 當 currentQuery 改變時，去後端抓搜尋結果
  useEffect(() => {
    // 💡 如果沒登入，就不打 API 浪費資源
    if (!isAuthenticated || !currentQuery.trim()) {
      setRecipes([]);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    
    // 🚀 使用環境變數打 API
    fetch(`${import.meta.env.VITE_API_URL}/api/recipes/search?q=${encodeURIComponent(currentQuery)}&page=1&page_size=20`)
      .then(res => {
        if (!res.ok) throw new Error("搜尋 API 發生錯誤");
        return res.json();
      })
      .then(data => {
        let fetchedRecipes: any[] = [];
        if (data?.results && Array.isArray(data.results)) {
          fetchedRecipes = data.results;
          setTotalCount(data.total || data.results.length);
        } else if (Array.isArray(data)) {
          fetchedRecipes = data;
          setTotalCount(data.length);
        }

        const formattedRecipes = fetchedRecipes.map(formatRecipe);
        setRecipes(formattedRecipes);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("無法取得搜尋結果：", err);
        setRecipes([]);
        setTotalCount(0);
        setIsLoading(false);
      });
  }, [currentQuery, isAuthenticated]);

  const handleSearchSubmit = () => {
    if (!inputValue.trim()) return;
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(inputValue)}`);
    setCurrentQuery(inputValue); 
  };

  // 🚀 2. 登入檢查防護牆 (如果未登入，直接顯示這面牆，不渲染搜尋畫面)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 pb-20">
        <div className="bg-white p-10 rounded-3xl shadow-md max-w-md w-full text-center border border-gray-100">
          <div className="bg-yellow-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-3">會員專屬功能</h2>
          <p className="text-gray-500 font-medium mb-8">
            解鎖完整的智慧食譜庫、精準搜尋與私房收藏功能，請先登入會員喔！
          </p>
          <Link href="/login">
            <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
              前往登入
            </button>
          </Link>
          <div className="mt-6">
            <Link href="/">
              <span className="text-gray-400 hover:text-yellow-500 font-bold cursor-pointer text-sm transition-colors">
                返回首頁
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🚀 3. 原本的搜尋頁面 (登入後才會跑到這裡)
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      <div className="bg-yellow-400 pt-16 pb-24 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest drop-shadow-sm mb-4">
          尋找美味食譜
        </h1>
        <p className="font-bold opacity-90 text-lg md:text-xl">
          讓好食光陪你一起探索廚房的無限可能
        </p>
      </div>

      <main className="container mx-auto px-4 max-w-6xl -mt-10 flex-grow pb-24">
        
        <div className="bg-white rounded-full p-2 flex items-center shadow-lg mb-10 mx-auto max-w-3xl relative z-10 border border-gray-100">
          <SearchIcon className="text-yellow-400 ml-6 h-6 w-6" />
          <input
            placeholder="今天想找什麼食譜呢？..."
            className="bg-transparent text-gray-700 placeholder:text-gray-300 flex-1 mx-4 outline-none text-lg font-medium"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
          />
          <button 
            onClick={handleSearchSubmit}
            className="bg-yellow-400 hover:bg-yellow-500 rounded-full p-3 text-white transition-colors mr-1 shadow-sm"
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[400px]">
          
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">
            「<span className="text-yellow-500">{currentQuery || "全部"}</span>」的搜尋結果 
            <span className="text-gray-400 text-sm font-normal ml-3">共 {totalCount} 筆</span>
          </h2>

          {isLoading ? (
            <div className="w-full py-20 flex flex-col items-center text-yellow-500">
              <ChefHat className="h-16 w-16 animate-bounce mb-4" />
              <span className="font-bold tracking-widest text-lg">正在尋找食譜...</span>
            </div>
          ) : recipes.length > 0 ? (
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {recipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                  <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full border border-gray-100">
                    <div className="relative h-48 w-full overflow-hidden">
                      <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-lg font-extrabold text-gray-800 mb-2 line-clamp-1 group-hover:text-yellow-600 transition-colors">
                        {recipe.title}
                      </h3>
                      
                      {/* 💡 亮點新增：在卡片上顯示前 3 個標籤 */}
                      {recipe.labels && recipe.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {recipe.labels.slice(0, 3).map((label: string, idx: number) => (
                            <span key={idx} className={`text-xs font-bold px-2 py-0.5 rounded-md border ${label === '素食' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                              #{label}
                            </span>
                          ))}
                          {recipe.labels.length > 3 && (
                            <span className="bg-gray-50 text-gray-400 border border-gray-200 text-xs font-bold px-2 py-0.5 rounded-md">
                              +{recipe.labels.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 💡 新增描述區塊 */}
                      <p className="text-gray-500 font-medium text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">
                        {recipe.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mt-auto pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-yellow-500" />{recipe.cookTime} 分鐘</div>
                        <div className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-orange-400" />{recipe.difficulty}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-gray-100 rounded-full p-6 mb-6">
                <Frown className="h-16 w-16 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">找不到相關食譜</h3>
              <p className="text-gray-400 font-medium">換個關鍵字，或是輸入「牛肉」試試看吧！</p>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}