import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Clock, Flame, Users, Leaf, CheckCircle2, ChefHat, Heart, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function RecipeDetail({ params }: { params?: { id: string } }) {
  // 🚀 1. 取得登入狀態與「目前登入者的 ID」
  const { user, isAuthenticated: originalIsAuthenticated } = useAuth();
  const isAuthenticated = originalIsAuthenticated || !!localStorage.getItem("current_user_name");
  const currentUserId = localStorage.getItem("current_user_id") || "guest"; 

  const recipeId = params?.id; 
  
  const [isFavorited, setIsFavorited] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 💡 沒登入的話，就不去後端要資料，節省資源
    if (!isAuthenticated || !recipeId) return;

    // 1. 檢查這道食譜是否已經在專屬的 localStorage 收藏清單中
    const savedFavs = JSON.parse(localStorage.getItem(`favorites_${currentUserId}`) || '[]');
    if (savedFavs.includes(recipeId)) {
      setIsFavorited(true);
    }
    
    // 2. 向本機後端請求「單一食譜」的詳細資料
    setIsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/recipes/${recipeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("找不到該食譜");
        return res.json();
      })
      .then((data) => {
        setRecipe(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setIsLoading(false);
      });
  }, [recipeId, isAuthenticated, currentUserId]);

  // 🚀 點擊愛心的切換功能 
  const toggleFavorite = () => {
    const savedFavs = JSON.parse(localStorage.getItem(`favorites_${currentUserId}`) || '[]');
    
    if (isFavorited) {
      // 取消收藏
      const newFavs = savedFavs.filter((id: string) => id !== recipeId);
      localStorage.setItem(`favorites_${currentUserId}`, JSON.stringify(newFavs));
      setIsFavorited(false);
    } else {
      // 加入收藏
      savedFavs.push(recipeId);
      localStorage.setItem(`favorites_${currentUserId}`, JSON.stringify(savedFavs));
      setIsFavorited(true);
    }
  };

  // 處理後端傳來的步驟字串
  const parseSteps = (stepsString: string) => {
    if (!stepsString) return [];
    return stepsString.split('\n').filter(step => step.trim() !== '');
  };

  // 🚀 2. 登入防護牆
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-yellow-500">
        <ChefHat className="h-16 w-16 animate-bounce mb-4" />
        <span className="text-xl font-bold tracking-widest">大廚正在為您準備食譜...</span>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-gray-500">
        <div className="text-6xl mb-4">🙄</div>
        <h2 className="text-2xl font-bold mb-4">找不到這道食譜</h2>
        <Link href="/recipes">
          <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-full shadow-sm">
            返回食譜列表
          </button>
        </Link>
      </div>
    );
  }

  const stepsList = parseSteps(recipe.steps);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 pb-20">
      
      {/* ================= 頂部導覽列 ================= */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center gap-2 text-gray-500 hover:text-yellow-500 font-bold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" /> 返回
          </button>
          <h1 className="font-extrabold text-gray-700 truncate px-4">{recipe.title}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        
        {/* ================= 上半部：主視覺與摘要 ================= */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden mb-8 flex flex-col md:flex-row">
          {/* 左側圖片 */}
          <div className="w-full md:w-1/2 h-64 md:h-auto relative">
            <img 
              src={recipe.image_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800"} 
              alt={recipe.title} 
              className="w-full h-full object-cover"
            />
            {/* 💡 已將原本浮在圖片左上角的素食標籤移除了 */}
          </div>

          {/* 右側資訊 */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
            
            {/* 💡 標籤 (Labels) 與搬家後的素食標籤 */}
            {((recipe.labels && recipe.labels.length > 0) || recipe.is_vegetarian) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.labels && recipe.labels.map((label: string, idx: number) => (
                  <span key={idx} className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-md">
                    #{label}
                  </span>
                ))}
                
                {/* 💡 統一排在這裡的精緻版綠色素食標籤 */}
                {recipe.is_vegetarian && (
                  <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded-md border border-green-200 flex items-center gap-1">
                    <Leaf className="h-3.5 w-3.5" /> 素食可
                  </span>
                )}
              </div>
            )}

            {/* 🌟 標題與愛心按鈕 */}
            <div className="flex justify-between items-start mb-6 gap-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 leading-tight">
                {recipe.title}
              </h1>
              <button 
                onClick={toggleFavorite}
                className="bg-gray-50 hover:bg-red-50 p-3 rounded-full transition-colors flex-shrink-0"
              >
                <Heart className={`h-8 w-8 transition-colors ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
              </button>
            </div>

            {/* 快速資訊 Bar */}
            <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
              <div className="flex flex-col items-center text-center">
                <Clock className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-sm text-gray-500 font-medium">時間</span>
                <span className="font-bold text-gray-700">{recipe.cook_time || "?"} 分鐘</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-r border-gray-100">
                <Flame className="h-6 w-6 text-orange-400 mb-1" />
                <span className="text-sm text-gray-500 font-medium">難度</span>
                <span className="font-bold text-gray-700">{recipe.difficulty || "未知"}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Users className="h-6 w-6 text-blue-400 mb-1" />
                <span className="text-sm text-gray-500 font-medium">份量</span>
                <span className="font-bold text-gray-700">{recipe.servings || "?"} 人份</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 下半部：食材與步驟 ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 左欄：食材清單 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-extrabold text-gray-800 mb-6 border-b-2 border-yellow-400 pb-2 inline-block">
                所需食材
              </h2>
              <ul className="space-y-4">
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((item: any, index: number) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="font-bold text-gray-700">{item.name}</span>
                      <span className="text-gray-500 font-medium">
                        {item.amount && item.amount !== "0.00" ? Number(item.amount) : ""} {item.unit !== "適量" && item.unit !== "少許" ? item.unit : item.unit}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 text-center py-4">無食材資料</li>
                )}
              </ul>
            </div>
          </div>

          {/* 右欄：料理步驟 */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl shadow-md p-6 md:p-8">
              <h2 className="text-2xl font-extrabold text-gray-800 mb-8 border-b-2 border-yellow-400 pb-2 inline-block">
                料理步驟
              </h2>
              
              <div className="space-y-8">
                {stepsList.length > 0 ? (
                  stepsList.map((step, index) => {
                    const cleanStep = step.replace(/^\d+[:.：]\s*/, '');
                    
                    return (
                      <div key={index} className="flex gap-4 group">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 font-extrabold flex items-center justify-center ring-4 ring-white group-hover:bg-yellow-400 group-hover:text-white transition-colors">
                            {index + 1}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 md:p-5 rounded-2xl flex-grow border border-gray-100 group-hover:border-yellow-200 transition-colors">
                          <p className="text-gray-700 leading-relaxed font-medium">
                            {cleanStep}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-gray-400 font-bold">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    目前沒有詳細步驟
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}