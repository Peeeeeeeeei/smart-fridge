import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, ArrowRight, Sparkles, Refrigerator, ChefHat, Heart, ChevronRight, Clock, Flame } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const formatRecipe = (backendRecipe: any) => {
  return {
    id: backendRecipe.recipe_id || backendRecipe.id || Math.random().toString(),
    title: backendRecipe.title || backendRecipe.name || "美味神祕料理",
    description: backendRecipe.description || "", // 💡 已經拿掉步驟，這裡可以直接留空
    imageUrl: backendRecipe.image_url || backendRecipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800",
    matchCount: backendRecipe.match_count || null, 
    labels: backendRecipe.labels || "", 
    cookTime: backendRecipe.cook_time || "15", // 給個預設時間
    difficulty: backendRecipe.difficulty || "簡單", // 給個預設難度
  };
};

const TAGS = [
  "飯與粥品", 
  "麵食與冬粉", 
  "湯品與鍋物", 
  "肉類料理", 
  "海鮮料理", 
  "蔬菜與蛋豆", 
  "炸物", 
  "小吃與早午餐", 
  "日韓與異國風味", 
  "甜點與飲品", 
  "常備菜與風味醬料"
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated: originalIsAuthenticated } = useAuth();
  
  const [realRecipes, setRealRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([]);
  const [isLoadingFavs, setIsLoadingFavs] = useState(true);

  const storedName = localStorage.getItem("current_user_name");
  const isAuthenticated = originalIsAuthenticated || !!storedName;
  const displayUser = isAuthenticated ? (user || { name: storedName || "大廚" }) : null;

  // 🚀 1. 抓取推薦食譜 (自動判斷登入狀態)
  useEffect(() => {
    setIsLoading(true);
    
    const currentUserId = user?.id || localStorage.getItem("current_user_id"); 
    
    const recommendUrl = isAuthenticated 
      ? `${import.meta.env.VITE_API_URL}/api/recipes/home?user_id=${currentUserId}&limit=10`
      : `${import.meta.env.VITE_API_URL}/api/recipes/home?limit=10`;

    fetch(recommendUrl)
      .then((res) => {
        if (!res.ok) throw new Error("後端推薦 API 發生錯誤");
        return res.json();
      })
      .then((data) => {
        let recipes: any[] = [];
        
        // 💡 終極防護網：不管後端傳什麼格式（直接陣列、或是包裝在 recommended/popular/results 裡），我們全都要！
        if (Array.isArray(data)) {
          recipes = data;
        } else if (data?.recommended && Array.isArray(data.recommended)) {
          recipes = data.recommended;
        } else if (data?.popular && Array.isArray(data.popular)) {
          recipes = data.popular;
        } else if (data?.results && Array.isArray(data.results)) {
          recipes = data.results;
        }

        if (recipes.length > 0) {
          setRealRecipes(recipes.map(formatRecipe));
          setIsLoading(false);
        } else {
          throw new Error("沒有推薦資料"); // 如果真的是空資料庫，就會跳進這裡
        }
      })
      .catch((error) => {
        console.warn("⚠️ 推薦功能失效，啟動備用方案：", error);
        setIsFallback(true); 
        
        fetch(`${import.meta.env.VITE_API_URL}/api/recipes/?page_size=10`)
          .then(res => res.json())
          .then(fallbackData => {
            let fallbackRecipes: any[] = [];
            // 💡 備用方案也加上防護
            if (Array.isArray(fallbackData)) {
               fallbackRecipes = fallbackData;
            } else if (fallbackData?.results && Array.isArray(fallbackData.results)) {
              fallbackRecipes = fallbackData.results;
            }
            setRealRecipes(fallbackRecipes.map(formatRecipe));
            setIsLoading(false);
          })
          .catch(err => {
            console.error("備用方案也失敗：", err);
            setIsLoading(false);
          });
      });
  }, [isAuthenticated, user]);

  // 🚀 2. 抓取「我的收藏」食譜 (僅限登入狀態)
  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteRecipes([]);
      setIsLoadingFavs(false);
      return;
    }

    const currentUserId = localStorage.getItem("current_user_id") || "guest";
    const savedFavs = JSON.parse(localStorage.getItem(`favorites_${currentUserId}`) || '[]');
    if (savedFavs.length === 0) {
      setFavoriteRecipes([]);
      setIsLoadingFavs(false);
      return;
    }

    setIsLoadingFavs(true);
    Promise.all(
      savedFavs.map((id: string) =>
        fetch(`${import.meta.env.VITE_API_URL}/api/recipes/${id}`)
          .then(res => res.ok ? res.json() : null)
      )
    )
    .then(results => {
      const validRecipes = results.filter(r => r !== null);
      setFavoriteRecipes(validRecipes.map(formatRecipe));
      setIsLoadingFavs(false);
    })
    .catch(err => {
      console.error("抓取收藏食譜失敗：", err);
      setIsLoadingFavs(false);
    });
  }, [isAuthenticated]);

  const handleSearch = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (!searchQuery.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col">
      {/* 💡 修改二：注入自訂的美化版捲軸 CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fcd34d; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #fbbf24; 
        }
      `}</style>

      <main className="flex-grow container mx-auto px-4 py-10 max-w-6xl">
        
        {/* ================= 搜尋列 ================= */}
        <div className="bg-yellow-400 rounded-full p-2 flex items-center shadow-lg shadow-yellow-400/20 mb-12 mx-auto max-w-3xl transform transition-transform hover:scale-[1.02] focus-within:scale-[1.02]">
          <Search className="text-white ml-6 h-8 w-8" />
          <input
            placeholder={isAuthenticated ? "今天想吃什麼呢？" : "請先登入，即可開始智慧搜尋食譜..."}
            disabled={!isAuthenticated} 
            className="bg-transparent text-white placeholder:text-yellow-100 flex-1 mx-4 outline-none text-xl font-medium disabled:opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
          <button 
            onClick={handleSearch}
            className="bg-white rounded-full p-3 text-yellow-400 hover:bg-yellow-50 transition-colors mr-1 shadow-sm"
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>

        {/* ================= 歡迎區塊 ================= */}
        {isAuthenticated ? (
          <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-3xl p-6 md:p-8 text-white mb-16 shadow-xl shadow-yellow-400/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm hidden sm:block">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-1.5 tracking-wide">
                  {displayUser?.name || "使用者"}，歡迎回到廚房！👋
                </h2>
                <p className="font-bold text-yellow-50/90 text-lg">
                  系統已成功連線您的智慧冰箱。今天想用冰箱裡的剩餘食材做些什麼料理呢？
                </p>
              </div>
            </div>
            <Link href="/fridge">
              <button className="bg-white text-amber-600 font-extrabold px-6 py-4 rounded-2xl shadow-md hover:bg-yellow-50 transition-all hover:scale-105 flex items-center gap-2 shrink-0 text-lg">
                <Refrigerator className="h-5 w-5" />
                檢查我的冰箱庫存
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center mb-16">
            <h2 className="text-xl font-extrabold text-gray-700 mb-2 tracking-wide">💡 想要解鎖更聰明的智慧下廚體驗嗎？</h2>
            <p className="text-gray-500 font-bold mb-4">立即登入即可啟用「智慧冰箱剩餘食材管理」與「個人化精準食譜推薦」功能！</p>
            <Link href="/login">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-extrabold py-2.5 px-8 rounded-full transition-colors shadow-sm text-sm tracking-wider">
                立即登入體驗
              </button>
            </Link>
          </div>
        )}

        {/* ================= 推薦食譜 ================= */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-4 px-2">
            <div>
              <h2 className="text-3xl font-bold tracking-wide flex items-baseline gap-2">
                {isAuthenticated ? "為您推薦" : "推薦食譜"}
                <span className="text-base font-normal text-gray-400 tracking-normal hidden sm:inline-block">
                  {isAuthenticated 
                    ? "(已自動優先比對冰箱剩餘食材)" 
                    : "(為您推薦 10 道熱門美味料理)"}
                </span>
              </h2>
              <div className="flex items-center text-gray-400 text-sm font-bold mt-2 animate-pulse">
                <span className="hidden sm:inline">向右滑動查看更多食譜</span>
                <span className="sm:hidden">滑動查看更多</span>
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </div>
            </div>
            
            <Link href="/recipes">
              <span className="text-gray-400 hover:text-yellow-500 font-medium cursor-pointer flex items-center gap-1 shrink-0 mb-6">
                查看所有食譜 <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
          
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 px-2 snap-x snap-mandatory custom-scrollbar">
            {isLoading ? (
              <div className="w-full text-center py-16 flex flex-col items-center text-yellow-500">
                <ChefHat className="h-12 w-12 animate-bounce mb-4" />
                <span className="text-lg font-bold tracking-widest">系統正在準備食譜...</span>
              </div>
            ) : realRecipes.length > 0 ? (
              realRecipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                  {/* 💡 全新直式卡片設計 (與 Recipes.tsx 一致) */}
                  <div className="flex-none w-64 snap-center cursor-pointer group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full border border-gray-100">
                    
                    {/* 圖片區域 */}
                    <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* 匹配度標籤 (如果有) */}
                      {isAuthenticated && recipe.matchCount && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center shadow-md">
                          🎯 匹配 {recipe.matchCount} 項
                        </div>
                      )}
                    </div>

                    {/* 內容區域 */}
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-yellow-600 transition-colors" title={recipe.title}>
                        {recipe.title}
                      </h3>

                      {recipe.labels && (
                        <div className="mb-3">
                          <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-md border border-yellow-200/50">
                            #{recipe.labels.split(',')[0]}
                          </span>
                        </div>
                      )}

                      <div className="flex-grow"></div>

                      {/* 底部時間與難度 */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 font-semibold mt-auto pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-yellow-500" />
                          <span>{recipe.cookTime} 分鐘</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>{recipe.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="w-full text-center py-10 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                目前資料庫中尚無食譜，請提醒後端同學新增測試資料喔！
              </div>
            )}
          </div>
        </section>

        {/* ================= 我的私房收藏 ================= */}
        {isAuthenticated && !isLoadingFavs && favoriteRecipes.length > 0 && (
          <section className="mb-16 bg-red-50/50 rounded-3xl p-6 md:p-8 border border-red-100">
            <div className="flex justify-between items-end mb-4 px-2">
              <div>
                <h2 className="text-3xl font-bold tracking-wide flex items-center gap-3 text-gray-800">
                  <Heart className="h-8 w-8 text-red-500 fill-red-500" /> 
                  我的私房收藏
                </h2>
                <div className="flex items-center text-red-400/80 text-sm font-bold mt-2 animate-pulse">
                  <span className="hidden sm:inline">向右滑動查看更多收藏</span>
                  <span className="sm:hidden">滑動查看更多</span>
                  <ChevronRight className="h-4 w-4 ml-0.5" />
                </div>
              </div>
            </div>
            
            <div className="flex overflow-x-auto gap-6 pb-6 pt-2 px-2 snap-x snap-mandatory custom-scrollbar">
              {favoriteRecipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                  {/* 💡 全新直式卡片設計 (與上方推薦區塊一致，維持視覺統整) */}
                  <div className="flex-none w-64 snap-center cursor-pointer group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full border border-red-50">
                    
                    <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* 收藏愛心標記 */}
                      <div className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-red-500 transition-colors" title={recipe.title}>
                        {recipe.title}
                      </h3>

                      {recipe.labels && (
                        <div className="mb-3">
                          <span className="inline-block bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-md border border-red-100">
                            #{recipe.labels.split(',')[0]}
                          </span>
                        </div>
                      )}

                      <div className="flex-grow"></div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 font-semibold mt-auto pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-yellow-500" />
                          <span>{recipe.cookTime} 分鐘</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>{recipe.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ================= 標籤分類 ================= */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold tracking-wide mb-8 px-2">你可能會喜歡...</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 px-2 custom-scrollbar">
            {TAGS.map((tag, index) => (
              <div 
                key={index}
                className="flex-none px-8 py-4 rounded-full bg-yellow-400 text-white flex items-center justify-center text-lg font-bold cursor-pointer shadow-md hover:bg-yellow-500 hover:shadow-lg transition-all transform hover:-translate-y-1 whitespace-nowrap"
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = "/login";
                    return;
                  }
                  window.location.href = `/recipes?label=${encodeURIComponent(tag)}`; 
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}