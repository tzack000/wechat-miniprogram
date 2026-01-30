# 录音页面快速测试脚本

## 使用方法

在微信开发者工具的控制台（Console）中依次执行以下命令。

---

## 1. 获取当前页面实例

```javascript
const pages = getCurrentPages();
const page = pages[pages.length - 1];
console.log('当前页面:', page.route);
console.log('页面数据:', page.data);
```

**预期输出**:
```
当前页面: pages/record/record
页面数据: {Object with all data properties}
```

---

## 2. 检查初始状态

```javascript
console.log('=== 初始状态检查 ===');
console.log('录音中:', page.data.isRecording);
console.log('已暂停:', page.data.isPaused);
console.log('有录音:', page.data.hasRecording);
console.log('权限授予:', page.data.permissionGranted);
console.log('显示引导:', page.data.showGuide);
console.log('参考文本:', page.data.referenceTextSentences.length + '条');
```

**预期输出**:
```
=== 初始状态检查 ===
录音中: false
已暂停: false
有录音: false
权限授予: false (首次) 或 true (已授权)
显示引导: true (首次) 或 false (已关闭)
参考文本: 8条
```

---

## 3. 检查录音管理器

```javascript
console.log('=== 录音管理器检查 ===');
console.log('录音管理器存在:', !!page.recorderManager);
console.log('录音管理器类型:', typeof page.recorderManager);
```

**预期输出**:
```
=== 录音管理器检查 ===
录音管理器存在: true
录音管理器类型: object
```

---

## 4. 测试关闭引导

```javascript
console.log('=== 测试关闭引导 ===');
page.hideGuide();
console.log('引导已关闭:', !page.data.showGuide);
```

**预期输出**:
```
=== 测试关闭引导 ===
引导已关闭: true
```

---

## 5. 检查权限状态

```javascript
console.log('=== 权限检查 ===');
wx.getSetting({
  success(res) {
    console.log('录音权限:', res.authSetting['scope.record']);
    console.log('所有权限:', res.authSetting);
  }
});
```

**预期输出**:
```
=== 权限检查 ===
录音权限: true/false/undefined
所有权限: {Object}
```

---

## 6. 模拟开始录音（仅检查状态变化）

```javascript
console.log('=== 模拟开始录音 ===');
console.log('录音前状态:', {
  isRecording: page.data.isRecording,
  recordingTime: page.data.recordingTime
});

// 注意：这只是检查，不实际开始录音
// 实际录音需要在界面上点击按钮
```

---

## 7. 检查参考文本

```javascript
console.log('=== 参考文本检查 ===');
console.log('文本总数:', page.data.referenceTextSentences.length);
page.data.referenceTextSentences.forEach((text, index) => {
  console.log(`${index + 1}. ${text}`);
});
console.log('当前高亮:', page.data.referenceTextIndex);
```

**预期输出**:
```
=== 参考文本检查 ===
文本总数: 8
1. 今天天气真不错，我们一起去公园散步吧。
2. 这是一段测试录音，用于声音克隆系统。
... (共8条)
当前高亮: 0
```

---

## 8. 检查配置参数

```javascript
console.log('=== 配置参数检查 ===');
console.log('最大时长:', page.data.maxDuration + '秒');
console.log('最小时长:', page.data.minDuration + '秒');
console.log('最大重试:', page.data.maxRetryCount + '次');
```

**预期输出**:
```
=== 配置参数检查 ===
最大时长: 300秒
最小时长: 30秒
最大重试: 3次
```

---

## 9. 检查上传状态

```javascript
console.log('=== 上传状态检查 ===');
console.log('上传中:', page.data.uploading);
console.log('上传进度:', page.data.uploadProgress + '%');
console.log('重试次数:', page.data.uploadRetryCount);
```

**预期输出**:
```
=== 上传状态检查 ===
上传中: false
上传进度: 0%
重试次数: 0
```

---

