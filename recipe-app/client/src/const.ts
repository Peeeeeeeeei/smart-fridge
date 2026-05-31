export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// 暫時使用暴力破解法 (Hardcode)，強迫回傳本地端網址以避開錯誤
export const getLoginUrl = () => {
  return "http://localhost:3000";
};