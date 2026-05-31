import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-yellow-400 pt-12 pb-8 px-8 text-black mt-auto w-full">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t-2 border-black/10 pt-8">
          
          {/* ================= Logo 區塊 ================= */}
          <div className="flex flex-col items-start">
            <div className="bg-white text-yellow-500 text-2xl font-extrabold border-2 border-transparent px-8 py-6 rounded-2xl shadow-inner mb-4 w-40 text-center">
              好食光
            </div>
          </div>
          
          {/* ================= 食譜導覽區塊 ================= */}
          <div>
            <h4 className="text-xl font-bold mb-4 border-b-2 border-black inline-block pb-1">食譜</h4>
            <ul className="space-y-3 font-medium opacity-80">
              <Link href="/recipes"><li className="hover:opacity-100 cursor-pointer">所有食譜</li></Link>
              <Link href="/search"><li className="hover:opacity-100 cursor-pointer">尋找食譜</li></Link>
              <Link href="/fridge"><li className="hover:opacity-100 cursor-pointer">我的冰箱</li></Link>
            </ul>
          </div>

          {/* ================= 關於我們區塊 ================= */}
          <div>
            <h4 className="text-xl font-bold mb-4 border-b-2 border-black inline-block pb-1">關於我們</h4>
            <ul className="space-y-3 font-medium opacity-80">
              <Link href="/about"><li className="hover:opacity-100 cursor-pointer">團隊介紹</li></Link>
            </ul>
          </div>

        </div>

        {/* 統一的版權宣告，讓畫面更完整 */}
        <div className="text-center mt-12 pt-4 border-t border-black/10 opacity-70 font-medium text-sm">
          &copy; 2026 好食光 - 食譜查詢與冰箱管理系統
        </div>
      </div>
    </footer>
  );
}