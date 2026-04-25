// 这个文件封装浏览器本地保存，和 App 状态管理配合使用。

const STORAGE_KEY = "chronic-medication-manager-state";

// 从本地读取数据，失败时返回空值。
export function loadSavedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("读取本地数据失败", error);
    return null;
  }
}

// 把当前数据保存到浏览器本地。
export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("保存本地数据失败", error);
  }
}

// 清空浏览器本地保存的数据。
export function clearSavedState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("清空本地数据失败", error);
  }
}
