import { useState, useEffect, FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Refrigerator,
  Search,
  Plus,
  AlertCircle,
  Clock,
  Snowflake,
  Thermometer,
  Package,
  ChefHat,
  Trash2,
  X,
  Edit2,
  Calendar,
  Filter
} from "lucide-react";

const formatFridgeItem = (backendItem: any) => {
  const itemName = backendItem.ingredient_name || backendItem.name || "未知食材";
  const expiryStr = backendItem.expiration_date || backendItem.expired_at;
  
  let daysLeft: number | null = null; 
  let displayExpiryDate = "未設定";

  if (expiryStr && expiryStr !== "未設定" && expiryStr !== "null") {
    const expiryDate = new Date(expiryStr);
    if (!isNaN(expiryDate.getTime())) {
      const today = new Date();
      
      expiryDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const diffTime = expiryDate.getTime() - today.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const yyyy = expiryDate.getFullYear();
      const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
      const dd = String(expiryDate.getDate()).padStart(2, '0');
      displayExpiryDate = `${yyyy}-${mm}-${dd}`;
    }
  }
  
  let status = "safe";
  if (daysLeft === null) {
    status = "neutral";
  } else if (daysLeft <= 2) {
    status = "danger";
  } else if (daysLeft <= 5) {
    status = "warning";
  }

  return {
    id: backendItem.ingredient_id || backendItem.id || Math.random().toString(),
    name: itemName,
    location: backendItem.storage_location || backendItem.location || "冷藏",
    amount: backendItem.amount || backendItem.quantity || 0,
    unit: backendItem.unit || "份",
    daysLeft: daysLeft,
    status: status,
    expirationDate: displayExpiryDate,
  };
};

