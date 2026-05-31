import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, Heart, Refrigerator, Sparkles, Lightbulb, Target } from "lucide-react";

export default function About() {
  // 將你的特色陣列加上專屬的色彩設定，讓畫面更活潑
  const features = [
    {
      icon: <ChefHat className="h-8 w-8 text-yellow-600" />,
      bgClass: "bg-yellow-100",
      borderClass: "border-t-4 border-yellow-400",
      title: "豐富食譜庫",
      description: "收錄各國經典料理，從家常菜到異國風味，每道食譜都附有詳細步驟說明。",
    },
    {
      icon: <Refrigerator className="h-8 w-8 text-blue-600" />,
      bgClass: "bg-blue-100",
      borderClass: "border-t-4 border-blue-400",
      title: "智慧冰箱管理",
      description: "輕鬆管理冰箱食材庫存，追蹤保存期限，減少食物浪費。",
    },
    {
      icon: <Sparkles className="h-8 w-8 text-orange-600" />,
      bgClass: "bg-orange-100",
      borderClass: "border-t-4 border-orange-400",
      title: "個人化推薦",
      description: "根據您冰箱現有食材，智慧推薦可烹飪的食譜，讓每餐都有新靈感。",
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      bgClass: "bg-red-100",
      borderClass: "border-t-4 border-red-400",
      title: "收藏與記錄",
      description: "收藏喜愛的食譜，記錄烹飪歷史，打造專屬的美食日記。",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col">
      
      {/* ================= Hero：頂部視覺 ================= */}
      <div className="bg-yellow-400 pt-16 pb-28 px-4 shadow-md text-center">
        <div className="container mx-auto max-w-4xl text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest drop-shadow-sm mb-4">
            關於我們
          </h1>
          <p className="font-bold opacity-90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            「好食光」致力於讓每個人都能輕鬆享受烹飪的樂趣。<br/>
            我們相信，美好的一餐不僅是味蕾的饗宴，更是生活中值得珍惜的時光。
          </p>
        </div>
      </div>

      {/* ================= 主要內容區 ================= */}
      {/* 💡 加上 flex-grow 撐開空間，並加上 mb-24 確保底部留有舒適間距 */}
      <main className="container mx-auto max-w-5xl px-4 -mt-16 space-y-16 flex-grow mb-24">
        
        {/* 區塊 1：我們的使命 */}
        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm mb-2">
                <Lightbulb className="h-4 w-4" /> 我們的使命
              </div>
              <h2 className="text-3xl font-extrabold text-gray-800">讓烹飪不再是一件令人頭疼的事</h2>
              <p className="text-lg text-gray-600 leading-relaxed font-medium">
                無論您是廚房新手還是料理達人，「好食光」都能成為您最好的烹飪夥伴。從食材管理到食譜推薦，從步驟指引到烹飪記錄，我們用心打造每一個功能，只為讓您的每一餐都充滿好食光。
              </p>
            </div>
            <div className="flex-1 w-full flex justify-center">
              <div className="w-64 h-64 bg-yellow-50 rounded-full flex items-center justify-center border-8 border-yellow-400/20 shadow-inner">
                <Target className="h-32 w-32 text-yellow-400" />
              </div>
            </div>
          </div>
        </section>

        {/* 區塊 2：我們的特色 */}
        <section>
          <h2 className="text-3xl font-extrabold text-center mb-10 tracking-wide text-gray-800">系統特色亮點</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl ${feature.borderClass} overflow-hidden`}
              >
                <CardContent className="p-8 flex gap-5 items-start">
                  <div className={`flex-shrink-0 h-16 w-16 rounded-2xl ${feature.bgClass} flex items-center justify-center shadow-sm`}>
                    {feature.icon}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-extrabold text-gray-800 text-xl mb-2">{feature.title}</h3>
                    <p className="text-base text-gray-500 font-medium leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

      </main>

    </div>
  );
}