# audioProcess云函数部署和测试指南

## 修复的问题

### 1. WXML编译错误 ✅
**问题**: `{{(recordingSize / 1024).toFixed(2)}} KB` - WXML不支持直接调用方法

**解决方案**: 在JS中预处理数据
- 添加 `recordingSizeDisplay` 数据字段
- 在录音停止时格式化文件大小
- WXML中使用 `{{recordingSizeDisplay}}`

### 2. app.json权限配置错误 ✅
**问题**: `scope.record` 和 `scope.writePhotosAlbum` 不应在permission中声明

**解决方案**: 
- 录音权限通过 `wx.authorize({scope: 'scope.record'})` 在运行时请求
- 移除permission配置中的错误声明
- 保留标准的permission配置格式

---

## 部署步骤

### 步骤1: 右键上传云函数

1. **打开微信开发者工具**
2. **找到云函数目录**
   ```
   cloudfunctions/
   └── audioProcess/
       ├── index.js
       ├── package.json
       └── config.json
   ```

3. **右键点击 `audioProcess` 文件夹**
4. **选择"上传并部署：云端安装依赖"**
   - 注意：必须选择"云端安装依赖"，不是"不上传node_modules"
   - 这样会在云端自动安装 `wx-server-sdk`

5. **等待部署完成**
   - 控制台会显示上传进度
   - 看到"上传成功"即可

### 步骤2: 验证部署

在控制台执行：

```javascript
// 测试云函数是否部署成功
wx.cloud.callFunction({
  name: 'audioProcess',
  data: {
    action: 'validateAudio',
    fileID: 'test',
    duration: 60,
    format: 'wav',
    size: 1024000
  },
  success: res => {
    console.log('云函数调用成功:', res);
  },
  fail: err => {
    console.error('云函数调用失败:', err);
  }
});
```

**预期输出**:
```javascript
{
  result: {
    success: false,
    error: "文件验证失败: ...",
    data: {...}
  }
}
```

### 步骤3: 初始化数据库

如果还没有创建数据库集合，需要先运行db-init：

```javascript
wx.cloud.callFunction({
  name: 'db-init',
  data: {
    action: 'createCollections'
  },
  success: res => {
    console.log('数据库集合创建结果:', res);
  }
});
```

---

## 测试上传功能

### 测试1: 完整录音上传流程

1. **进入录音页面**
2. **授予录音权限**
3. **开始录音** (至少30秒)
4. **停止录音**
5. **点击"提交"按钮**
6. **观察上传过程**

**预期行为**:
- ✓ 显示"准备上传..."
- ✓ 进度条从0%开始增长
- ✓ 显示"上传中 10%" → "上传中 70%" → "处理中 80%"
- ✓ 云函数处理成功
- ✓ 显示"上传成功"提示
- ✓ 弹出"是否立即开始提取声音特征?"对话框

### 测试2: 在控制台查看上传详情

录音后，在控制台执行：

```javascript
const page = getCurrentPages()[getCurrentPages().length - 1];

console.log('=== 录音信息 ===');
console.log('文件路径:', page.data.recordingPath);
console.log('文件大小:', page.data.recordingSizeDisplay);
console.log('录音时长:', page.data.recordingTime + '秒');
console.log('质量分数:', page.data.qualityResult?.score);

// 模拟上传（不实际上传，只测试验证）
const isValid = page.validateRecording();
console.log('验证结果:', isValid);
```

### 测试3: 检查云存储

上传成功后：

1. **打开云开发控制台**
2. **进入"云存储"**
3. **查看 `recordings/` 目录**
4. **应该能看到新上传的文件**

文件路径格式：`recordings/{userId}/recording_{timestamp}.wav`

### 测试4: 检查数据库记录

1. **打开云开发控制台**
2. **进入"数据库"**
3. **查看 `audio_records` 集合**
4. **应该有新记录**

记录格式：
```javascript
{
  _id: "自动生成",
  openid: "用户openid",
  originalFileID: "cloud://...",
  processedFileID: "cloud://...",
  duration: 60,
  format: "wav",
  size: 1024000,
  status: "uploaded",
  needsConversion: false,
  createTime: Date,
  updateTime: Date
}
```

---

## 测试不同场景

### 场景1: 正常上传 (>30秒，质量良好)

**操作**:
1. 录音35秒，正常音量
2. 点击"提交"

**预期**:
- ✓ 通过验证
- ✓ 上传成功
- ✓ 云函数处理成功

### 场景2: 录音过短 (<30秒)

**操作**:
1. 录音20秒
2. 点击"提交"

**预期**:
- ✗ 验证失败
- ✗ 提示"录音时长为20秒，需要至少30秒"

### 场景3: 文件过大 (>50MB)

**操作**:
1. 录音超长时间（理论测试）
2. 点击"提交"

**预期**:
- ✗ 验证失败
- ✗ 提示"文件大小XX MB超过50MB限制"

### 场景4: 网络断开

**操作**:
1. 录音30秒
2. 断开网络
3. 点击"提交"

**预期**:
- ✗ 上传失败
- ✗ 显示重试对话框
- ✓ 允许重试3次

### 场景5: 质量不佳但继续上传

**操作**:
1. 录音30秒，但音量很低
2. 质量检测显示不合格
3. 仍然点击"提交"

**预期**:
- ⚠️ 显示质量警告（在控制台）
- ✓ 仍允许上传
- ✓ 上传成功

