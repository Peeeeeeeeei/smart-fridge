import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, ChefHat, Clock, Flame, ArrowLeft, SlidersHorizontal, X, Heart, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const formatRecipe = (backendRecipe: any) => {
  const recipeId = backendRecipe.recipe_id || backendRecipe.id || Math.random().toString();
  const currentUserId = localStorage.getItem("current_user_id") || "guest";
  const savedFavs = JSON.parse(localStorage.getItem(`favorites_${currentUserId}`) || '[]');
  
  const rawLabels = typeof backendRecipe.labels === 'string' ? backendRecipe.labels.split(',') : (backendRecipe.labels || []);
  const cleanLabels = rawLabels.map((l: string) => l.replace(/^#/, '').trim());

  const isVeg = backendRecipe.is_vegetarian === true || backendRecipe.is_vegetarian === 1 || cleanLabels.includes("素食可") || cleanLabels.includes("全素");
  if (isVeg && !cleanLabels.includes("素食")) {
    cleanLabels.push("素食");
  }

  const rawMethods = typeof backendRecipe.cook_methods === 'string' ? backendRecipe.cook_methods.split(',') : (backendRecipe.cook_methods || []);
  const cleanMethods = rawMethods.map((m: string) => m.replace(/^#/, '').trim());

  return {
    id: recipeId,
    title: backendRecipe.title || backendRecipe.name || "美味神祕料理",
    description: backendRecipe.description || (backendRecipe.steps ? backendRecipe.steps.substring(0, 40) + "..." : "點擊查看美味食譜詳細步驟與所需食材"),
    imageUrl: backendRecipe.image_url || backendRecipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800",
    cookTime: backendRecipe.cook_time || "?", 
    difficulty: backendRecipe.difficulty || "未知", 
    labels: cleanLabels, 
    cookMethods: cleanMethods,
    isFavorited: savedFavs.includes(recipeId) || backendRecipe.is_favorited === true,
  };
};

const RECIPE_LABELS = ["飯與粥品", "麵食與冬粉", "湯品與鍋物", "肉類料理", "海鮮料理", "蔬菜與蛋豆", "炸物、小吃與早午餐", "日韓與異國風味", "甜點與飲品", "常備菜與風味醬料", "素食"];
const COOK_METHODS = ["蒸", "煮", "燉", "燙", "炒", "煎", "炸", "烤", "滷", "涼拌"];

export default function Recipes() {
  const { user, isAuthenticated: originalIsAuthenticated } = useAuth();
  const isAuthenticated = originalIsAuthenticated || !!localStorage.getItem("current_user_name");

  const [recipes, setRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 1000; 

  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = new URLSearchParams(window.location.search);
  const initialLabel = searchParams.get("label");

  const [showFilters, setShowFilters] = useState(!!initialLabel);
  const [activeLabels, setActiveLabels] = useState<string[]>(initialLabel ? [initialLabel] : []);
  const [activeMethods, setActiveMethods] = useState<string[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterFavorited, setFilterFavorited] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/recipes/?page=${currentPage}&page_size=${PAGE_SIZE}`)
      .then((res) => {
        if (!res.ok) throw new Error("網路連線異常");
        return res.json();
      })
      .then((data) => {
        let fetchedRecipes: any[] = [];
        if (Array.isArray(data)) fetchedRecipes = data;
        else if (data?.results && Array.isArray(data.results)) fetchedRecipes = data.results;
        else if (data?.recipes && Array.isArray(data.recipes)) fetchedRecipes = data.recipes;

        setRecipes(fetchedRecipes.map(formatRecipe));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("無法取得食譜資料：", error);
        setIsLoading(false);
      });
  }, [currentPage, isAuthenticated]);

  // 🚀 資料載入完畢後，還原高度
  useEffect(() => {
    if (!isLoading && recipes.length > 0) {
      const savedScroll = sessionStorage.getItem('recipesScrollPos');
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
          sessionStorage.removeItem('recipesScrollPos');
        }, 50);
      }
    }
  }, [isLoading, recipes]);

  const handleCardClick = () => {
    sessionStorage.setItem('recipesScrollPos', window.scrollY.toString());
  };

  const toggleLabel = (label: string) => setActiveLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  const toggleMethod = (method: string) => setActiveMethods(prev => prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]);

  const filteredRecipes = recipes.filter(recipe => {
    const matchLabels = activeLabels.length === 0 || activeLabels.some(uiLabel => 
      recipe.labels?.some((dbLabel: string) => uiLabel.includes(dbLabel) || dbLabel.includes(uiLabel))
    );
    
    const matchMethods = activeMethods.length === 0 || activeMethods.some(uiMethod => 
      recipe.cookMethods?.some((dbMethod: string) => uiMethod.includes(dbMethod) || dbMethod.includes(uiMethod))
    );
    
    const matchDiff = filterDifficulty === "all" || recipe.difficulty === filterDifficulty;
    const matchFav = filterFavorited === "all" || (filterFavorited === "true" ? recipe.isFavorited : !recipe.isFavorited);

    return matchLabels && matchMethods && matchDiff && matchFav;
  });

  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    const aFav = a.isFavorited ? 1 : 0;
    const bFav = b.isFavorited ? 1 : 0;
    return bFav - aFav; 
  });

  const activeFilterCount = activeLabels.length + activeMethods.length + (filterDifficulty !== "all" ? 1 : 0) + (filterFavorited !== "all" ? 1 : 0);

  const clearFilters = () => {
    setActiveLabels([]);
    setActiveMethods([]);
    setFilterDifficulty("all");
    setFilterFavorited("all");
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

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
            <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-sm hover:-translate-y-1">
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col pb-24 relative">
      
      <div className="bg-yellow-400 pt-12 pb-24 px-4 shadow-md text-center relative">
        {/* 🚀 改為真正的「回上一頁」機制 */}
        <button 
          onClick={() => window.history.back()}
          className="absolute top-6 left-6 bg-yellow-500 hover:bg-yellow-600 text-white p-2 md:p-3 rounded-full transition-all shadow-sm z-50"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="container mx-auto max-w-4xl text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest drop-shadow-sm mb-4 flex items-center justify-center gap-3">
            <ChefHat className="h-10 w-10 text-white fill-white/20" />
            所有食譜庫
          </h1>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 -mt-12 flex-grow z-10">
        
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-8 border border-yellow-100 transition-all duration-300">
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-1/2 lg:w-2/3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="搜尋所有食譜... (輸入關鍵字後按 Enter )"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
              />
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
                  showFilters || activeFilterCount > 0 
                    ? "bg-yellow-100 text-yellow-700 border border-yellow-300" 
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <SlidersHorizontal className="h-5 w-5" />
                篩選器 {activeFilterCount > 0 && <span className="bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-4 fade-in duration-200">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">食譜分類</h3>
                <div className="flex flex-wrap gap-2">
                  {RECIPE_LABELS.map(label => (
                    <button
                      key={label}
                      onClick={() => toggleLabel(label)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                        activeLabels.includes(label)
                          ? "bg-yellow-400 text-white border-yellow-400 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {label === "素食" ? "🌿 素食" : label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">烹飪方式</h3>
                <div className="flex flex-wrap gap-2">
                  {COOK_METHODS.map(method => (
                    <button
                      key={method}
                      onClick={() => toggleMethod(method)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                        activeMethods.includes(method)
                          ? "bg-orange-400 text-white border-orange-400 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">難易度</label>
                  <select 
                    className="bg-gray-50 border border-gray-200 text-gray-700 rounded-xl focus:ring-yellow-400 focus:border-yellow-400 w-full p-3 font-medium outline-none"
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                  >
                    <option value="all">不限</option>
                    <option value="易">新手 (易)</option>
                    <option value="中">進階 (中)</option>
                    <option value="難">大廚 (難)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">收藏狀態</label>
                  <select 
                    className="bg-gray-50 border border-gray-200 text-gray-700 rounded-xl focus:ring-yellow-400 focus:border-yellow-400 w-full p-3 font-medium outline-none"
                    value={filterFavorited}
                    onChange={(e) => setFilterFavorited(e.target.value)}
                  >
                    <option value="all">全部食譜</option>
                    <option value="true">已收藏 ❤️</option>
                    <option value="false">未收藏</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-red-500 font-bold flex items-center gap-1">
                  <X className="h-4 w-4" /> 清除所有條件
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 px-2 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-700">
            篩選結果 <span className="text-yellow-500 ml-1">{sortedRecipes.length}</span> 道食譜
          </h2>
        </div>

        {isLoading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-yellow-500">
            <ChefHat className="h-16 w-16 animate-bounce mb-4" />
            <span className="text-xl font-bold tracking-widest">正在翻閱食譜書...</span>
          </div>
        ) : sortedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {sortedRecipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                {/* 🚀 在這裡觸發滾動記憶 */}
                <div onClick={handleCardClick} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col h-full border border-gray-100 transform hover:-translate-y-1 relative">
                  
                  {recipe.isFavorited && (
                    <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm">
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </div>
                  )}

                  <div className="relative h-56 w-full overflow-hidden">
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-extrabold text-gray-800 mb-2 line-clamp-1 group-hover:text-yellow-600 transition-colors">
                      {recipe.title}
                    </h3>
                    
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

                    <p className="text-gray-500 font-medium text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">
                      {recipe.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                        <Clock className="h-3.5 w-3.5 text-yellow-500" />
                        {recipe.cookTime} 分鐘
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                        <Flame className="h-3.5 w-3.5 text-orange-400" />
                        {recipe.difficulty}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-dashed border-gray-300">
            <ChefHat className="h-24 w-24 mx-auto text-gray-200 mb-6" />
            <h3 className="text-2xl font-bold text-gray-600 mb-3">找不到符合條件的食譜</h3>
            <p className="text-gray-400 font-medium text-lg">試著放寬篩選條件，或是切換到其他頁面尋找看看喔！</p>
          </div>
        )}
      </main>
    </div>
  );
}