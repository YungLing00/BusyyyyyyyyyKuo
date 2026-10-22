/** Private calendar. All data entrypoints verify the configured owner. */
function doGet() { return HtmlService.createHtmlOutputFromFile('Index').setTitle('苓苓的留白日曆').addMetaTag('viewport', 'width=device-width, initial-scale=1'); }
function getConfig() { return {apiKey: prop_('FIREBASE_API_KEY')}; }
function prop_(key) { const value = PropertiesService.getScriptProperties().getProperty(key); if (!value) throw new Error('尚未設定 ' + key); return value; }
function authorize_(token) {
  if (typeof token !== 'string' || token.length < 100 || token.length > 10000) throw new Error('請重新登入');
  const response = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(prop_('FIREBASE_API_KEY')), {method:'post',contentType:'application/json',payload:JSON.stringify({idToken:token}),muteHttpExceptions:true});
  if (response.getResponseCode() !== 200) throw new Error('登入已過期，請登出後重新登入');
  const user = JSON.parse(response.getContentText()).users?.[0];
  if (!user || user.disabled || user.localId !== prop_('OWNER_UID')) throw new Error('此行事曆僅限擁有者使用');
}
function sheet_() {
  const book = SpreadsheetApp.openById(prop_('SPREADSHEET_ID'));
  let sheet = book.getSheetByName('Calendar');
  if (!sheet) { sheet = book.insertSheet('Calendar'); sheet.appendRow(['id','payload','updatedAt']); sheet.setFrozenRows(1); }
  return sheet;
}
function rows_(sheet) { return sheet.getLastRow() < 2 ? [] : sheet.getRange(2,1,sheet.getLastRow()-1,3).getValues(); }
function listEvents(token) { authorize_(token); const lock=LockService.getScriptLock(); lock.waitLock(10000); try { return rows_(sheet_()).map(r=>JSON.parse(r[1])); } finally {lock.releaseLock();} }
function validate_(event) {
  if (!event || typeof event.title !== 'string' || !event.title.trim() || event.title.length > 120) throw new Error('請輸入 1–120 字標題');
  if (typeof event.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !Number.isFinite(Date.parse(event.date)) || new Date(event.date).toISOString().slice(0,10)!==event.date) throw new Error('日期格式錯誤');
  if (event.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.time)) throw new Error('時間格式錯誤');
  if (!['work','study','life','rest'].includes(event.category)) throw new Error('分類錯誤');
  if (typeof event.notes !== 'string' || event.notes.length > 3000) throw new Error('備註不得超過 3000 字');
  if (event.id && !/^[a-zA-Z0-9-]{1,60}$/.test(event.id)) throw new Error('行程識別碼錯誤');
  return {id:event.id || Utilities.getUuid(),title:event.title.trim(),date:event.date,time:event.time || '',category:event.category,notes:event.notes,done:event.done === true};
}
function saveEvent(token, event) {
  authorize_(token); const clean=validate_(event); const lock=LockService.getScriptLock(); lock.waitLock(10000);
  try { const sheet=sheet_(), rows=rows_(sheet), index=rows.findIndex(r=>r[0]===clean.id);
    if(event.id && index<0) throw new Error('行程已被刪除，請重新整理');
    if(index>=0 && JSON.parse(rows[index][1]).updatedAt!==event.updatedAt) throw new Error('行程已於其他視窗更新，請重新整理');
    clean.updatedAt=new Date().toISOString();
    const values=[clean.id,JSON.stringify(clean),clean.updatedAt];
    if(index<0) sheet.appendRow(values); else sheet.getRange(index+2,1,1,3).setValues([values]);
    return clean;
  } finally {lock.releaseLock();}
}
function deleteEvent(token,id,updatedAt) {
  authorize_(token); const lock=LockService.getScriptLock(); lock.waitLock(10000);
  try { const sheet=sheet_(),rows=rows_(sheet),index=rows.findIndex(r=>r[0]===id);
    if(index>=0) {if(JSON.parse(rows[index][1]).updatedAt!==updatedAt) throw new Error('行程已更新，請重新整理'); sheet.deleteRow(index+2);} return true;
  } finally {lock.releaseLock();}
}
