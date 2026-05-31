import { useState } from "react";
import { Link } from "wouter";
import { ChefHat, ArrowRight, AlertCircle, Mail, Lock, User, Flame } from "lucide-react"; // 💡 新增了 Flame 圖示

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); 
  const [cookingLevel, setCookingLevel] = useState("新手"); // 🚀 新增：預設程度為新手
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("請填寫信箱與密碼");
      return;
    }
    if (!isLoginMode && !username.trim()) {
      setError("請為自己取個好聽的暱稱");
      return;
    }

    setIsLoading(true);
    setError("");

    const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";
    
    // 🚀 註冊時，把 cookingLevel 一起打包送給後端
    const payload = isLoginMode 
      ? { email, password } 
      : { email, password, username, cooking_level: cookingLevel };

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || (isLoginMode ? "登入失敗" : "註冊失敗"));
      }

      if (isLoginMode) {
        // 登入成功
        localStorage.setItem("current_user_id", data.user.user_id);
        localStorage.setItem("current_user_name", data.user.username);
        localStorage.setItem("cooking_level", data.user.cooking_level); // 把程度也存下來備用
        window.location.href = "/";
      } else {
        // 註冊成功
        setIsLoginMode(true);
        setError("🎉 註冊成功！請使用剛剛設定的密碼登入。");
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg max-w-md w-full border border-gray-100 transition-all duration-300">
        
        <div className="bg-yellow-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <ChefHat className="h-10 w-10 text-white" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-800 mb-2 text-center tracking-wide">
          {isLoginMode ? "歡迎回到好食光" : "加入好食光"}
        </h2>
        <p className="text-gray-500 font-medium mb-8 text-center">
          {isLoginMode ? "登入您的專屬智慧廚房" : "建立帳號，開始您的料理旅程"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 註冊模式才顯示的欄位 */}
          {!isLoginMode && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">專屬暱稱</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="例如：特級廚師小當家"
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-lg"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* 🚀 新增：烹飪程度選擇器 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">您的烹飪經驗</label>
                <div className="relative">
                  <Flame className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-lg appearance-none cursor-pointer text-gray-600"
                    value={cookingLevel}
                    onChange={(e) => setCookingLevel(e.target.value)}
                  >
                    <option value="新手">🐣 料理新手 (偶爾下廚 / 想開始學)</option>
                    <option value="一般">🍳 一般玩家 (能照著食譜做出家常菜)</option>
                    <option value="熟練">🔥 特級大廚 (廚房是我的遊樂場)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">電子信箱</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">密碼</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="password"
                placeholder="請輸入密碼"
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 ${error.includes("成功") ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1 flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:hover:translate-y-0 mt-2"
          >
            {isLoading ? "處理中..." : (isLoginMode ? "登入" : "註冊帳號")} <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-gray-500 font-medium mb-3">
            {isLoginMode ? "還沒有帳號嗎？" : "已經有帳號了？"}
            <button 
              onClick={() => { setIsLoginMode(!isLoginMode); setError(""); }}
              className="text-yellow-500 hover:text-yellow-600 font-extrabold ml-2"
            >
              {isLoginMode ? "立即註冊" : "返回登入"}
            </button>
          </p>
          <Link href="/">
            <span className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer transition-colors text-sm">
              先去首頁逛逛
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}