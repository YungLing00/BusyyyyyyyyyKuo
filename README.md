# ◒ 留白 — 苓苓的私人行事曆

霧綠色、繁體中文、手機適配。把忙碌排好，把留白留給自己。

## 功能

帳號密碼登入、僅限指定帳號、月曆、每日行程、待辦清單、搜尋與四種分類、新增／編輯／刪除、完成勾選、桌面拖曳改期（手機可編輯日期）、當日／本週／本月統計、25 分鐘專注計時、暫停與重設。提供獨立示範模式，示範資料只保存在記憶體。

## 目前狀態與架構

程式已完成，尚未部署至你的 Google 帳號。正式網站由 **Google Apps Script Web App** 提供，透過 `google.script.run` 讀寫私人 **Google 試算表**。Firebase Authentication 僅負責帳號密碼驗證，不需要 Firestore。

Google 表單適合收件，不適合直接當可編輯刪除的資料庫，因此採用 Google 試算表。GitHub 儲存庫不等於已上線網站。直接開 Index.html 可體驗示範；正式登入需從 Apps Script 網址進入。

## 一次性設定

### 1. 建立登入帳號

1. 前往 https://console.firebase.google.com/ 建立或選擇專案。
2. Authentication → Sign-in method → 啟用 Email/Password。
3. Authentication → Users → Add user，建立你的 Email 與強密碼，複製該帳號 **UID**。
4. Project settings → General → 取得 **Web API Key**（必要時先新增 Web app）。

密碼只在 Firebase 設定，不要貼在 GitHub 或傳給他人。介面不提供註冊；即使同一 Firebase 專案出現其他帳號，後端也會檢查 UID 並拒絕。

### 2. 建立試算表與 Apps Script

1. 建立私人空白 Google 試算表，不開啟公開共用。
2. 複製網址 `/d/` 與 `/edit` 之間的試算表 ID。
3. 試算表 → 擴充功能 → Apps Script。
4. 將 `Code.gs` 完整內容貼入指令碼。
5. 新增「HTML」檔案，命名 **Index**，貼入 `Index.html` 完整內容。
6. 專案設定 → 顯示 `appsscript.json` 資訊清單檔案，貼入此專案同名檔案內容。
7. 專案設定 → 指令碼屬性，新增以下三項：

| 屬性 | 值 |
| --- | --- |
| FIREBASE_API_KEY | Firebase Web API Key |
| OWNER_UID | 唯一允許登入的使用者 UID |
| SPREADSHEET_ID | 私人試算表 ID |

API key 是 Firebase 專案識別資訊，不是密碼。私人資料以後端 token 與 OWNER_UID 驗證保護。不要上傳服務帳戶私鑰。

### 3. 部署

1. Apps Script → 部署 → 新增部署作業 → 網頁應用程式。
2. 執行身分：**我**。存取權：**所有人**（登入頁可開啟，但私人資料每次讀寫都驗證指定帳號）。
3. 完成 Google 授權，複製結尾 `/exec` 的網址。
4. 以該網址開啟，使用第一步建立的帳號登入。
5. 首次讀取自動建立 `Calendar` 分頁；不要手動修改其 `id`、`payload`、`updatedAt` 欄位。
6. 更新程式時：管理部署作業 → 編輯 → 新版本。

若學校 Workspace 禁止此部署方式，請使用允許部署的私人 Google 帳號或洽管理員。

## 上線驗收

- 登入並新增行程，重整後重新登入，確認資料保留。
- 另一裝置登入，按 ↻ 同步；測試編輯、改期、勾選與刪除。
- 其他 UID 不可讀寫資料。
- 同時開兩視窗編輯同一筆，舊版本應顯示衝突；按 ↻ 後再編輯。

## 本機檢查與示範

```sh
node --test tests/backend.test.cjs
python3 -m http.server 8000
```

開啟 http://localhost:8000/Index.html ，按「先體驗互動示範」。不需要 npm 套件。

## 限制與驗證範圍

- Token 僅存記憶體，重新整理或約一小時後需重新登入。過期時未存編輯不會自動清除，先複製內容再登出。
- 計時器只在頁面開啟時運作，沒有關頁推播或系統提醒。
- 日曆日期依裝置時區；Apps Script 時區為 Asia/Taipei。
- 適用單人使用，受 Apps Script 與 Firebase 配額限制。
- 本機測試涵蓋權限拒絕、輸入驗證、CRUD 與版本衝突。尚未進行真實 Google 部署端對端測試或瀏覽器視覺驗證。

## 官方文件

- https://firebase.google.com/docs/reference/rest/auth
- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/guides/web
