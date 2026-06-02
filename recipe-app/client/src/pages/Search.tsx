import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, ArrowRight, ArrowLeft, Clock, Flame, Frown, ChefHat, Lock, SlidersHorizontal, X, Heart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const RECIPE_LABELS = ["飯與粥品", "麵食與冬粉", "湯品與鍋物", "肉類料理", "海鮮料理", "蔬菜與蛋豆", "炸物、小吃與早午餐", "日韓與異國風味", "甜點與飲品", "常備菜與風味醬料", "素食"];
const COOK_METHODS = ["蒸", "煮", "燉", "燙", "炒", "煎", "炸", "烤", "滷", "涼拌"];

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

export default function Search() {
  const { user, isAuthenticated: originalIsAuthenticated } = useAuth();
  const isAuthenticated = originalIsAuthenticated || !!localStorage.getItem("current_user_name");

  const searchParams = new URLSearchParams(window.location.search);
  
  // 🚀 亮點 1：如果有暫存的搜尋字眼就拿出來用，確保返回時不會清空
  const initialQuery = searchParams.get("q") !== null ? searchParams.get("q") : (sessionStorage.getItem("searchQuery") || "");

  const [inputValue, setInputValue] = useState(initialQuery || "");     
  const [currentQuery, setCurrentQuery] = useState(initialQuery || ""); 
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(true); 
  const [activeLabels, setActiveLabels] = useState<string[]>([]);
  const [activeMethods, setActiveMethods] = useState<string[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterFavorited, setFilterFavorited] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    
    const fetchUrl = currentQuery.trim()
      ? `${import.meta.env.VITE_API_URL}/api/recipes/search?q=${encodeURIComponent(currentQuery)}&page=1&page_size=1000`
      : `${import.meta.env.VITE_API_URL}/api/recipes/?page=1&page_size=1000`;

    fetch(fetchUrl)
      .then(res => {
        if (!res.ok) throw new Error("API 發生錯誤");
        return res.json();
      })
      .then(data => {
        let fetchedRecipes: any[] = [];
        if (data?.results && Array.isArray(data.results)) {
          fetchedRecipes = data.results;
        } else if (data?.recipes && Array.isArray(data.recipes)) {
          fetchedRecipes = data.recipes;
        } else if (Array.isArray(data)) {
          fetchedRecipes = data;
        }

        setRecipes(fetchedRecipes.map(formatRecipe));
        setIsLoading(false);
      })
      .catch(err => {
        console.error("無法取得結果：", err);
        setRecipes([]);
        setIsLoading(false);
      });
  }, [currentQuery, isAuthenticated]);

  // 🚀 亮點 2：當資料載入完成，瞬間滾動回剛剛記憶的高度
  useEffect(() => {
    if (!isLoading && recipes.length > 0) {
      const savedScroll = sessionStorage.getItem('searchScrollPos');
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
          sessionStorage.removeItem('searchScrollPos');
        }, 50);
      }
    }
  }, [isLoading, recipes]);

  // 🚀 亮點 3：點擊卡片時，儲存現在的高度和搜尋字
  const handleCardClick = () => {
    sessionStorage.setItem('searchScrollPos', window.scrollY.toString());
    sessionStorage.setItem('searchQuery', currentQuery);
  };

  const handleSearchSubmit = () => {
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(inputValue)}`);
    setCurrentQuery(inputValue); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (val === '') {
      window.history.pushState({}, '', `/search?q=`);
      setCurrentQuery('');
    }
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 pb-20">
        <div className="bg-white p-10 rounded-3xl shadow-md max-w-md w-full text-center border border-gray-100">
          <div className="bg-yellow-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-3">會員專屬功能</h2>
          <p className="text-gray-500 font-medium mb-8">解鎖完整的智慧食譜庫、精準搜尋與私房收藏功能，請先登入會員喔！</p>
          <Link href="/login">
            <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-sm hover:-translate-y-1">前往登入</button>
          </Link>
          <div className="mt-6">
            <Link href="/"><span className="text-gray-400 hover:text-yellow-500 font-bold cursor-pointer text-sm transition-colors">返回首頁</span></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      <div className="bg-yellow-400 pt-16 pb-24 text-center text-white relative">
        {/* 🚀 亮點 4：在左上角加入真正的返回鍵 (回上一頁歷史) */}
        <button 
          onClick={() => window.history.back()} 
          className="absolute top-6 left-6 bg-yellow-500 hover:bg-yellow-600 text-white p-2 md:p-3 rounded-full transition-all shadow-sm z-50"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
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
            onChange={handleInputChange} 
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
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-100 pb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">
              {currentQuery ? `「${currentQuery}」的搜尋結果` : "所有食譜"} 
              <span className="text-gray-400 text-sm font-normal ml-3">共 {sortedRecipes.length} 筆</span>
            </h2>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
                showFilters || activeFilterCount > 0 
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-300" 
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              進階篩選 {activeFilterCount > 0 && <span className="bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
            </button>
          </div>

          {showFilters && (
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-4 fade-in duration-200">
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
                    className="bg-white border border-gray-200 text-gray-700 rounded-xl focus:ring-yellow-400 focus:border-yellow-400 w-full p-3 font-medium outline-none"
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
                    className="bg-white border border-gray-200 text-gray-700 rounded-xl focus:ring-yellow-400 focus:border-yellow-400 w-full p-3 font-medium outline-none"
                    value={filterFavorited}
                    onChange={(e) => setFilterFavorited(e.target.value)}
                  >
                    <option value="all">全部食譜</option>
                    <option value="true">已收藏 ❤️</option>
                    <option value="false">未收藏</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-red-500 font-bold flex items-center gap-1 transition-colors">
                  <X className="h-4 w-4" /> 清除所有條件
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="w-full py-20 flex flex-col items-center text-yellow-500">
              <ChefHat className="h-16 w-16 animate-bounce mb-4" />
              <span className="font-bold tracking-widest text-lg">正在翻找食譜書...</span>
            </div>
          ) : sortedRecipes.length > 0 ? (
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {sortedRecipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                  {/* 🚀 把記憶高度的觸發器放在這 */}
                  <div onClick={handleCardClick} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full border border-gray-100 transform hover:-translate-y-1 relative">
                    
                    {recipe.isFavorited && (
                      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </div>
                    )}

                    <div className="relative h-48 w-full overflow-hidden">
                      <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-lg font-extrabold text-gray-800 mb-2 line-clamp-1 group-hover:text-yellow-600 transition-colors">
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
              <div className="bg-gray-50 rounded-full p-6 mb-6">
                <Frown className="h-16 w-16 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">找不到相關食譜</h3>
              <p className="text-gray-400 font-medium">換個關鍵字、減少篩選條件，或是試試看輸入「雞肉」吧！</p>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}