---

## 调试技巧

### 1. 查看上传进度

在 `record.js` 的 `uploadRecording` 方法中添加日志：

```javascript
uploadTask.onProgressUpdate((res) => {
  const progress = Math.floor(res.progress * 0.7);
  console.log('上传进度:', progress, '%', res);
  this.setData({ uploadProgress: progress });
  wx.showLoading({ title: `上传中 ${progress}%` });
});
```

### 2. 查看云函数日志

1. 打开云开发控制台
2. 进入"云函数"
3. 点击 `audioProcess`
4. 查看"日志"标签
5. 查看实时日志输出

### 3. 模拟上传失败

在 `uploadRecording` 中强制失败：

```javascript
uploadRecording(fileContent) {
  // 模拟失败
  setTimeout(() => {
    this.handleUploadError(new Error('模拟失败'), fileContent);
  }, 2000);
  return;
  
  // 原始代码...
}
```

### 4. 检查重试机制

```javascript
const page = getCurrentPages()[getCurrentPages().length - 1];
console.log('当前重试次数:', page.data.uploadRetryCount);
console.log('最大重试次数:', page.data.maxRetryCount);
```

---

## 常见问题排查

### 问题1: "云函数不存在"

**原因**: 云函数未部署或部署失败

**解决**:
1. 检查云函数是否在云开发控制台中可见
2. 重新上传并部署
3. 确保云环境ID正确

### 问题2: "request:fail"

**原因**: 网络问题或云存储配置问题

**解决**:
1. 检查网络连接
2. 检查云存储权限设置
3. 查看云函数日志

### 问题3: "上传进度一直是0%"

**原因**: `onProgressUpdate` 回调未触发

**解决**:
1. 检查 `uploadTask` 是否正确
2. 确认文件路径有效
3. 尝试真机调试

### 问题4: "云函数超时"

**原因**: 处理时间过长

**解决**:
1. 检查文件大小是否过大
2. 优化云函数代码
3. 增加超时时间配置

### 问题5: "数据库写入失败"

**原因**: 权限不足或集合不存在

**解决**:
1. 运行 `db-init` 创建集合
2. 检查数据库权限设置
3. 查看云函数日志中的错误信息

---

## 测试检查清单

### 基础功能测试
- [ ] 云函数部署成功
- [ ] 云函数可以调用
- [ ] 数据库集合已创建
- [ ] 云存储可访问

### 上传流程测试
- [ ] 可以开始上传
- [ ] 进度显示正确
- [ ] 上传成功提示
- [ ] 云存储有文件
- [ ] 数据库有记录

### 验证测试
- [ ] 文件大小验证
- [ ] 时长验证
- [ ] 格式验证
- [ ] 质量检测集成

### 错误处理测试
- [ ] 网络错误重试
- [ ] 最大重试限制
- [ ] 错误提示清晰
- [ ] 可以取消重试

### UI/UX测试
- [ ] 按钮状态正确
- [ ] 进度条动画流畅
- [ ] 加载提示清晰
- [ ] 成功/失败反馈明确

---

## 下一步

上传功能测试通过后：

1. ✅ 录音和上传功能完整
2. ⏭ 部署语音克隆API服务器
3. ⏭ 实现声音特征提取
4. ⏭ 实现语音合成功能

---

## 快速测试命令

在开发者工具控制台一键执行完整测试：

```javascript
(async function testUpload() {
  console.clear();
  console.log('=== audioProcess云函数测试 ===\n');
  
  // 测试1: 云函数存在性
  console.log('1. 测试云函数调用...');
  try {
    const res = await wx.cloud.callFunction({
      name: 'audioProcess',
      data: {
        action: 'validateAudio',
        fileID: 'test',
        duration: 60,
        format: 'wav',
        size: 1024000
      }
    });
    console.log('✓ 云函数可以调用');
    console.log('  返回:', res.result);
  } catch (err) {
    console.error('✗ 云函数调用失败:', err);
    return;
  }
  
  // 测试2: 检查页面状态
  console.log('\n2. 检查录音页面状态...');
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  
  if (page.route !== 'pages/record/record') {
    console.error('✗ 请先打开录音页面');
    return;
  }
  
  console.log('✓ 录音页面已打开');
  console.log('  有录音:', page.data.hasRecording);
  console.log('  文件大小:', page.data.recordingSizeDisplay);
  console.log('  录音时长:', page.data.recordingTime + '秒');
  
  // 测试3: 验证功能
  console.log('\n3. 测试验证功能...');
  if (page.data.hasRecording) {
    const isValid = page.validateRecording && page.validateRecording();
    console.log('  验证结果:', isValid ? '✓ 通过' : '✗ 未通过');
  } else {
    console.log('  ⚠️ 没有录音，跳过验证测试');
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('请手动测试完整上传流程：');
  console.log('1. 录音30秒以上');
  console.log('2. 点击"停止"');
  console.log('3. 点击"提交"');
  console.log('4. 观察上传进度和结果');
})();
```

---

## 成功标志

上传功能正常工作的标志：

✅ 录音后可以点击"提交"  
✅ 显示上传进度条（0% → 100%）  
✅ 控制台无错误  
✅ 显示"上传成功"提示  
✅ 云存储中有文件  
✅ 数据库中有记录  
✅ 弹出特征提取对话框
