// pages/record/record.js
const app = getApp();

Page({
  data: {
    // 录音状态
    isRecording: false,
    isPaused: false,
    hasRecording: false,
    
    // 录音信息
    recordingTime: 0,          // 录音时长(秒)
    recordingTimeDisplay: '00:00',
    maxDuration: 300,          // 最大录音时长(5分钟)
    minDuration: 30,           // 最小录音时长(30秒)
    
    // 录音文件
    recordingPath: '',
    recordingSize: 0,
    recordingSizeDisplay: '0.00 KB',  // 添加格式化的文件大小显示
    
    // 参考文本
    referenceText: '',
    referenceTextIndex: 0,     // 当前高亮的句子索引
    referenceTextSentences: [],
    
    // 录音质量
    qualityChecked: false,
    qualityResult: null,
    
    // 波形数据
    volumeLevels: [],
    
    // UI状态
    showGuide: true,
    permissionGranted: false,
    
    // 上传状态
    uploading: false,
    uploadProgress: 0,
    uploadRetryCount: 0,
    maxRetryCount: 3
  },
  
  // 录音管理器
  recorderManager: null,
  recordingTimer: null,
  
  onLoad() {
    this.initRecorderManager();
    this.loadReferenceText();
    this.checkRecordPermission();
  },
  
  onUnload() {
    this.stopRecording();
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
  },
  
  /**
   * 初始化录音管理器
   */
  initRecorderManager() {
    this.recorderManager = wx.getRecorderManager();
    
    // 录音开始事件
    this.recorderManager.onStart(() => {
      console.log('录音开始');
      this.setData({
        isRecording: true,
        isPaused: false,
        hasRecording: false,
        recordingTime: 0
      });
      
      this.startTimer();
    });
    
    // 录音暂停事件
    this.recorderManager.onPause(() => {
      console.log('录音暂停');
      this.setData({
        isPaused: true
      });
      this.stopTimer();
    });
    
    // 录音继续事件
    this.recorderManager.onResume(() => {
      console.log('录音继续');
      this.setData({
        isPaused: false
      });
      this.startTimer();
    });
    
    // 录音停止事件
    this.recorderManager.onStop((res) => {
      console.log('录音停止', res);
      this.stopTimer();
      
      // 格式化文件大小
      const sizeKB = (res.fileSize / 1024).toFixed(2);
      const sizeDisplay = sizeKB + ' KB';
      
      this.setData({
        isRecording: false,
        isPaused: false,
        hasRecording: true,
        recordingPath: res.tempFilePath,
        recordingSize: res.fileSize,
        recordingSizeDisplay: sizeDisplay,
        recordingTime: Math.floor(res.duration / 1000)
      });
      
      // 检查录音质量
      this.checkRecordingQuality();
    });
    
    // 录音错误事件
    this.recorderManager.onError((err) => {
      console.error('录音错误', err);
      this.stopTimer();
      
      wx.showToast({
        title: '录音失败,请重试',
        icon: 'none'
      });
      
      this.setData({
        isRecording: false,
        isPaused: false
      });
    });
    
    // 实时音量监听(用于波形显示)
    this.recorderManager.onFrameRecorded((res) => {
      const { frameBuffer } = res;
      // 计算音量等级(简化版)
      const volume = this.calculateVolume(frameBuffer);
      
      const levels = this.data.volumeLevels.slice(-50); // 保留最近50个
      levels.push(volume);
      
      this.setData({
        volumeLevels: levels
      });
    });
  },
  
  /**
   * 检查录音权限
   */
  checkRecordPermission() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.record']) {
          this.setData({
            permissionGranted: true,
            showGuide: false
          });
        } else {
          this.setData({
            permissionGranted: false,
            showGuide: true
          });
        }
      }
    });
  },
  
  /**
   * 请求录音权限
   */
  requestRecordPermission() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.setData({
          permissionGranted: true,
          showGuide: false
        });
        wx.showToast({
          title: '已授权麦克风',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showModal({
          title: '需要麦克风权限',
          content: '请在设置中开启麦克风权限',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  },
  
  /**
   * 开始录音
   */
  startRecording() {
    if (!this.data.permissionGranted) {
      this.requestRecordPermission();
      return;
    }
    
    const options = {
      duration: this.data.maxDuration * 1000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'wav',  // 使用 WAV 格式以获得更好的音质
      frameSize: 10
    };
    
    this.recorderManager.start(options);
    
    this.setData({
      volumeLevels: [],
      qualityChecked: false,
      qualityResult: null,
      referenceTextIndex: 0
    });
  },
  
  /**
   * 暂停录音
   */
  pauseRecording() {
    this.recorderManager.pause();
  },
  
  /**
   * 继续录音
   */
  resumeRecording() {
    this.recorderManager.resume();
  },
  
  /**
   * 停止录音
   */
  stopRecording() {
    if (this.data.isRecording) {
      this.recorderManager.stop();
    }
  },
  
  /**
   * 重新录制
   */
  reRecord() {
    wx.showModal({
      title: '确认重新录制?',
      content: '当前录音将被删除',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            hasRecording: false,
            recordingPath: '',
            recordingSize: 0,
            recordingTime: 0,
            qualityChecked: false,
            qualityResult: null,
            volumeLevels: []
          });
        }
      }
    });
  },
  
  /**
   * 开始计时器
   */
  startTimer() {
    this.recordingTimer = setInterval(() => {
      const time = this.data.recordingTime + 1;
      
      // 检查是否达到最大时长
      if (time >= this.data.maxDuration) {
        this.stopRecording();
        wx.showToast({
          title: '已达最大录音时长',
          icon: 'none'
        });
        return;
      }
      
      // 更新参考文本高亮(每20秒切换一句)
      const sentenceIndex = Math.floor(time / 20) % this.data.referenceTextSentences.length;
      
      this.setData({
        recordingTime: time,
        recordingTimeDisplay: this.formatTime(time),
        referenceTextIndex: sentenceIndex
      });
    }, 1000);
  },
  
  /**
   * 停止计时器
   */
  stopTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  },
  
  /**
   * 格式化时间显示
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },
  
  /**
   * 计算音量等级
   */
  calculateVolume(buffer) {
    // 简化的音量计算
    const dataView = new DataView(buffer);
    let sum = 0;
    const length = dataView.byteLength / 2;
    
    for (let i = 0; i < length; i++) {
      const value = dataView.getInt16(i * 2, true);
      sum += Math.abs(value);
    }
    
    const average = sum / length;
    const volume = Math.min(100, (average / 32768) * 100);
    
    return Math.floor(volume);
  },
  
  /**
   * 加载参考文本
   */
  loadReferenceText() {
    // 参考文本,覆盖常见音素
    const text = `
      欢迎使用语音克隆助手。请用您自然的声音朗读以下文字。
      我喜欢在春天的早晨散步,感受温暖的阳光和清新的空气。
      科技正在改变我们的生活方式,让世界变得更加便捷和高效。
      保持积极乐观的心态,勇敢面对生活中的各种挑战和困难。
      音乐能够治愈心灵,带给我们快乐和放松的美好时光。
      学习新知识需要耐心和毅力,坚持不懈就能看到进步。
      友谊和爱是人生中最宝贵的财富,值得我们用心珍惜。
      健康的生活方式包括均衡饮食、适量运动和充足睡眠。
    `.trim();
    
    const sentences = text.split('\n').map(s => s.trim()).filter(s => s);
    
    this.setData({
      referenceText: text,
      referenceTextSentences: sentences
    });
  },
  
  /**
   * 检查录音质量
   */
  checkRecordingQuality() {
    const { recordingTime, volumeLevels } = this.data;
    
    // 时长检查
    if (recordingTime < this.data.minDuration) {
      this.setData({
        qualityChecked: true,
        qualityResult: {
          passed: false,
          score: 0,
          issues: ['录音时长过短'],
          suggestion: `建议至少录制 ${this.data.minDuration} 秒以获得更好效果`
        }
      });
      return;
    }
    
    // 音量检查
    const avgVolume = volumeLevels.reduce((sum, v) => sum + v, 0) / volumeLevels.length;
    const silentFrames = volumeLevels.filter(v => v < 5).length;
    const silentRatio = silentFrames / volumeLevels.length;
    
    const issues = [];
    let score = 100;
    
    if (avgVolume < 10) {
      issues.push('音量过低');
      score -= 30;
    }
    
    if (silentRatio > 0.3) {
      issues.push('静音片段过多');
      score -= 20;
    }
    
    if (recordingTime < 60) {
      issues.push('录音时长较短');
      score -= 10;
    }
    
    const passed = score >= 60;
    
    this.setData({
      qualityChecked: true,
      qualityResult: {
        passed,
        score,
        issues: issues.length > 0 ? issues : ['录音质量良好'],
        suggestion: passed ? '可以继续下一步' : '建议重新录制以获得更好效果'
      }
    });
    
    // 显示结果
    if (passed) {
      wx.showToast({
        title: '录音质量良好',
        icon: 'success'
      });
    } else {
      wx.showModal({
        title: '录音质量提示',
        content: `${issues.join(', ')}。${this.data.qualityResult.suggestion}`,
        confirmText: '重新录制',
        cancelText: '继续',
        success: (res) => {
          if (res.confirm) {
            this.reRecord();
          }
        }
      });
    }
  },
  
  /**
   * 播放录音
   */
  playRecording() {
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = this.data.recordingPath;
    innerAudioContext.play();
    
    innerAudioContext.onError((err) => {
      console.error('播放失败', err);
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    });
  },
  
  /**
   * 提交录音
   */
  submitRecording() {
    if (!this.data.hasRecording) {
      wx.showToast({
        title: '请先录制声音',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.recordingTime < this.data.minDuration) {
      wx.showToast({
        title: `录音时长至少需要${this.data.minDuration}秒`,
        icon: 'none'
      });
      return;
    }
    
    // 验证录音
    if (!this.validateRecording()) {
      return;
    }
    
    this.setData({
      uploading: true,
      uploadProgress: 0,
      uploadRetryCount: 0
    });
    
    wx.showLoading({ title: '准备上传...' });
    
    // 读取文件
    wx.getFileSystemManager().readFile({
      filePath: this.data.recordingPath,
      success: (res) => {
        // 上传到云存储
        this.uploadRecording(res.data);
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('读取文件失败', err);
        this.setData({ uploading: false });
        wx.showToast({
          title: '上传失败,请重试',
          icon: 'none'
        });
      }
    });
  },
  
  /**
   * 验证录音
   */
  validateRecording() {
    // 检查文件大小 (最大50MB)
    const maxSize = 50 * 1024 * 1024;
    if (this.data.recordingSize > maxSize) {
      wx.showModal({
        title: '文件过大',
        content: `录音文件大小为${(this.data.recordingSize / 1024 / 1024).toFixed(2)}MB，超过50MB限制`,
        showCancel: false
      });
      return false;
    }
    
    // 检查时长
    if (this.data.recordingTime < this.data.minDuration) {
      wx.showModal({
        title: '录音过短',
        content: `录音时长为${this.data.recordingTime}秒，需要至少${this.data.minDuration}秒`,
        showCancel: false
      });
      return false;
    }
    
    if (this.data.recordingTime > this.data.maxDuration) {
      wx.showModal({
        title: '录音过长',
        content: `录音时长为${this.data.recordingTime}秒，超过最大${this.data.maxDuration}秒限制`,
        showCancel: false
      });
      return false;
    }
    
    // 检查质量（如果质量不佳，提示用户但允许继续）
    if (this.data.qualityResult && !this.data.qualityResult.passed) {
      // 由于这是同步函数，这里只记录警告，在UI上已经显示了质量提示
      console.warn('录音质量不佳，但允许用户上传');
    }
    
    return true;
  },
  
  /**
   * 上传录音
   */
  uploadRecording(fileContent) {
    const filename = `recording_${Date.now()}.wav`;  // 使用 WAV 格式
    const userId = app.globalData.userInfo?.openid || 'anonymous';
    
    // 更新进度
    this.setData({ uploadProgress: 10 });
    wx.showLoading({ title: '上传中 10%' });
    
    // 使用云存储直接上传
    const cloudPath = `recordings/${userId}/${filename}`;
    
    const uploadTask = wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: this.data.recordingPath,
      success: (res) => {
        console.log('上传成功', res);
        this.setData({ uploadProgress: 80 });
        wx.showLoading({ title: '处理中 80%' });
        
        // 调用云函数处理音频
        this.processAudioFile(res.fileID, fileContent);
      },
      fail: (err) => {
        console.error('上传失败', err);
        this.handleUploadError(err, fileContent);
      }
    });
    
    // 监听上传进度
    uploadTask.onProgressUpdate((res) => {
      const progress = Math.floor(res.progress * 0.7); // 上传占70%进度
      this.setData({ uploadProgress: progress });
      wx.showLoading({ title: `上传中 ${progress}%` });
    });
  },
  
  /**
   * 处理音频文件（格式转换和验证）
   */
  processAudioFile(fileID, fileContent) {
    wx.cloud.callFunction({
      name: 'audioProcess',
      data: {
        action: 'processRecording',
        fileID: fileID,
        duration: this.data.recordingTime,
        format: 'wav',  // WAV 格式
        size: this.data.recordingSize
      },
      success: (res) => {
        wx.hideLoading();
        this.setData({ 
          uploading: false,
          uploadProgress: 100 
        });
        
        if (res.result.success) {
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
          
          // 触发特征提取
          this.triggerFeatureExtraction(res.result.data.fileID, res.result.data.processedFileID);
        } else {
          wx.showModal({
            title: '处理失败',
            content: res.result.error || '音频处理失败，请重试',
            showCancel: false
          });
        }
      },
      fail: (err) => {
        console.error('处理失败', err);
        this.handleUploadError(err, fileContent);
      }
    });
  },
  
  /**
   * 处理上传错误
   */
  handleUploadError(error, fileContent) {
    wx.hideLoading();
    
    // 判断是否可以重试
    if (this.data.uploadRetryCount < this.data.maxRetryCount) {
      wx.showModal({
        title: '上传失败',
        content: `上传失败，是否重试？(${this.data.uploadRetryCount + 1}/${this.data.maxRetryCount})`,
        confirmText: '重试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              uploadRetryCount: this.data.uploadRetryCount + 1
            });
            
            // 延迟1秒后重试
            setTimeout(() => {
              this.uploadRecording(fileContent);
            }, 1000);
          } else {
            this.setData({ 
              uploading: false,
              uploadProgress: 0 
            });
          }
        }
      });
    } else {
      // 超过重试次数
      this.setData({ 
        uploading: false,
        uploadProgress: 0 
      });
      
      wx.showModal({
        title: '上传失败',
        content: '已达到最大重试次数，请检查网络后重试',
        showCancel: false
      });
    }
  },
  
  /**
   * 触发特征提取
   */
  triggerFeatureExtraction(originalFileID, processedFileID) {
    wx.showModal({
      title: '上传成功',
      content: '是否立即开始提取声音特征?',
      confirmText: '开始提取',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/profile/profile?action=extract&fileID=${processedFileID || originalFileID}&originalFileID=${originalFileID}`
          });
        } else {
          wx.navigateBack();
        }
      }
    });
  },
  
  /**
   * 关闭引导
   */
  closeGuide() {
    this.setData({
      showGuide: false
    });
  }
});
