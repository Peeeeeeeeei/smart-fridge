import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 標題區塊 */}
      <div className="bg-gradient-to-r from-purple-50 to-primary/10 border-b border-border">
        <div className="container py-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">數據分析</h1>
              <p className="text-muted-foreground mt-1">智慧冰箱庫存狀態與食譜偏好洞察</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">系統洞察儀表板</CardTitle>
            <CardDescription>
              結合智慧冰箱食材消耗率與使用者偏好分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Flourish 嵌入預留區塊 */}
            <div className="w-full h-[600px] bg-muted/30 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center">
              <BarChart3 className="h-16 w-16 mb-4 text-muted-foreground/40" />
              <p className="text-xl font-bold text-foreground">Flourish 互動式資料儀表板準備中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}