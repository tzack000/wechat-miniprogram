# 录音上传功能完整测试脚本

## 测试前准备

1. ✅ 确保已清除缓存并重新编译
2. ✅ 确保 audioProcess 云函数已部署
3. ✅ 确保在录音页面 (pages/record/record)
4. ✅ 确保已完成一次录音（至少30秒）

---

## 自动化测试脚本

### 步骤1: 基础检查

复制以下代码到开发者工具控制台执行：

```javascript
(function basicCheck() {
  console.clear();
  console.log('========================================');
  console.log('  录音上传功能测试 - 基础检查');
  console.log('========================================\n');
  
  // 获取当前页面
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  
  // 检查1: 页面路由
  console.log('1. 页面检查');
  if (page.route === 'pages/record/record') {
    console.log('   ✓ 当前在录音页面');
  } else {
    console.error('   ✗ 不在录音页面，当前: ' + page.route);
    console.log('\n请先进入录音页面！');
    return false;
  }
  
  // 检查2: 录音状态
  console.log('\n2. 录音状态检查');
  console.log('   有录音:', page.data.hasRecording ? '✓ 是' : '✗ 否');
  console.log('   录音时长:', page.data.recordingTime + '秒');
  console.log('   文件大小:', page.data.recordingSizeDisplay);
  console.log('   文件路径:', page.data.recordingPath ? '✓ 有' : '✗ 无');
  
  if (!page.data.hasRecording) {
    console.log('\n⚠️ 没有录音！请先完成录音：');
    console.log('   1. 点击"开始录音"');
    console.log('   2. 说话30秒以上');
    console.log('   3. 点击"停止"');
    return false;
  }
  
  // 检查3: 录音时长
  console.log('\n3. 时长检查');
  if (page.data.recordingTime >= 30) {
    console.log('   ✓ 时长合格 (' + page.data.recordingTime + '秒 >= 30秒)');
  } else {
    console.log('   ✗ 时长不足 (' + page.data.recordingTime + '秒 < 30秒)');
    console.log('   提示: 需要至少30秒录音才能上传');
    return false;
  }
  
  // 检查4: 质量检测
  console.log('\n4. 质量检测');
  if (page.data.qualityChecked) {
    console.log('   已检测: ✓');
    console.log('   质量分数:', page.data.qualityResult?.score);
    console.log('   是否通过:', page.data.qualityResult?.passed ? '✓' : '✗');
    if (page.data.qualityResult?.issues) {
      console.log('   问题:', page.data.qualityResult.issues.join(', '));
    }
  } else {
    console.log('   未检测: 等待自动检测');
  }
  
  // 检查5: 上传状态
  console.log('\n5. 上传状态');
  console.log('   上传中:', page.data.uploading ? '✓' : '✗');
  console.log('   上传进度:', page.data.uploadProgress + '%');
  console.log('   重试次数:', page.data.uploadRetryCount + '/' + page.data.maxRetryCount);
  
  // 检查6: 云环境
  console.log('\n6. 云环境检查');
  console.log('   云开发初始化:', wx.cloud ? '✓' : '✗');
  console.log('   App实例:', getApp() ? '✓' : '✗');
  
  // 检查7: 必需方法
  console.log('\n7. 方法检查');
  const methods = ['validateRecording', 'uploadRecording', 'submitRecording'];
  methods.forEach(method => {
    const exists = typeof page[method] === 'function';
    console.log('   ' + method + ':', exists ? '✓' : '✗');
  });
  
  console.log('\n========================================');
  console.log('基础检查完成');
  console.log('========================================\n');
  
  return true;
})();
```

---

### 步骤2: 云函数连通性测试

