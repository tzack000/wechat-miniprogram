"""
FastAPI主应用
语音克隆API服务 - 简化版

注意：这是一个模拟实现，用于测试和开发
实际部署时需要：
1. 下载真实的 SV2TTS 预训练模型
2. 替换 model_loader.py 中的模拟实现为真实的模型加载代码
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import io
from loguru import logger
import os
import sys
from dotenv import load_dotenv

# 添加 src 到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from utils.audio_utils import load_audio, preprocess_audio, validate_audio, audio_to_bytes
from utils.model_loader import get_encoder, get_synthesizer, get_vocoder, load_all_models

# 加载环境变量
load_dotenv()

# 配置日志
logger.add("logs/api.log", rotation="1 day", retention="7 days", level="INFO")

app = FastAPI(
    title="Voice Cloning API",
    description="语音克隆服务 - 基于MockingBird (模拟版)",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class EmbeddingResponse(BaseModel):
    """声纹特征响应"""
    success: bool
    embedding: Optional[List[float]] = None
    dimension: Optional[int] = None
    error: Optional[str] = None

class BatchSynthesisRequest(BaseModel):
    """批量合成请求"""
    embedding: List[float]
    texts: List[str]

class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    models_loaded: bool
    version: str
    mode: str

# 模型加载状态
models_loaded = False


@app.on_event("startup")
async def startup_event():
    """应用启动时加载模型"""
    global models_loaded
    
    try:
        logger.info("=" * 50)
        logger.info("语音克隆 API 服务器启动中...")
        logger.info("=" * 50)
        
        # 获取模型路径
        encoder_path = os.getenv("MODEL_ENCODER_PATH", "models/encoder/encoder.pt")
        synthesizer_path = os.getenv("MODEL_SYNTHESIZER_PATH", "models/synthesizer/synthesizer.pt")
        vocoder_path = os.getenv("MODEL_VOCODER_PATH", "models/vocoder/vocoder.pt")
        
        logger.info(f"Encoder 路径: {encoder_path}")
        logger.info(f"Synthesizer 路径: {synthesizer_path}")
        logger.info(f"Vocoder 路径: {vocoder_path}")
        
        # 加载模型（模拟实现）
        logger.info("开始加载模型（模拟模式）...")
        load_all_models(encoder_path, synthesizer_path, vocoder_path)
        
        models_loaded = True
        
        logger.info("=" * 50)
        logger.info("✓ 服务器启动成功！")
        logger.info("✓ 模型加载完成（模拟模式）")
        logger.info("访问 http://localhost:8000/docs 查看 API 文档")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"模型加载失败: {e}")
        logger.warning("服务器将以降级模式运行")


@app.get("/", response_model=dict)
async def root():
    """根路径"""
    return {
        "message": "Voice Cloning API Server",
        "version": "1.0.0",
        "mode": "mock",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    return HealthResponse(
        status="healthy" if models_loaded else "degraded",
        models_loaded=models_loaded,
        version="1.0.0",
        mode="mock"
    )


@app.post("/api/v1/extract-embedding", response_model=EmbeddingResponse)
async def extract_embedding(audio: UploadFile = File(...)):
    """
    提取声纹特征
    
    Parameters:
    - audio: 音频文件（WAV/MP3格式）
    
    Returns:
    - embedding: 声纹特征向量（256维）
    """
    try:
        logger.info(f"收到声纹提取请求，文件名: {audio.filename}")
        
        # 读取音频文件
        audio_bytes = await audio.read()
        logger.info(f"音频文件大小: {len(audio_bytes)} bytes")
        
        # 加载和预处理音频
        try:
            audio_data = load_audio(audio_bytes, sample_rate=16000)
            logger.info(f"音频加载成功，长度: {len(audio_data)} samples")
        except Exception as e:
            logger.error(f"音频加载失败: {e}")
            return EmbeddingResponse(
                success=False,
                error=f"音频加载失败: {str(e)}"
            )
        
        # 预处理
        try:
            audio_data = preprocess_audio(audio_data, trim_silence=True, normalize=True)
            logger.info(f"音频预处理完成，长度: {len(audio_data)} samples")
        except Exception as e:
            logger.error(f"音频预处理失败: {e}")
            return EmbeddingResponse(
                success=False,
                error=f"音频预处理失败: {str(e)}"
            )
        
        # 验证音频
        is_valid, error_msg = validate_audio(audio_data, min_duration=1.0, max_duration=300.0)
        if not is_valid:
            logger.warning(f"音频验证失败: {error_msg}")
            return EmbeddingResponse(
                success=False,
                error=error_msg
            )
        
        # 提取声纹
        try:
            encoder = get_encoder()
            embedding = encoder.embed_utterance(audio_data)
            logger.info(f"✓ 声纹提取成功，维度: {embedding.shape}")
        except Exception as e:
            logger.error(f"声纹提取失败: {e}")
            return EmbeddingResponse(
                success=False,
                error=f"声纹提取失败: {str(e)}"
            )
        
        return EmbeddingResponse(
            success=True,
            embedding=embedding.tolist(),
            dimension=len(embedding)
        )
        
    except Exception as e:
        logger.error(f"请求处理失败: {e}")
        return EmbeddingResponse(
            success=False,
            error=f"服务器内部错误: {str(e)}"
        )


@app.post("/api/v1/clone-voice")
async def clone_voice(
    audio: UploadFile = File(...),
    text: str = Form(...)
):
    """
    端到端语音克隆
    
    Parameters:
    - audio: 参考音频文件
    - text: 要合成的文本
    
    Returns:
    - 合成的音频文件（WAV格式）
    """
    try:
        logger.info(f"收到语音克隆请求，文本: '{text}'")
        
        # 1. 读取并处理音频
        audio_bytes = await audio.read()
        audio_data = load_audio(audio_bytes, sample_rate=16000)
        audio_data = preprocess_audio(audio_data)
        
        # 验证音频
        is_valid, error_msg = validate_audio(audio_data)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # 2. 提取声纹
        logger.info("提取声纹特征...")
        encoder = get_encoder()
        embedding = encoder.embed_utterance(audio_data)
        
        # 3. 合成梅尔频谱
        logger.info("合成梅尔频谱...")
        synthesizer = get_synthesizer()
        specs = synthesizer.synthesize_spectrograms([text], [embedding])
        spec = specs[0]
        
        # 4. 生成音频
        logger.info("生成音频...")
        vocoder = get_vocoder()
        generated_audio = vocoder.infer_waveform(spec)
        
        # 5. 转换为字节流
        audio_bytes = audio_to_bytes(generated_audio, sample_rate=16000)
        
        logger.info(f"✓ 语音克隆完成，音频长度: {len(generated_audio)/16000:.2f}秒")
        
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=cloned_{audio.filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"语音克隆失败: {e}")
        raise HTTPException(status_code=500, detail=f"语音克隆失败: {str(e)}")


@app.post("/api/v1/synthesize-with-embedding")
async def synthesize_with_embedding(
    embedding: str = Form(...),
    text: str = Form(...)
):
    """
    使用声纹特征合成语音
    
    Parameters:
    - embedding: JSON格式的声纹特征向量
    - text: 要合成的文本
    
    Returns:
    - 合成的音频文件
    """
    try:
        import json
        
        logger.info(f"收到合成请求，文本: '{text}'")
        
        # 解析 embedding
        embedding_array = np.array(json.loads(embedding), dtype=np.float32)
        logger.info(f"Embedding 维度: {embedding_array.shape}")
        
        # 合成梅尔频谱
        synthesizer = get_synthesizer()
        specs = synthesizer.synthesize_spectrograms([text], [embedding_array])
        spec = specs[0]
        
        # 生成音频
        vocoder = get_vocoder()
        audio = vocoder.infer_waveform(spec)
        
        # 转换为字节流
        audio_bytes = audio_to_bytes(audio, sample_rate=16000)
        
        logger.info(f"✓ 合成完成")
        
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "attachment; filename=synthesized.wav"
            }
        )
        
    except Exception as e:
        logger.error(f"合成失败: {e}")
        raise HTTPException(status_code=500, detail=f"合成失败: {str(e)}")


@app.post("/api/v1/batch-synthesize")
async def batch_synthesize(request: BatchSynthesisRequest):
    """
    批量合成
    
    Parameters:
    - embedding: 声纹特征向量
    - texts: 要合成的文本列表
    
    Returns:
    - 合成的音频文件列表（ZIP格式）
    """
    try:
        logger.info(f"收到批量合成请求，文本数量: {len(request.texts)}")
        
        embedding = np.array(request.embedding, dtype=np.float32)
        
        synthesizer = get_synthesizer()
        vocoder = get_vocoder()
        
        # 批量合成
        audio_files = []
        for i, text in enumerate(request.texts):
            logger.info(f"合成 {i+1}/{len(request.texts)}: {text}")
            
            specs = synthesizer.synthesize_spectrograms([text], [embedding])
            spec = specs[0]
            
            audio = vocoder.infer_waveform(spec)
            audio_bytes = audio_to_bytes(audio, sample_rate=16000)
            
            audio_files.append((f"audio_{i+1}.wav", audio_bytes))
        
        # 打包成ZIP
        import zipfile
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            for filename, audio_data in audio_files:
                zip_file.writestr(filename, audio_data)
        
        zip_buffer.seek(0)
        
        logger.info(f"✓ 批量合成完成")
        
        return Response(
            content=zip_buffer.read(),
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=batch_synthesis.zip"
            }
        )
        
    except Exception as e:
        logger.error(f"批量合成失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量合成失败: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    
    logger.info(f"启动服务器: http://{host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
