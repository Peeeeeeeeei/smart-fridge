import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { User, Lock, ChefHat, Edit2, Save, X, ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated: originalIsAuthenticated } = useAuth();
  
  const storedName = localStorage.getItem("current_user_name");
  const currentUserId = localStorage.getItem("current_user_id") || "001";
  const isAuthenticated = originalIsAuthenticated || !!storedName;

  // 狀態管理
  const [userData, setUserData] = useState({
    username: storedName || "未知使用者",
    password: "********", // 為了安全，密碼預設遮蔽
    skillLevel: "新手" 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editSkillLevel, setEditSkillLevel] = useState("新手");
  const [isSaving, setIsSaving] = useState(false);

  // 1. 抓取個人資料
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    
    // 呼叫後端取得使用者資料
    fetch(`${import.meta.env.VITE_API_URL}/api/users/${currentUserId}`)
      .then(res => {
        if (!res.ok) throw new Error("無法取得資料");
        return res.json();
      })
      .then(data => {
        setUserData({
          username: data.username || data.name || storedName || "大廚",
          password: "********", 
          skillLevel: data.skill_level || data.level || "新手"
        });
        setEditSkillLevel(data.skill_level || data.level || "新手");
        setIsLoading(false);
      })
      .catch(err => {
        console.error("讀取個人資料失敗:", err);
        setIsLoading(false);
      });
  }, [isAuthenticated, currentUserId, setLocation]);

  // 2. 儲存修改的程度
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${currentUserId}/skill`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_level: editSkillLevel })
      });

      if (!response.ok) throw new Error("儲存失敗");

      // 儲存成功後更新畫面狀態
      setUserData(prev => ({ ...prev, skillLevel: editSkillLevel }));
      setIsEditing(false);
      alert("🎉 廚藝程度已成功更新！");
    } catch (error) {
      console.error("更新失敗:", error);
      alert("更新失敗，請檢查網路連線或稍後再試！");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ChefHat className="h-12 w-12 text-yellow-400 animate-bounce" />
      </div>
    );
  }

  // 💡 為了畫面安全，先準備好安全的使用者名稱，避免 undefined 崩潰
  const safeUsername = userData?.username || "大廚";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 pb-24">
      {/* 頂部導覽列 */}
      <div className="bg-yellow-400 pt-8 pb-16 px-4 shadow-md">
        <div className="container mx-auto max-w-2xl relative">
          <Link href="/">
            <button className="absolute left-0 top-1/2 -translate-y-1/2 text-white/90 hover:text-white transition-colors flex items-center gap-1 font-bold">
              <ArrowLeft className="h-5 w-5" /> 回首頁
            </button>
          </Link>
          <h1 className="text-3xl font-extrabold text-white text-center flex items-center justify-center gap-2 tracking-wide">
            <User className="h-7 w-7" /> 個人資料
          </h1>
        </div>
      </div>

      <main className="container mx-auto px-4 -mt-8 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-tr from-yellow-300 to-orange-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-4">
              {/* 🚀 加入防護罩：確保抓得到字串才執行 charAt(0) */}
              <span className="text-4xl text-white font-black">{safeUsername.charAt(0)}</span>
            </div>
            <h2 className="text-2xl font-black text-gray-800">{safeUsername}</h2>
            <p className="text-gray-400 font-medium mt-1">智慧冰箱專屬會員</p>
          </div>

          <div className="space-y-6">
            {/* 帳號欄位 */}
            <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-400 mb-0.5">使用者帳號</p>
                <p className="font-extrabold text-gray-700 text-lg">{safeUsername}</p>
              </div>
            </div>

            {/* 密碼欄位 (基於資安不提供明文與直接修改) */}
            <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="bg-slate-200 p-3 rounded-xl mr-4">
                <Lock className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-400 mb-0.5">密碼</p>
                <p className="font-extrabold text-gray-700 text-lg tracking-widest">{userData?.password || "********"}</p>
              </div>
            </div>

            {/* 廚藝程度欄位 (可編輯) */}
            <div className="flex items-center p-4 bg-orange-50 rounded-2xl border border-orange-100 transition-all">
              <div className="bg-orange-200 p-3 rounded-xl mr-4">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-bold text-orange-400 mb-0.5">廚藝程度</p>
                {isEditing ? (
                  <select 
                    className="w-full bg-white border border-orange-200 text-gray-700 font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 mt-1"
                    value={editSkillLevel}
                    onChange={(e) => setEditSkillLevel(e.target.value)}
                  >
                    <option value="廚房新手">🐣 廚房新手 (少開伙)</option>
                    <option value="家常廚神">🍳 家常廚神 (能煮一桌菜)</option>
                    <option value="特級大廚">👨‍🍳 特級大廚 (精通各種料理)</option>
                  </select>
                ) : (
                  <p className="font-extrabold text-gray-800 text-lg">{userData?.skillLevel || "新手"}</p>
                )}
              </div>

              {/* 編輯 / 儲存 按鈕 */}
              <div className="ml-4 flex gap-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditSkillLevel(userData.skillLevel); // 恢復原狀
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      title="取消"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="p-2 bg-orange-400 hover:bg-orange-500 text-white rounded-full shadow-sm transition-all hover:scale-105 disabled:opacity-50"
                      title="儲存"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors flex items-center gap-1 text-sm font-bold px-4"
                  >
                    <Edit2 className="h-4 w-4" /> 修改
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}