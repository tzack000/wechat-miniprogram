"""
FastAPI主应用
语音克隆API服务
"""
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import io
import soundfile as sf
from loguru import logger
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 延迟导入模型（避免启动时加载）
encoder_model = None
synthesizer_model = None
vocoder_model = None

app = FastAPI(
    title="Voice Cloning API",
    description="语音克隆服务 - 基于MockingBird",
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

# 模型加载
def load_models():
    """懒加载模型"""
    global encoder_model, synthesizer_model, vocoder_model
    
    if encoder_model is not None:
        return
    
    logger.info("开始加载模型...")
    
    try:
        # 动态导入（假设从MockingBird复制的代码）
        from ..encoder import inference as encoder
        from ..synthesizer.inference import Synthesizer
        from ..vocoder import inference as vocoder
        
        # 模型路径
        encoder_path = os.getenv("MODEL_ENCODER_PATH", "models/encoder/encoder.pt")
        synthesizer_path = os.getenv("MODEL_SYNTHESIZER_PATH", "models/synthesizer/synthesizer.pt")
        vocoder_path = os.getenv("MODEL_VOCODER_PATH", "models/vocoder/vocoder.pt")
        
        # 加载模型
        encoder.load_model(encoder_path)
        synthesizer_model = Synthesizer(synthesizer_path)
        vocoder.load_model(vocoder_path)
        
        encoder_model = encoder
        vocoder_model = vocoder
        
        logger.info("✓ 模型加载完成")
        
    except Exception as e:
        logger.error(f"模型加载失败: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """应用启动时加载模型"""
    load_models()

@app.get("/", response_model=dict)
async def root():
    """根路径"""
    return {
        "message": "Voice Cloning API Server",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    models_loaded = all([
        encoder_model is not None,
        synthesizer_model is not None,
        vocoder_model is not None
    ])
    
    return HealthResponse(
        status="healthy" if models_loaded else "degraded",
        models_loaded=models_loaded,
        version="1.0.0"
    )

@app.post("/api/v1/extract-embedding", response_model=EmbeddingResponse)
async def extract_embedding(audio: UploadFile = File(...)):
    """
    提取声纹特征
    
    Parameters:
    - audio: 音频文件（WAV格式，16kHz采样率）
    
    Returns:
    - embedding: 声纹特征向量（256维）
    """
    try:
        # 确保模型已加载
        load_models()
        
        # 读取音频文件
        audio_bytes = await audio.read()
        audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes))
        
        # 验证音频
        if len(audio_data) == 0:
            raise HTTPException(status_code=400, detail="音频文件为空")
        
        # 转换为单声道
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)
        
        # 重采样到16kHz（如果需要）
        if sample_rate != 16000:
            import resampy
            audio_data = resampy.resample(audio_data, sample_rate, 16000)
        
        # 提取声纹
        embedding = encoder_model.embed_utterance(audio_data)
        
        logger.info(f"✓ 成功提取声纹特征，维度: {embedding.shape}")
        
        return EmbeddingResponse(
            success=True,
            embedding=embedding.tolist(),
            dimension=len(embedding)
        )
        
    except Exception as e:
        logger.error(f"声纹提取失败: {e}")
        return EmbeddingResponse(
            success=False,
            error=str(e)
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
        # 确保模型已加载
        load_models()
        
        logger.info(f"开始语音克隆: text='{text}'")
        
        # 1. 读取并处理音频
        audio_bytes = await audio.read()
        audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes))
        
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)
        
        if sample_rate != 16000:
            import resampy
            audio_data = resampy.resample(audio_data, sample_rate, 16000)
        
        # 2. 提取声纹
        logger.info("提取声纹特征...")
        embedding = encoder_model.embed_utterance(audio_data)
        
        # 3. 合成梅尔频谱
        logger.info("合成梅尔频谱...")
        specs = synthesizer_model.synthesize_spectrograms([text], [embedding])
        spec = specs[0]
        
        # 4. 生成音频
        logger.info("生成音频...")
        generated_audio = vocoder_model.infer_waveform(spec)
        
        # 5. 返回音频
        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, generated_audio, 16000, format='WAV')
        audio_buffer.seek(0)
        
        logger.info(f"✓ 语音克隆完成，音频长度: {len(generated_audio)/16000:.2f}秒")
        
        return Response(
            content=audio_buffer.read(),
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=cloned_{audio.filename}"
            }
        )
        
    except Exception as e:
        logger.error(f"语音克隆失败: {e}")
        raise HTTPException(status_code=500, detail=f"语音克隆失败: {str(e)}")

@app.post("/api/v1/batch-synthesize")
async def batch_synthesize(request: BatchSynthesisRequest):
    """
    批量合成（使用已有的声纹特征）
    
    Parameters:
    - embedding: 声纹特征向量
    - texts: 要合成的文本列表
    
    Returns:
    - 合成的音频文件列表（打包成ZIP）
    """
    try:
        load_models()
        
        logger.info(f"开始批量合成，文本数量: {len(request.texts)}")
        
        # 转换embedding
        embedding = np.array(request.embedding, dtype=np.float32)
        
        # 批量合成
        audio_files = []
        for i, text in enumerate(request.texts):
            logger.info(f"合成 {i+1}/{len(request.texts)}: {text}")
            
            # 合成梅尔频谱
            specs = synthesizer_model.synthesize_spectrograms([text], [embedding])
            spec = specs[0]
            
            # 生成音频
            audio = vocoder_model.infer_waveform(spec)
            
            # 保存到内存
            audio_buffer = io.BytesIO()
            sf.write(audio_buffer, audio, 16000, format='WAV')
            audio_buffer.seek(0)
            audio_files.append((f"audio_{i+1}.wav", audio_buffer.read()))
        
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

@app.post("/api/v1/synthesize-with-embedding")
async def synthesize_with_embedding(
    embedding: str = Form(...),
    text: str = Form(...)
):
    """
    使用声纹特征合成语音（单个）
    
    Parameters:
    - embedding: JSON格式的声纹特征向量
    - text: 要合成的文本
    
    Returns:
    - 合成的音频文件
    """
    try:
        load_models()
        
        import json
        embedding_array = np.array(json.loads(embedding), dtype=np.float32)
        
        logger.info(f"使用声纹合成: text='{text}'")
        
        # 合成梅尔频谱
        specs = synthesizer_model.synthesize_spectrograms([text], [embedding_array])
        spec = specs[0]
        
        # 生成音频
        audio = vocoder_model.infer_waveform(spec)
        
        # 返回音频
        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, audio, 16000, format='WAV')
        audio_buffer.seek(0)
        
        logger.info(f"✓ 合成完成")
        
        return Response(
            content=audio_buffer.read(),
            media_type="audio/wav",
            headers={
                "Content-Disposition": "attachment; filename=synthesized.wav"
            }
        )
        
    except Exception as e:
        logger.error(f"合成失败: {e}")
        raise HTTPException(status_code=500, detail=f"合成失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True
    )
