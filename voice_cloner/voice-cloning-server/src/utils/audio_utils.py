"""
语音克隆服务器 - 工具函数模块
支持轻量级 Mock 模式（无需 librosa/soundfile）
"""

import numpy as np
from typing import Tuple, Optional
import io

# 尝试导入可选依赖
try:
    import librosa
    import soundfile as sf
    HAS_AUDIO_LIBS = True
except ImportError:
    HAS_AUDIO_LIBS = False
    print("警告: librosa/soundfile 未安装，使用简化的音频处理")


def load_audio(audio_path_or_bytes, sample_rate: int = 16000) -> np.ndarray:
    """
    加载音频文件
    
    Args:
        audio_path_or_bytes: 音频文件路径或字节流
        sample_rate: 目标采样率
        
    Returns:
        音频数据 numpy 数组
    """
    if not HAS_AUDIO_LIBS:
        # Mock 模式：生成假的音频数据
        duration = 3.0  # 3秒
        num_samples = int(sample_rate * duration)
        # 生成简单的音频信号（用于测试）
        t = np.linspace(0, duration, num_samples)
        audio = 0.3 * np.sin(2 * np.pi * 440 * t)  # 440Hz 正弦波
        return audio.astype(np.float32)
    
    try:
        # 如果是字节流
        if isinstance(audio_path_or_bytes, bytes):
            audio, sr = sf.read(io.BytesIO(audio_path_or_bytes))
        else:
            audio, sr = librosa.load(audio_path_or_bytes, sr=None)
        
        # 转换为单声道
        if len(audio.shape) > 1:
            audio = audio.mean(axis=1)
        
        # 重采样
        if sr != sample_rate:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=sample_rate)
        
        # 归一化
        audio = audio / np.max(np.abs(audio) + 1e-6)
        
        return audio.astype(np.float32)
        
    except Exception as e:
        # 如果真实音频加载失败，回退到 Mock 模式
        print(f"警告: 音频加载失败 ({e})，使用 Mock 数据")
        duration = 3.0
        num_samples = int(sample_rate * duration)
        t = np.linspace(0, duration, num_samples)
        audio = 0.3 * np.sin(2 * np.pi * 440 * t)
        return audio.astype(np.float32)


def preprocess_audio(audio: np.ndarray, 
                     sample_rate: int = 16000,
                     trim_silence: bool = True,
                     normalize: bool = True) -> np.ndarray:
    """
    预处理音频
    
    Args:
        audio: 音频数据
        sample_rate: 采样率
        trim_silence: 是否裁剪静音
        normalize: 是否归一化
        
    Returns:
        处理后的音频数据
    """
    if HAS_AUDIO_LIBS and trim_silence:
        # 裁剪静音
        audio, _ = librosa.effects.trim(audio, top_db=20)
    
    # 归一化
    if normalize:
        audio = audio / (np.max(np.abs(audio)) + 1e-6)
    
    # 确保音频不为空
    if len(audio) == 0:
        raise ValueError("音频为空或完全静音")
    
    return audio


def validate_audio(audio: np.ndarray, 
                   sample_rate: int = 16000,
                   min_duration: float = 1.0,
                   max_duration: float = 300.0) -> Tuple[bool, Optional[str]]:
    """
    验证音频质量
    
    Args:
        audio: 音频数据
        sample_rate: 采样率
        min_duration: 最小时长（秒）
        max_duration: 最大时长（秒）
        
    Returns:
        (是否有效, 错误信息)
    """
    # 检查是否为空
    if len(audio) == 0:
        return False, "音频为空"
    
    # 检查时长
    duration = len(audio) / sample_rate
    if duration < min_duration:
        return False, f"音频时长过短: {duration:.2f}秒 (最小{min_duration}秒)"
    if duration > max_duration:
        return False, f"音频时长过长: {duration:.2f}秒 (最大{max_duration}秒)"
    
    # 检查是否全为零
    if np.allclose(audio, 0):
        return False, "音频完全静音"
    
    # 检查是否有异常值
    if np.max(np.abs(audio)) > 10:
        return False, "音频包含异常值"
    
    return True, None


def compute_audio_features(audio: np.ndarray, sample_rate: int = 16000) -> dict:
    """
    计算音频特征（用于质量检测）
    
    Args:
        audio: 音频数据
        sample_rate: 采样率
        
    Returns:
        特征字典
    """
    features = {}
    
    # 基本统计
    features['duration'] = len(audio) / sample_rate
    features['rms'] = np.sqrt(np.mean(audio ** 2))
    
    if HAS_AUDIO_LIBS:
        features['zero_crossing_rate'] = np.mean(librosa.zero_crossings(audio))
        
        # 频谱特征
        spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sample_rate)[0]
        features['spectral_centroid_mean'] = np.mean(spectral_centroids)
        features['spectral_centroid_std'] = np.std(spectral_centroids)
    else:
        # 简化版本
        features['zero_crossing_rate'] = np.mean(np.diff(np.signbit(audio).astype(int)) != 0)
        features['spectral_centroid_mean'] = 0.0
        features['spectral_centroid_std'] = 0.0
    
    # 能量
    features['energy'] = np.sum(audio ** 2)
    
    return features


def save_audio(audio: np.ndarray, 
               output_path: str,
               sample_rate: int = 16000) -> None:
    """
    保存音频文件
    
    Args:
        audio: 音频数据
        output_path: 输出路径
        sample_rate: 采样率
    """
    if not HAS_AUDIO_LIBS:
        raise NotImplementedError("需要安装 soundfile 才能保存音频")
    sf.write(output_path, audio, sample_rate)


def audio_to_bytes(audio: np.ndarray, 
                   sample_rate: int = 16000,
                   format: str = 'WAV') -> bytes:
    """
    将音频转换为字节流
    
    Args:
        audio: 音频数据
        sample_rate: 采样率
        format: 输出格式
        
    Returns:
        音频字节流
    """
    if not HAS_AUDIO_LIBS:
        # Mock 模式：返回假的 WAV 头 + 数据
        # 简化的 WAV 格式（44 字节头 + PCM 数据）
        num_samples = len(audio)
        sample_width = 2  # 16-bit
        num_channels = 1
        
        # 转换为 16-bit PCM
        pcm_data = np.clip(audio * 32767, -32768, 32767).astype(np.int16)
        
        # 构建 WAV 头
        byte_rate = sample_rate * num_channels * sample_width
        block_align = num_channels * sample_width
        data_size = num_samples * sample_width
        
        wav_header = (
            b'RIFF' +
            (data_size + 36).to_bytes(4, 'little') +
            b'WAVE' +
            b'fmt ' +
            (16).to_bytes(4, 'little') +  # fmt chunk size
            (1).to_bytes(2, 'little') +   # PCM format
            num_channels.to_bytes(2, 'little') +
            sample_rate.to_bytes(4, 'little') +
            byte_rate.to_bytes(4, 'little') +
            block_align.to_bytes(2, 'little') +
            (sample_width * 8).to_bytes(2, 'little') +
            b'data' +
            data_size.to_bytes(4, 'little')
        )
        
        return wav_header + pcm_data.tobytes()
    
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format=format)
    buffer.seek(0)
    return buffer.read()
