#!/usr/bin/env python3
"""
测试脚本 - 验证 API 服务器功能
"""

import requests
import json
import sys
from pathlib import Path

# API 基础 URL
BASE_URL = "http://localhost:8000"

def print_header(text):
    """打印标题"""
    print("\n" + "=" * 50)
    print(text)
    print("=" * 50 + "\n")

def test_health_check():
    """测试健康检查"""
    print_header("测试 1: 健康检查")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        data = response.json()
        
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        if data.get("status") == "healthy":
            print("✓ 健康检查通过")
            return True
        else:
            print("✗ 服务器状态异常")
            return False
            
    except Exception as e:
        print(f"✗ 健康检查失败: {e}")
        return False

def test_extract_embedding():
    """测试声纹提取"""
    print_header("测试 2: 声纹提取")
    
    # 创建测试音频（简单的正弦波）
    import numpy as np
    import soundfile as sf
    import io
    
    # 生成测试音频（1秒，440Hz 正弦波）
    sample_rate = 16000
    duration = 2  # 秒
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = np.sin(2 * np.pi * 440 * t) * 0.5
    
    # 保存为 WAV
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format='WAV')
    buffer.seek(0)
    
    try:
        # 发送请求
        files = {'audio': ('test_audio.wav', buffer, 'audio/wav')}
        response = requests.post(f"{BASE_URL}/api/v1/extract-embedding", files=files)
        data = response.json()
        
        print(f"状态码: {response.status_code}")
        
        if data.get("success"):
            print(f"✓ 声纹提取成功")
            print(f"  维度: {data.get('dimension')}")
            print(f"  前5个值: {data.get('embedding', [])[:5]}")
            return True, data.get('embedding')
        else:
            print(f"✗ 声纹提取失败: {data.get('error')}")
            return False, None
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False, None

def test_clone_voice():
    """测试语音克隆"""
    print_header("测试 3: 语音克隆")
    
    # 创建测试音频
    import numpy as np
    import soundfile as sf
    import io
    
    sample_rate = 16000
    duration = 2
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = np.sin(2 * np.pi * 440 * t) * 0.5
    
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format='WAV')
    buffer.seek(0)
    
    try:
        # 发送请求
        files = {'audio': ('test_audio.wav', buffer, 'audio/wav')}
        data = {'text': '你好，这是一个测试'}
        
        response = requests.post(f"{BASE_URL}/api/v1/clone-voice", files=files, data=data)
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✓ 语音克隆成功")
            print(f"  响应大小: {len(response.content)} bytes")
            
            # 保存输出音频
            output_path = "output_cloned.wav"
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"  已保存到: {output_path}")
            return True
        else:
            print(f"✗ 语音克隆失败")
            try:
                error_data = response.json()
                print(f"  错误: {error_data}")
            except:
                print(f"  响应内容: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False

def test_synthesize_with_embedding(embedding):
    """测试使用声纹合成"""
    print_header("测试 4: 使用声纹合成")
    
    if embedding is None:
        print("✗ 跳过测试（需要先提取声纹）")
        return False
    
    try:
        # 发送请求
        data = {
            'embedding': json.dumps(embedding),
            'text': '这是使用声纹特征合成的语音'
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/synthesize-with-embedding", data=data)
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✓ 合成成功")
            print(f"  响应大小: {len(response.content)} bytes")
            
            # 保存输出音频
            output_path = "output_synthesized.wav"
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"  已保存到: {output_path}")
            return True
        else:
            print(f"✗ 合成失败")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False

def main():
    """主测试流程"""
    print("\n" + "=" * 50)
    print("语音克隆 API 服务器 - 功能测试")
    print("=" * 50)
    
    print(f"\nAPI 地址: {BASE_URL}")
    print("提示: 请确保服务器正在运行\n")
    
    results = []
    
    # 测试 1: 健康检查
    result = test_health_check()
    results.append(("健康检查", result))
    
    if not result:
        print("\n✗ 服务器未运行或无法连接")
        print("请先启动服务器: ./start_server.sh")
        sys.exit(1)
    
    # 测试 2: 声纹提取
    result, embedding = test_extract_embedding()
    results.append(("声纹提取", result))
    
    # 测试 3: 语音克隆
    result = test_clone_voice()
    results.append(("语音克隆", result))
    
    # 测试 4: 使用声纹合成
    result = test_synthesize_with_embedding(embedding)
    results.append(("声纹合成", result))
    
    # 汇总结果
    print_header("测试结果汇总")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"  {name}: {status}")
    
    print(f"\n总计: {passed}/{total} 通过")
    
    if passed == total:
        print("\n✓ 所有测试通过！")
        sys.exit(0)
    else:
        print(f"\n✗ {total - passed} 个测试失败")
        sys.exit(1)

if __name__ == "__main__":
    main()