## 10. 完整状态报告

```javascript
console.log('=== 完整状态报告 ===');
const report = {
  页面路由: page.route,
  录音状态: {
    正在录音: page.data.isRecording,
    已暂停: page.data.isPaused,
    有录音: page.data.hasRecording,
    录音时长: page.data.recordingTime + '秒',
    录音路径: page.data.recordingPath || '无',
    文件大小: page.data.recordingSize + '字节'
  },
  质量检测: {
    已检测: page.data.qualityChecked,
    结果: page.data.qualityResult
  },
  上传状态: {
    上传中: page.data.uploading,
    进度: page.data.uploadProgress + '%',
    重试次数: page.data.uploadRetryCount
  },
  UI状态: {
    显示引导: page.data.showGuide,
    权限授予: page.data.permissionGranted
  },
  波形数据: {
    数据点数: page.data.volumeLevels.length,
    最新音量: page.data.volumeLevels[page.data.volumeLevels.length - 1]
  }
};
console.table(report);
```

---

## 11. 模拟录音时间变化

```javascript
console.log('=== 模拟计时器 ===');
let seconds = 0;
const timer = setInterval(() => {
  seconds++;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  console.log(`模拟录音时间: ${display} (${seconds}秒)`);
  
  if (seconds >= 5) {
    clearInterval(timer);
    console.log('模拟计时器停止');
  }
}, 1000);
```

---

## 12. 测试时间格式化

```javascript
console.log('=== 时间格式化测试 ===');
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

console.log('0秒 →', formatTime(0));    // 00:00
console.log('30秒 →', formatTime(30));  // 00:30
console.log('90秒 →', formatTime(90));  // 01:30
console.log('300秒 →', formatTime(300)); // 05:00
```

---

## 13. 检查云函数配置

```javascript
console.log('=== 云函数配置检查 ===');
console.log('App实例:', !!getApp());
console.log('用户信息:', getApp().globalData.userInfo);
console.log('云环境:', wx.cloud ? '已初始化' : '未初始化');

if (wx.cloud) {
  console.log('云函数列表:', ['audioProcess', 'extract', 'synthesize', 'upload']);
}
```

---

## 14. 清理测试数据

```javascript
console.log('=== 清理测试数据 ===');
page.setData({
  isRecording: false,
  isPaused: false,
  hasRecording: false,
  recordingTime: 0,
  recordingTimeDisplay: '00:00',
  recordingPath: '',
  recordingSize: 0,
  qualityChecked: false,
  qualityResult: null,
  volumeLevels: [],
  uploading: false,
  uploadProgress: 0,
  uploadRetryCount: 0
});
console.log('测试数据已清理');
```

---

## 15. 故障诊断

```javascript
console.log('=== 故障诊断 ===');

// 检查常见问题
const diagnostics = {
  页面实例存在: !!page,
  录音管理器存在: !!page.recorderManager,
  App实例存在: !!getApp(),
  云环境初始化: !!wx.cloud,
  网络连接: navigator.onLine,
  控制台错误数: 0 // 手动查看console
};

console.table(diagnostics);

// 检查必需方法
const methods = [
  'initRecorderManager',
  'loadReferenceText', 
  'checkRecordPermission',
  'startRecording',
  'pauseRecording',
  'resumeRecording',
  'stopRecording',
  'checkRecordingQuality',
  'playRecording',
  'reRecord',
  'submitRecording',
  'validateRecording',
  'uploadRecording'
];

console.log('方法检查:');
methods.forEach(method => {
  console.log(`  ${method}:`, typeof page[method] === 'function' ? '✓' : '✗');
});
```

---

## 完整测试流程

将以下代码复制到控制台，一次性执行所有检查：