```javascript
(async function testCloudFunction() {
  console.log('\n========================================');
  console.log('  云函数连通性测试');
  console.log('========================================\n');
  
  console.log('正在调用 audioProcess 云函数...');
  
  try {
    const startTime = Date.now();
    
    const res = await wx.cloud.callFunction({
      name: 'audioProcess',
      data: {
        action: 'validateAudio',
        fileID: 'cloud://test-file-id',
        duration: 60,
        format: 'wav',
        size: 1024000
      }
    });
    
    const elapsed = Date.now() - startTime;
    
    console.log('✓ 云函数调用成功 (耗时: ' + elapsed + 'ms)');
    console.log('返回结果:', res.result);
    
    if (res.result.success === false) {
      console.log('⚠️ 这是预期的失败（因为使用了测试数据）');
      console.log('   实际上传时会使用真实文件ID');
    }
    
    return true;
    
  } catch (err) {
    console.error('✗ 云函数调用失败');
    console.error('错误信息:', err);
    console.error('错误代码:', err.errCode);
    console.error('错误消息:', err.errMsg);
    
    if (err.errCode === -1) {
      console.log('\n可能的原因:');
      console.log('1. 云函数未部署');
      console.log('2. 云函数名称错误');
      console.log('3. 云环境配置问题');
      console.log('\n解决方法:');
      console.log('右键 cloudfunctions/audioProcess/ → 上传并部署：云端安装依赖');
    }
    
    return false;
  }
})();
```

---

### 步骤3: 模拟上传流程测试

```javascript
(async function testUploadFlow() {
  console.log('\n========================================');
  console.log('  上传流程模拟测试');
  console.log('========================================\n');
  
  const page = getCurrentPages()[getCurrentPages().length - 1];
  
  if (!page.data.hasRecording) {
    console.error('✗ 没有录音，无法测试');
    return;
  }
  
  console.log('1. 验证录音...');
  
  // 测试验证方法
  try {
    const isValid = page.validateRecording();
    
    if (isValid === false) {
      console.log('   ✗ 验证失败');
      return;
    }
    
    console.log('   ✓ 验证通过');
  } catch (err) {
    console.error('   ✗ 验证出错:', err);
    return;
  }
  
  console.log('\n2. 检查文件信息...');
  console.log('   路径:', page.data.recordingPath);
  console.log('   大小:', page.data.recordingSize, 'bytes');
  console.log('   时长:', page.data.recordingTime, '秒');
  console.log('   格式: WAV');
  
  console.log('\n3. 测试文件读取...');
  
  try {
    wx.getFileSystemManager().access({
      path: page.data.recordingPath,
      success: () => {
        console.log('   ✓ 文件存在且可访问');
      },
      fail: (err) => {
        console.error('   ✗ 文件访问失败:', err);
      }
    });
  } catch (err) {
    console.error('   ✗ 文件检查出错:', err);
  }
  
  console.log('\n========================================');
  console.log('准备就绪，可以点击"提交"按钮测试实际上传');
  console.log('========================================\n');
})();
```

---

### 步骤4: 实时监控上传过程

在点击"提交"按钮之前，先运行这个监控脚本：

