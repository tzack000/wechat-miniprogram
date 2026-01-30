## ADDED Requirements

### Requirement: 创建用户声纹档案
系统 SHALL 为每个用户创建唯一的声纹档案,存储声音特征和相关元数据。

#### Scenario: 首次创建声纹档案
- **WHEN** 用户完成首次录音并提取声音特征
- **THEN** 系统自动创建声纹档案,生成唯一的voiceProfileId,状态为"ready"

#### Scenario: 声纹档案包含必要元数据
- **WHEN** 声纹档案创建成功
- **THEN** 系统记录以下信息:userId、voiceProfileId、声纹向量、录音样本URL列表、创建时间、更新时间、状态

### Requirement: 查询声纹档案信息
系统 SHALL 提供API查询用户的声纹档案详情。

#### Scenario: 查询自己的声纹档案
- **WHEN** 用户请求获取声纹档案(GET /api/voice-profile/:id)
- **THEN** 系统返回档案详情(不包含原始声纹向量,仅返回状态和元数据)

#### Scenario: 查询他人声纹档案被拒绝
- **WHEN** 用户A尝试访问用户B的声纹档案
- **THEN** 系统返回403 Forbidden错误"无权访问该声纹档案"

### Requirement: 更新声纹档案
系统 SHALL 支持用户更新声纹档案,添加新的录音样本或重新训练。

#### Scenario: 添加新录音样本
- **WHEN** 用户上传新的录音样本
- **THEN** 系统重新提取声纹特征,更新声纹向量,增加录音URL到样本列表

#### Scenario: 重置声纹档案
- **WHEN** 用户选择"重新训练声音模型"
- **THEN** 系统清空现有样本列表和声纹向量,状态重置为"需要录音",提示用户重新录制

### Requirement: 删除声纹档案
系统 SHALL 允许用户永久删除自己的声纹档案和相关数据。

#### Scenario: 用户主动删除档案
- **WHEN** 用户在设置页面点击"删除声音模型"并确认
- **THEN** 系统删除声纹档案、所有录音样本文件、相关TTS历史,返回成功消息

#### Scenario: 删除操作不可逆
- **WHEN** 声纹档案被删除
- **THEN** 系统在弹窗中明确提示"删除后无法恢复,所有生成的音频将无法重新生成",需要用户二次确认

### Requirement: 声纹档案状态管理
系统 SHALL 维护声纹档案的状态,确保状态流转正确。

#### Scenario: 状态从processing到ready
- **WHEN** 声音特征提取完成
- **THEN** 系统将档案状态从"processing"更新为"ready",用户可开始使用TTS

#### Scenario: 状态从ready到updating
- **WHEN** 用户添加新录音样本触发重新训练
- **THEN** 系统将状态设为"updating",期间仍可使用旧模型进行TTS,完成后恢复"ready"

#### Scenario: 状态为failed时的处理
- **WHEN** 特征提取失败或训练异常
- **THEN** 系统将状态设为"failed",记录错误原因,提示用户"声音模型创建失败,请重新录制"

### Requirement: 声纹档案访问控制
系统 SHALL 实施严格的访问控制,保护用户隐私。

#### Scenario: 仅本人可访问
- **WHEN** 任何API请求访问声纹档案
- **THEN** 系统验证请求者的userId与档案所有者是否一致,不一致则拒绝访问

#### Scenario: 管理员审计访问
- **WHEN** 系统管理员因故障排查需要访问声纹档案
- **THEN** 系统记录审计日志(管理员ID、访问时间、操作内容),仅允许查看元数据,不允许修改

### Requirement: 声纹档案备份和恢复
系统 SHALL 定期备份声纹档案数据,支持灾难恢复。

#### Scenario: 自动备份
- **WHEN** 声纹档案创建或更新
- **THEN** 系统在24小时内自动备份到异地存储

#### Scenario: 恢复声纹档案
- **WHEN** 主数据库数据丢失或损坏
- **THEN** 系统从最近的备份恢复声纹档案,恢复完成后通知受影响用户

### Requirement: 支持多声纹档案管理(未来扩展)
系统设计 SHOULD 考虑支持用户创建多个声纹档案的可能性(如正式、轻松、播音等风格)。

#### Scenario: 预留多档案架构
- **WHEN** 数据库设计时
- **THEN** 系统使用 userId + voiceProfileId 作为复合主键,允许同一用户拥有多个档案

#### Scenario: 当前版本限制单档案
- **WHEN** 用户尝试创建第二个声纹档案
- **THEN** 系统返回提示"当前版本仅支持单个声音模型,请删除现有模型后再创建"