export default function Fridge() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://smart-fridge-api-0fi3.onrender.com";

  const { user, isAuthenticated: originalIsAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const storedName = localStorage.getItem("current_user_name");
  const isAuthenticated = originalIsAuthenticated || !!storedName;
  const currentUserId = localStorage.getItem("current_user_id") || "001"; 

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("全部"); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState<number | "">("");
  const [newItemUnit, setNewItemUnit] = useState("顆"); // 💡 修正了原本錯誤的初始值
  const [newItemLocation, setNewItemLocation] = useState("冷藏");
  const [newItemExpiration, setNewItemExpiration] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const fetchFridgeData = () => {
    setIsLoading(true);
    fetch(`${API_BASE_URL}/api/fridge/?user_id=${currentUserId}`)
      .then((res) => {
        if (!res.ok) throw new Error("網路連線異常");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data.map(formatFridgeItem));
        } else if (data && data.items && Array.isArray(data.items)) {
          setItems(data.items.map(formatFridgeItem));
        } else {
          setItems([]);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("無法取得冰箱資料：", error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isAuthenticated) fetchFridgeData();
  }, [isAuthenticated, currentUserId]); 

  const openAddModal = () => {
    setModalMode("add");
    setEditTargetId(null);
    setNewItemName("");
    setNewItemAmount("");
    setNewItemUnit("顆");
    setNewItemLocation("冷藏");
    setNewItemExpiration("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setModalMode("edit");
    setEditTargetId(item.id);
    setNewItemName(item.name);
    setNewItemAmount(item.amount);
    setNewItemUnit(item.unit);
    setNewItemLocation(item.location || "冷藏");
    setNewItemExpiration(item.expirationDate !== "未設定" ? item.expirationDate : "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`確定要將「${name}」從冰箱移除嗎？`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/fridge/${id}?user_id=${currentUserId}`, {
        method: "DELETE",
      });
      if (response.ok) fetchFridgeData();
      else alert("刪除失敗，請稍後再試！");
    } catch (error) {
      console.error("刪除食材發生錯誤:", error);
      alert("網路連線發生錯誤！");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItemAmount || !newItemUnit) return;
    if (modalMode === "add" && !newItemName) return;

    setIsSubmitting(true);
    
    const payload: any = {
      user_id: currentUserId, 
      storage_location: newItemLocation,
      amount: Number(newItemAmount), 
      unit: newItemUnit
    };

    if (modalMode === "add") {
      payload.ingredient_name = newItemName;
      payload.ingredient_id = newItemName; 
    }

    if (newItemExpiration) {
      payload.expiration_date = newItemExpiration;
    } else {
      payload.expiration_date = null;
    }

    try {
      let response;
      if (modalMode === "add") {
        response = await fetch(`${API_BASE_URL}/api/fridge/?user_id=${currentUserId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/fridge/${editTargetId}?user_id=${currentUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        alert("🎉 食材儲存成功！");
        setIsModalOpen(false);
        fetchFridgeData();
      } else {
        const errorData = await response.json();
        alert(`連線失敗！後端說：\n${errorData.detail ? JSON.stringify(errorData.detail) : "未知的格式錯誤"}`);
      }
    } catch (error) {
      console.error("送出表單發生錯誤:", error);
      alert("網路連線發生錯誤，請檢查後端是否正常運作中！");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLocation = filterLocation === "全部" || item.location === filterLocation;
    return matchSearch && matchLocation;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "danger": return "text-red-600 bg-red-50 border-red-200";
      case "warning": return "text-orange-600 bg-orange-50 border-orange-200";
      case "safe": return "text-green-600 bg-green-50 border-green-200";
      case "neutral": return "text-gray-500 bg-gray-50 border-gray-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col pb-24 relative">
      <div className="bg-yellow-400 pt-12 pb-24 px-4 shadow-md text-center">
        <div className="container mx-auto max-w-4xl text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest drop-shadow-sm mb-4 flex items-center justify-center gap-3">
            <Refrigerator className="h-10 w-10 text-white fill-white/20" />
            我的智慧冰箱
          </h1>
          <p className="font-bold opacity-90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-yellow-50">
            隨時掌握食材保鮮期，為您推薦最適合的美味料理。
          </p>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 -mt-12 flex-grow">
        
        {/* ================= 控制面板 ================= */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border border-yellow-100">
          
          <div className="flex flex-col sm:flex-row gap-3 w-full flex-1">
            <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="搜尋冰箱內的食材..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white font-medium text-gray-600 cursor-pointer appearance-none"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <option value="全部">全部位置</option>
                <option value="冷藏">冷藏區</option>
                <option value="冷凍">冷凍庫</option>
                <option value="常溫">常溫區</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={openAddModal}
            className="w-full md:w-auto shrink-0 bg-orange-400 hover:bg-orange-500 text-white font-extrabold py-3 px-6 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-sm flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            新增食材
          </button>
        </div>

        {isLoading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-yellow-500">
            <ChefHat className="h-16 w-16 animate-bounce mb-4" />
            <span className="text-xl font-bold tracking-widest text-yellow-600">正在打開冰箱門...</span>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group relative flex flex-col justify-between">
                
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button 
                    onClick={() => openEditModal(item)}
                    className="text-gray-300 hover:text-blue-500 transition-colors p-2 bg-gray-50 hover:bg-blue-50 rounded-full"
                    title="修改食材"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-2 bg-gray-50 hover:bg-red-50 rounded-full"
                    title="刪除食材"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-start mb-2 pr-20">
                    <div>
                      <h3 className="text-2xl font-extrabold text-gray-800 mb-2">{item.name}</h3>
                      <span className="bg-yellow-50 text-yellow-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 inline-flex border border-yellow-200">
                        {item.location === '冷藏' ? <Thermometer className="h-3 w-3" /> : item.location === '冷凍' ? <Snowflake className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                        {item.location}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-orange-500 tracking-tighter">
                        {item.amount}<span className="text-sm text-gray-500 font-medium ml-1 tracking-normal">{item.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 font-semibold mb-4 flex items-center gap-1.5 px-1 mt-3">
                    <Calendar className="h-4 w-4 text-gray-300" />
                    有效期限：<span className="text-gray-600">{item.expirationDate}</span>
                  </div>
                </div>

                <div className={`mt-2 p-4 rounded-2xl border-2 flex items-center gap-3 ${getStatusColor(item.status)}`}>
                  {item.status === 'danger' ? <AlertCircle className="h-6 w-6 flex-shrink-0" /> : <Clock className="h-6 w-6 flex-shrink-0" />}
                  <span className="font-bold flex-1 text-sm md:text-base">
                    {item.daysLeft === null 
                      ? "未設定到期日" 
                      : item.daysLeft === 0 
                      ? "今天到期！請盡速食用" 
                      : item.daysLeft < 0 
                      ? `已過期 ${Math.abs(item.daysLeft)} 天` 
                      : `距離到期還有 ${item.daysLeft} 天`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-dashed border-gray-300">
            <Refrigerator className="h-20 w-20 mx-auto text-yellow-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-600 mb-2">冰箱空空如也</h3>
            <p className="text-gray-400 font-medium max-w-md mx-auto">
              {searchQuery || filterLocation !== "全部" ? "找不到符合篩選條件的食材，要不要換個條件試試？" : "您還沒有加入任何食材，點擊上方的「新增食材」開始建立您的智慧冰箱庫存吧！"}
            </p>
          </div>
        )}
      </main>

      {/* ================= 彈窗 ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                <Package className="text-orange-500 h-6 w-6" />
                {modalMode === "add" ? "新增食材" : "修改食材"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">食材名稱</label>
                <input
                  type="text"
                  required={modalMode === "add"}
                  disabled={modalMode === "edit"}
                  placeholder="例如：番茄、雞蛋"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">數量</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    placeholder="例如：1"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white font-medium"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(Number(e.target.value))}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">單位</label>
                  {/* 💡 全新升級的單位下拉選單，採用 optgroup 分類 */}
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white font-medium"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                  >
                    <optgroup label="重量與容量">
                      <option value="克 (g)">克 (g)</option>
                      <option value="公斤 (kg)">公斤 (kg)</option>
                      <option value="毫升 (ml)">毫升 (ml)</option>
                      <option value="公升 (L)">公升 (L)</option>
                      <option value="台斤">台斤</option>
                    </optgroup>
                    <optgroup label="食譜常用計量">
                      <option value="大匙">大匙</option>
                      <option value="小匙">小匙</option>
                      <option value="杯">杯</option>
                      <option value="適量">適量</option>
                    </optgroup>
                    <optgroup label="形狀與包裝">
                      <option value="顆">顆</option>
                      <option value="份">份</option>
                      <option value="把">把</option>
                      <option value="片">片</option>
                      <option value="塊">塊</option>
                      <option value="根">根</option>
                      <option value="條">條</option>
                      <option value="包">包</option>
                      <option value="罐">罐</option>
                      <option value="瓶">瓶</option>
                      <option value="盒">盒</option>
                      <option value="滴">滴</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">存放位置</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white font-medium"
                    value={newItemLocation}
                    onChange={(e) => setNewItemLocation(e.target.value)}
                  >
                    <option value="冷藏">冷藏</option>
                    <option value="冷凍">冷凍</option>
                    <option value="常溫">常溫</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">到期日 (選填)</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white font-medium"
                    value={newItemExpiration}
                    onChange={(e) => setNewItemExpiration(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-orange-400 hover:bg-orange-500 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isSubmitting 
                    ? (modalMode === "add" ? "新增中..." : "儲存中...") 
                    : (modalMode === "add" ? "確認新增" : "儲存修改")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}