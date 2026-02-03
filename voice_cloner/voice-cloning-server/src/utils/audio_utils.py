"""
语音克隆服务器 - 工具函数模块
"""

import numpy as np
import librosa
import soundfile as sf
from typing import Tuple, Optional
import io

def load_audio(audio_path_or_bytes, sample_rate: int = 16000) -> np.ndarray:
    """
    加载音频文件
    
    Args:
        audio_path_or_bytes: 音频文件路径或字节流
        sample_rate: 目标采样率
        
    Returns:
        音频数据 numpy 数组
    """
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
        raise ValueError(f"加载音频失败: {str(e)}")


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
    # 裁剪静音
    if trim_silence:
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
    features['zero_crossing_rate'] = np.mean(librosa.zero_crossings(audio))
    
    # 频谱特征
    spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sample_rate)[0]
    features['spectral_centroid_mean'] = np.mean(spectral_centroids)
    features['spectral_centroid_std'] = np.std(spectral_centroids)
    
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
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format=format)
    buffer.seek(0)
    return buffer.read()
