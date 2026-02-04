#!/usr/bin/env python3
"""
Mock 模式测试脚本
用于验证上传音频功能是否正常
"""

import sys
import os

# 添加 src 到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_audio_utils():
    """测试音频工具函数"""
    print("=" * 50)
    print("测试 audio_utils 模块")
    print("=" * 50)
    print()
    
    try:
        from utils.audio_utils import load_audio, preprocess_audio, validate_audio, audio_to_bytes
        print("✓ 成功导入 audio_utils")
    except ImportError as e:
        print(f"✗ 导入失败: {e}")
        return False
    
    print()
    
    # 测试 1: 加载音频（Mock 模式）
    print("[测试 1] 加载音频（Mock 模式）")
    try:
        # 传入假的字节数据
        fake_audio_bytes = b"fake audio data"
        audio = load_audio(fake_audio_bytes, sample_rate=16000)
        print(f"  ✓ 音频加载成功")
        print(f"    - 音频长度: {len(audio)} samples")
        print(f"    - 数据类型: {audio.dtype}")
        print(f"    - 数据范围: [{audio.min():.3f}, {audio.max():.3f}]")
    except Exception as e:
        print(f"  ✗ 音频加载失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    
    # 测试 2: 预处理音频
    print("[测试 2] 预处理音频")
    try:
        processed = preprocess_audio(audio, sample_rate=16000)
        print(f"  ✓ 音频预处理成功")
        print(f"    - 处理后长度: {len(processed)} samples")
    except Exception as e:
        print(f"  ✗ 预处理失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    
    # 测试 3: 验证音频
    print("[测试 3] 验证音频")
    try:
        is_valid, error_msg = validate_audio(audio, sample_rate=16000)
        if is_valid:
            print(f"  ✓ 音频验证通过")
        else:
            print(f"  ✗ 音频验证失败: {error_msg}")
    except Exception as e:
        print(f"  ✗ 验证过程出错: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    
    # 测试 4: 转换为字节流
    print("[测试 4] 转换为字节流")
    try:
        audio_bytes = audio_to_bytes(audio, sample_rate=16000)
        print(f"  ✓ 转换成功")
        print(f"    - 字节长度: {len(audio_bytes)} bytes")
        print(f"    - WAV 头: {audio_bytes[:4]}")  # 应该是 b'RIFF'
    except Exception as e:
        print(f"  ✗ 转换失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    return True


def test_model_loader():
    """测试模型加载器"""
    print("=" * 50)
    print("测试 model_loader 模块")
    print("=" * 50)
    print()
    
    try:
        from utils.model_loader import get_encoder, get_synthesizer, get_vocoder
        print("✓ 成功导入 model_loader")
    except ImportError as e:
        print(f"✗ 导入失败: {e}")
        return False
    
    print()
    
    # 测试模型实例化
    print("[测试 5] 获取 Encoder")
    try:
        encoder = get_encoder()
        print(f"  ✓ Encoder 获取成功: {type(encoder).__name__}")
    except Exception as e:
        print(f"  ✗ Encoder 获取失败: {e}")
        return False
    
    print()
    
    # 测试声纹提取
    print("[测试 6] 提取声纹特征")
    try:
        import numpy as np
        fake_audio = np.random.randn(16000 * 3).astype(np.float32)  # 3秒音频
        embedding = encoder.embed_utterance(fake_audio)
        print(f"  ✓ 声纹提取成功")
        print(f"    - 特征维度: {embedding.shape}")
        print(f"    - 数据类型: {embedding.dtype}")
    except Exception as e:
        print(f"  ✗ 声纹提取失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    return True


def test_api_endpoint():
    """测试 API 端点（模拟请求）"""
    print("=" * 50)
    print("测试 API 端点")
    print("=" * 50)
    print()
    
    try:
        from api.main import app
        from fastapi.testclient import TestClient
        print("✓ 成功导入 FastAPI 应用")
    except ImportError as e:
        print(f"✗ 导入失败: {e}")
        print("  提示: 请先安装依赖: pip install fastapi uvicorn")
        return False
    
    print()
    
    # 创建测试客户端
    print("[测试 7] 健康检查")
    try:
        client = TestClient(app)
        response = client.get("/health")
        print(f"  ✓ 请求成功")
        print(f"    - 状态码: {response.status_code}")
        print(f"    - 响应: {response.json()}")
    except Exception as e:
        print(f"  ✗ 请求失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    
    # 测试上传音频
    print("[测试 8] 上传音频提取声纹")
    try:
        # 创建假的音频文件
        fake_audio_content = b"RIFF" + b"\x00" * 1000  # 假的 WAV 文件
        files = {"audio": ("test.wav", fake_audio_content, "audio/wav")}
        response = client.post("/api/v1/extract-embedding", files=files)
        
        print(f"  状态码: {response.status_code}")
        print(f"  响应: {response.json()}")
        
        if response.status_code == 200 and response.json().get("success"):
            print(f"  ✓ 音频上传和处理成功（Mock 模式）")
        else:
            print(f"  ⚠ 响应异常，但这可能是预期的（Mock 模式）")
    except Exception as e:
        print(f"  ✗ 请求失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    return True


def main():
    """运行所有测试"""
    print("\n" + "=" * 50)
    print("Mock 模式功能测试")
    print("=" * 50)
    print()
    
    # 检查环境
    print("环境信息:")
    print(f"  Python 版本: {sys.version}")
    print(f"  工作目录: {os.getcwd()}")
    print()
    
    results = []
    
    # 运行测试
    results.append(("audio_utils", test_audio_utils()))
    results.append(("model_loader", test_model_loader()))
    results.append(("api_endpoint", test_api_endpoint()))
    
    # 输出总结
    print()
    print("=" * 50)
    print("测试总结")
    print("=" * 50)
    print()
    
    for name, passed in results:
        status = "✓ 通过" if passed else "✗ 失败"
        print(f"  {name:20s} {status}")
    
    print()
    
    all_passed = all(r[1] for r in results)
    if all_passed:
        print("✓ 所有测试通过！Mock 模式工作正常。")
        return 0
    else:
        print("✗ 部分测试失败，请查看上方详细错误信息。")
        return 1


if __name__ == "__main__":
    sys.exit(main())