```javascript
(function monitorUpload() {
  console.log('\n========================================');
  console.log('  上传过程实时监控（已启动）');
  console.log('========================================\n');
  console.log('现在可以点击"提交"按钮\n');
  
  const page = getCurrentPages()[getCurrentPages().length - 1];
  let lastProgress = -1;
  let startTime = null;
  
  // 监控上传状态
  const monitor = setInterval(() => {
    const uploading = page.data.uploading;
    const progress = page.data.uploadProgress;
    
    if (uploading && startTime === null) {
      startTime = Date.now();
      console.log('🚀 上传开始');
    }
    
    if (uploading && progress !== lastProgress) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`📤 进度: ${progress}% (${elapsed}秒)`);
      lastProgress = progress;
      
      // 进度里程碑
      if (progress === 10) console.log('   → 准备阶段完成');
      if (progress === 70) console.log('   → 上传阶段完成');
      if (progress === 80) console.log('   → 开始处理...');
      if (progress === 100) {
        console.log('   → 处理完成');
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ 上传成功！总耗时: ${totalTime}秒`);
        clearInterval(monitor);
      }
    }
    
    // 检查错误
    if (!uploading && startTime !== null && progress < 100) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`❌ 上传失败或中断 (${totalTime}秒后，进度${progress}%)`);
      console.log('重试次数:', page.data.uploadRetryCount);
      clearInterval(monitor);
    }
    
  }, 100);
  
  // 30秒后自动停止监控
  setTimeout(() => {
    clearInterval(monitor);
    console.log('\n监控已自动停止（30秒超时）');
  }, 30000);
  
  console.log('监控运行中... (30秒后自动停止)');
  
  // 返回停止函数
  window.stopMonitor = () => {
    clearInterval(monitor);
    console.log('监控已手动停止');
  };
  
  console.log('提示: 执行 stopMonitor() 可手动停止监控\n');
})();
```

---

### 步骤5: 上传后验证

上传完成后执行此脚本：

```javascript
(async function verifyUpload() {
  console.log('\n========================================');
  console.log('  上传结果验证');
  console.log('========================================\n');
  
  const page = getCurrentPages()[getCurrentPages().length - 1];
  
  console.log('1. 本地状态检查');
  console.log('   上传中:', page.data.uploading ? '是' : '否');
  console.log('   最终进度:', page.data.uploadProgress + '%');
  console.log('   重试次数:', page.data.uploadRetryCount);
  
  console.log('\n2. 云存储检查');
  console.log('   提示: 请在云开发控制台查看');
  console.log('   路径: recordings/{userId}/recording_*.wav');
  
  console.log('\n3. 数据库检查');
  console.log('   集合: audio_records');
  
  // 尝试查询最新记录
  try {
    console.log('   正在查询最新记录...');
    
    const db = wx.cloud.database();
    const res = await db.collection('audio_records')
      .orderBy('createTime', 'desc')
      .limit(1)
      .get();
    
    if (res.data.length > 0) {
      const record = res.data[0];
      console.log('   ✓ 找到记录:');
      console.log('     ID:', record._id);
      console.log('     时长:', record.duration, '秒');
      console.log('     大小:', (record.size / 1024).toFixed(2), 'KB');
      console.log('     格式:', record.format);
      console.log('     状态:', record.status);
      console.log('     创建时间:', new Date(record.createTime).toLocaleString());
    } else {
      console.log('   ⚠️ 未找到记录（可能需要权限或数据同步延迟）');
    }
    
  } catch (err) {
    console.log('   ⚠️ 查询失败:', err.errMsg);
    console.log('   说明: 这是正常的，可能需要在云开发控制台查看');
  }
  
  console.log('\n========================================');
  console.log('验证完成');
  console.log('========================================\n');
})();
```

---

## 完整测试流程（一键运行）

复制以下代码执行完整测试：

```javascript
(async function completeTest() {
  console.clear();
  console.log('╔════════════════════════════════════════╗');
  console.log('║   录音上传功能完整测试                 ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const page = getCurrentPages()[getCurrentPages().length - 1];
  let passed = 0;
  let failed = 0;
  
  function test(name, condition) {
    if (condition) {
      console.log('✓', name);
      passed++;
    } else {
      console.error('✗', name);
      failed++;
    }
    return condition;
  }
  
  // ========== 第一部分：基础检查 ==========
  console.log('【第一部分：基础检查】\n');
  
  test('1. 在录音页面', page.route === 'pages/record/record');
  test('2. 有录音文件', page.data.hasRecording);
  test('3. 录音时长合格', page.data.recordingTime >= 30);
  test('4. 文件大小显示正常', page.data.recordingSizeDisplay !== '0.00 KB');
  test('5. 录音管理器存在', !!page.recorderManager);
  test('6. 云环境已初始化', !!wx.cloud);
  
  if (!page.data.hasRecording || page.data.recordingTime < 30) {
    console.log('\n⚠️ 基础检查未通过，请先完成30秒以上录音\n');
    console.log('总计: ' + passed + '通过, ' + failed + '失败');
    return;
  }
  
  // ========== 第二部分：云函数测试 ==========
  console.log('\n【第二部分：云函数测试】\n');
  
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
    test('7. 云函数可调用', true);
    test('8. 云函数有返回', !!res.result);
  } catch (err) {
    test('7. 云函数可调用', false);
    test('8. 云函数有返回', false);
    console.error('   错误:', err.errMsg);
    console.log('\n⚠️ 云函数测试失败，请检查是否已部署\n');
  }
  
  // ========== 第三部分：验证逻辑测试 ==========
  console.log('\n【第三部分：验证逻辑测试】\n');
  
  test('9. validateRecording方法存在', typeof page.validateRecording === 'function');
  test('10. uploadRecording方法存在', typeof page.uploadRecording === 'function');
  test('11. submitRecording方法存在', typeof page.submitRecording === 'function');
  
  // ========== 第四部分：文件检查 ==========
  console.log('\n【第四部分：文件访问测试】\n');
  
  let fileAccessible = false;
  await new Promise(resolve => {
    wx.getFileSystemManager().access({
      path: page.data.recordingPath,
      success: () => {
        fileAccessible = true;
        resolve();
      },
      fail: () => {
        fileAccessible = false;
        resolve();
      }
    });
  });
  
  test('12. 录音文件可访问', fileAccessible);
  
  // ========== 总结 ==========
  console.log('\n' + '='.repeat(44));
  console.log('测试完成');
  console.log('='.repeat(44));
  console.log('通过: ' + passed + ' / ' + (passed + failed));
  console.log('失败: ' + failed + ' / ' + (passed + failed));
  console.log('成功率: ' + ((passed / (passed + failed)) * 100).toFixed(1) + '%');
  console.log('='.repeat(44) + '\n');
  
  if (failed === 0) {
    console.log('✅ 所有测试通过！可以点击"提交"按钮测试实际上传');
    console.log('\n建议：');
    console.log('1. 先运行监控脚本（步骤4）');
    console.log('2. 然后点击"提交"按钮');
    console.log('3. 观察控制台输出');
  } else {
    console.log('⚠️ 有' + failed + '项测试失败');
    console.log('\n请检查：');
    if (!fileAccessible) console.log('- 录音文件是否存在');
    if (page.data.recordingTime < 30) console.log('- 录音时长是否足够');
    console.log('- audioProcess云函数是否已部署');
  }
})();
```

---

## 手动测试步骤

### 步骤A: 准备录音

1. 进入录音页面
2. 点击"开始录音"
3. 对着麦克风说话30秒以上
4. 点击"停止"
5. 检查质量分数显示

### 步骤B: 执行自动测试

1. 复制"完整测试流程"代码到控制台
2. 执行并查看结果
3. 确保所有测试通过

### 步骤C: 监控上传

1. 复制"实时监控上传过程"代码到控制台
2. 执行监控脚本
3. 点击页面上的"提交"按钮
4. 观察控制台输出的进度

### 步骤D: 验证结果

1. 等待上传完成
2. 复制"上传后验证"代码到控制台
3. 执行验证脚本
4. 检查云存储和数据库

---

## 预期输出示例

### 正常上传的输出：

```
========================================
  上传过程实时监控（已启动）
