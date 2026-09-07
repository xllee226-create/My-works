# Cool C.A.I. 样板关卡说明

## 安装状态

三个样板已临时挂载到普通模式的前 3 个关卡位置，方便新建账号直接测试：

1. Episode 1：Back in the Building，对应完整方案第 1 关。
2. Episode 2：Visible Commitment，对应完整方案第 12 关。
3. Episode 3：Human in the Loop，对应完整方案第 21 关。

原始 01、12、21 工作关卡没有被覆盖。测试入口只修改了 levels/LevelProgression.xml。

## 样板 A：Back in the Building

- 正常工作日改为 600 秒。
- 四种任务颜色分别代表 Product & Design、Data & Strategy、Engineering、Growth & Operations。
- Mahavir 对四色保持中立。
- 必做目标要求完成 12 项工作，并覆盖四个部门。
- 选做目标测试恢复和追加任务。

## 样板 B：Visible Commitment

旧程序不能实现真正的 600 秒后加班阶段，因此采用目标链近似：

- Tara、Pearl、Mahavir、Luke 先各完成 8 项强制核心工作。
- 核心目标完成后，解锁以 OVERTIME: 开头的 5 项追加承诺。
- 追加承诺仍显示为旧引擎的 Optional 外观，不能显示正式设计中的蓝色边框。
- 本关给四名员工的目标部门增加额外工作压力，近似加班时 120%压力。
- 这不是统一离场、个人时限或审批流程的完整实现。

## 样板 C：Human in the Loop

旧程序的四色技能书被临时重命名为四部门 AI 授权：

- Product AI 给 Ashley。
- Data AI 给 Nadine。
- Engineering AI 给 Pearl。
- Growth AI 给 Luke。

每个 AI 授权会提高对应部门熟练度。授权目标完成后才开始统计 8 项同色工作，近似“AI 产出需要人工审核”。Mahavir 的选做目标代表不使用 AI 的人工兜底路径。

## 已知边界

以下机制尚未实现，因为旧 EXE 没有相应状态机：

- 多区域移动和会议远程控制。
- 动态落地窗。
- 真正的下班后 120–300 秒加班阶段。
- 加班申请、审批、统一离场和压力下限。
- Denise / Steven 主角选择。
- Easy、Normal、Hard、Limbo 四档难度。
- 医疗复活次数和 5 秒无敌。
- 蓝色加班目标边框。
- AI 自动生成的动态审核与返工链。

## 备份

改造前文件位于：

prototype_backup/2026-08-14_before_samples

若要恢复原进度入口，恢复其中的 levels/LevelProgression.xml；若要同时恢复技能书名称与容量，再恢复 levels/GlobalSettings.xml 和 LocalizedText.xml。

