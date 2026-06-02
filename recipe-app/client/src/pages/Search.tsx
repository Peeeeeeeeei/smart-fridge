import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, ArrowLeft, Clock, Flame, Frown, ChefHat, Lock, SlidersHorizontal, X, Heart } from "lucide-react";
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
  if (isVeg && !cleanLabels.includes("素食")) cleanLabels.push("素食");

  return {
    id: recipeId,
    title: backendRecipe.title || backendRecipe.name || "美味神祕料理",
    description: backendRecipe.description || "點擊查看美味食譜詳細步驟與所需食材",
    imageUrl: backendRecipe.image_url || backendRecipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800",
    cookTime: backendRecipe.cook_time || "?", 
    difficulty: backendRecipe.difficulty || "未知", 
    labels: cleanLabels,
    isFavorited: savedFavs.includes(recipeId) || backendRecipe.is_favorited === true,
  };
};

export default function Search() {
  const { isAuthenticated: originalIsAuthenticated } = useAuth();
  const isAuthenticated = originalIsAuthenticated || !!localStorage.getItem("current_user_name");

  // 狀態
  const [inputValue, setInputValue] = useState(sessionStorage.getItem("searchQuery") || "");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [activeLabels, setActiveLabels] = useState<string[]>([]);
  const [activeMethods, setActiveMethods] = useState<string[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    const url = `${import.meta.env.VITE_API_URL}/api/recipes/search?q=${encodeURIComponent(inputValue)}&page_size=1000`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const list = (data?.results || data?.recipes || (Array.isArray(data) ? data : []));
        setRecipes(list.map(formatRecipe));
        setIsLoading(false);
      })
      .catch(() => { setRecipes([]); setIsLoading(false); });
  }, [inputValue, isAuthenticated]);

  // 滾動記憶
  useEffect(() => {
    if (!isLoading && recipes.length > 0) {
      const savedScroll = sessionStorage.getItem('searchScrollPos');
      if (savedScroll) {
        setTimeout(() => { window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' }); sessionStorage.removeItem('searchScrollPos'); }, 50);
      }
    }
  }, [isLoading, recipes]);

  const toggleLabel = (label: string) => setActiveLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  const toggleMethod = (method: string) => setActiveMethods(prev => prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]);

  const filteredRecipes = recipes.filter(r => {
    const matchLabels = activeLabels.length === 0 || activeLabels.some(u => r.labels?.some((d: string) => u.includes(d) || d.includes(u)));
    const matchMethods = activeMethods.length === 0 || activeMethods.some(u => r.cookMethods?.some((d: string) => u.includes(d) || d.includes(u)));
    const matchDiff = filterDifficulty === "all" || r.difficulty === filterDifficulty;
    return matchLabels && matchMethods && matchDiff;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <div className="bg-yellow-400 pt-16 pb-24 text-center text-white relative">
        <button onClick={() => window.history.back()} className="absolute top-6 left-6 bg-yellow-500 p-2 rounded-full"><ArrowLeft /></button>
        <h1 className="text-4xl font-extrabold mb-4">尋找美味食譜</h1>
      </div>

      <main className="container mx-auto px-4 max-w-6xl -mt-10">
        <div className="bg-white rounded-full p-2 flex items-center shadow-lg mb-8 mx-auto max-w-3xl border border-gray-100">
          <SearchIcon className="text-yellow-400 ml-6 h-6 w-6" />
          <input
            placeholder="搜尋食譜..."
            className="bg-transparent flex-1 mx-4 outline-none text-lg"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); sessionStorage.setItem("searchQuery", e.target.value); }}
          />
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border mb-8">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 font-bold"><SlidersHorizontal /> 進階篩選</button>
            {showFilters && (
                <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {RECIPE_LABELS.map(l => <button key={l} onClick={() => toggleLabel(l)} className={`px-3 py-1 rounded-full text-xs font-bold border ${activeLabels.includes(l) ? 'bg-yellow-400 text-white' : 'bg-gray-50'}`}>#{l}</button>)}
                    </div>
                </div>
            )}
        </div>

        {isLoading ? <div className="text-center font-bold">搜尋中...</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                <div onClick={() => sessionStorage.setItem('searchScrollPos', window.scrollY.toString())} className="bg-white rounded-3xl p-5 shadow-md cursor-pointer">
                    <img src={recipe.imageUrl} className="w-full h-48 object-cover rounded-2xl mb-4" />
                    <h3 className="font-extrabold text-lg mb-2">{recipe.title}</h3>
                    <div className="flex flex-wrap gap-1 mb-3">
                        {recipe.labels.slice(0, 3).map((l: string, i: number) => <span key={i} className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded">#{l}</span>)}
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2">{recipe.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}