```javascript
(function() {
  console.clear();
  console.log('========================================');
  console.log('     录音页面自动化测试开始');
  console.log('========================================\n');
  
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  
  if (page.route !== 'pages/record/record') {
    console.error('❌ 错误: 请先打开录音页面');
    return;
  }
  
  let passed = 0;
  let failed = 0;
  
  function test(name, condition, expected) {
    const result = condition;
    const success = result === expected || (expected === undefined && !!result);
    if (success) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.error(`✗ ${name} - 期望: ${expected}, 实际: ${result}`);
      failed++;
    }
  }
  
  // 执行测试
  console.log('\n1. 页面基础检查');
  test('页面路由正确', page.route, 'pages/record/record');
  test('页面实例存在', !!page, true);
  
  console.log('\n2. 数据初始化检查');
  test('isRecording初始为false', page.data.isRecording, false);
  test('hasRecording初始为false', page.data.hasRecording, false);
  test('recordingTime初始为0', page.data.recordingTime, 0);
  test('参考文本有8条', page.data.referenceTextSentences.length, 8);
  
  console.log('\n3. 组件初始化检查');
  test('录音管理器存在', !!page.recorderManager, true);
  test('App实例存在', !!getApp(), true);
  
  console.log('\n4. 方法存在性检查');
  const methods = ['startRecording', 'stopRecording', 'submitRecording'];
  methods.forEach(method => {
    test(`${method}方法存在`, typeof page[method], 'function');
  });
  
  console.log('\n5. 配置参数检查');
  test('最大时长为300秒', page.data.maxDuration, 300);
  test('最小时长为30秒', page.data.minDuration, 30);
  test('最大重试为3次', page.data.maxRetryCount, 3);
  
  console.log('\n========================================');
  console.log(`测试完成: ${passed}通过, ${failed}失败`);
  console.log('========================================');
  
  if (failed === 0) {
    console.log('✅ 所有测试通过！页面功能正常。');
  } else {
    console.warn(`⚠️ 有${failed}个测试失败，请检查。`);
  }
})();
```

---

## 实际录音测试（需要手动操作）

由于录音需要用户交互，以下测试需要手动进行：

### 测试步骤：

1. **关闭引导**
   - 点击"开始使用"按钮
   - 检查引导overlay消失

2. **开始录音**
   - 点击"开始录音"按钮
   - 检查按钮变为"暂停"和"停止"
   - 对着麦克风说话30秒以上
   - 观察计时器和波形变化

3. **停止录音**
   - 点击"停止"按钮
   - 检查质量检测结果
   - 查看录音信息显示

4. **播放录音**
   - 点击"播放"按钮
   - 听录音播放

5. **检查上传**（如果云函数已部署）
   - 点击"提交"按钮
   - 观察上传进度
   - 检查成功/失败提示

然后在控制台执行：

```javascript
console.log('=== 录音后状态 ===');
const page = getCurrentPages()[getCurrentPages().length - 1];
console.log('有录音:', page.data.hasRecording);
console.log('录音时长:', page.data.recordingTime + '秒');
console.log('文件大小:', (page.data.recordingSize / 1024).toFixed(2) + ' KB');
console.log('质量分数:', page.data.qualityResult?.score);
console.log('是否通过:', page.data.qualityResult?.passed);
```

---

## 注意事项

1. **权限测试**: 首次测试需要授予录音权限
2. **真机测试**: 某些功能在模拟器上可能不完全可用
3. **云函数**: 完整的上传测试需要先部署云函数
4. **网络**: 上传测试需要网络连接

---

## 测试结果记录

测试完成后，记录结果：

```javascript
const testResult = {
  测试时间: new Date().toLocaleString(),
  测试设备: '开发者工具/真机',
  页面加载: '通过/失败',
  录音功能: '通过/失败',
  质量检测: '通过/失败',
  播放功能: '通过/失败',
  上传功能: '通过/失败/未测试',
  发现问题: []
};

console.log('=== 测试结果 ===');
console.table(testResult);

// 导出结果
copy(JSON.stringify(testResult, null, 2));
console.log('结果已复制到剪贴板');
```