========================================

现在可以点击"提交"按钮

🚀 上传开始
📤 进度: 10% (0.5秒)
   → 准备阶段完成
📤 进度: 30% (1.2秒)
📤 进度: 50% (2.1秒)
📤 进度: 70% (3.5秒)
   → 上传阶段完成
📤 进度: 80% (4.2秒)
   → 开始处理...
📤 进度: 100% (5.8秒)
   → 处理完成
✅ 上传成功！总耗时: 5.8秒
```

---

## 故障排查

### 问题1: 云函数调用失败

**症状**: `errCode: -1`

**解决**:
```bash
# 重新部署云函数
1. 右键 cloudfunctions/audioProcess/
2. 选择"上传并部署：云端安装依赖"
3. 等待完成
```

### 问题2: 上传卡在某个进度

**症状**: 进度停止不动

**解决**:
1. 检查网络连接
2. 查看云函数日志
3. 尝试重新上传

### 问题3: 验证失败

**症状**: validateRecording返回false

**解决**:
1. 检查录音时长 >= 30秒
2. 检查文件大小 <= 50MB
3. 查看控制台错误信息

---

## 测试检查清单

- [ ] 基础检查全部通过
- [ ] 云函数可以调用
- [ ] 文件验证正常
- [ ] 可以开始上传
- [ ] 进度显示正常(0% → 100%)
- [ ] 上传耗时合理(<10秒)
- [ ] 显示成功提示
- [ ] 云存储有文件
- [ ] 数据库有记录
- [ ] 弹出后续操作对话框

---

现在请：
1. **确保在录音页面并已完成录音（>=30秒）**
2. **复制"完整测试流程"代码到控制台执行**
3. **告诉我测试结果**

我会根据结果帮你继续！
