# Cool C.A.I. 样板关卡说明

## 安装状态

三个XML样板已挂载到普通模式的真实关卡编号，不再占用Episode 2和3：

1. Episode 1：Back in the Building，对应完整方案第 1 关。
2. Episode 11：No Spare Capacity，对应完整方案第 11 关。
3. Episode 22：Mandatory Adoption，对应完整方案第 22 关。

原始01、11、22工作关卡没有被覆盖。测试入口只修改了levels/LevelProgression.xml。

## 样板 A：Back in the Building

- 正常工作日改为 600 秒。
- 四种任务颜色分别代表 Product & Design、Data & Strategy、Engineering、Growth & Operations。
- Mahavir 对四色保持中立。
- 开局任务改为更密集的2项一批、30–36秒一批。
- 必做目标要求完成8项工作、覆盖四个部门，并在Whiteboard完成60秒会议近似目标。
- 选做目标测试30秒恢复和追加任务。

## 样板 B：No Spare Capacity

旧程序用目标链近似两个项目争夺同一Engineering专家：

- Winston需要依次完成Project Atlas与Project Beacon的Engineering目标。
- Tara、Pearl、Luke分别承担其强项部门目标。
- 共享恢复设施保留，用于观察资源争抢。
- 旧引擎不能识别真实项目对象，两个项目通过前后依赖目标近似。

## 样板 C：Mandatory Adoption

旧程序的四色技能书被临时重命名为四部门 AI 授权：

- Product AI 给 Ashley。
- Data AI 给 Nadine。
- Engineering AI 给 Winston。
- Growth AI 给 Luke。

每个 AI 授权会提高对应部门熟练度。授权目标完成后才开始统计 8 项同色工作，近似“AI 产出需要人工审核”。Pearl 的选做目标代表跨团队监督工作。

## 独立代码原型

真实主角选择、会议锁定、会议期间60%压力倍率和远程办公室窗口位于 `cool-cai-remake`。从根目录双击 `Play_Cool_CAI_Prototype.cmd` 启动。

## 已知边界

以下机制仍无法写入旧EXE；其中主角选择、两区域会议、动态落地窗、Normal复活和AI审核链已经在独立代码原型中实现：

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

prototype_backup/2026-08-17_before_rebuild

若要恢复原进度入口，恢复其中的 levels/LevelProgression.xml；若要同时恢复技能书名称与容量，再恢复 levels/GlobalSettings.xml 和 LocalizedText.xml。
