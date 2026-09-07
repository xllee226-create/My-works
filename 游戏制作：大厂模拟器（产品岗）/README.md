# Cool C.A.I.

> A playable product-management simulation about shipping an AI collaboration platform when every team is already at capacity.

**Cool C.A.I.** is a browser-playable vertical slice that reimagines a classic time-management game as a modern, high-pressure enterprise product environment. You play as a Project Manager responsible for turning ambiguous requests into shipped work across Product, Data, Engineering, and Growth—while managing stress, meetings, dependencies, and limited capacity.

This is a portfolio project for demonstrating AI product management thinking through a playable system: problem framing, cross-functional prioritization, AI workflow design, metrics, trade-offs, and humane operations.

## Why this project is relevant to AI product management

The game is designed as a product case study that can be experienced rather than only described in slides.

| Product-management capability | How it appears in the game |
| --- | --- |
| Product sense | Translate a launch goal into user flows, acceptance criteria, success metrics, implementation, and rollout work. |
| Cross-functional leadership | Coordinate four independent work queues with different strengths, bottlenecks, and hand-off risks. |
| Prioritization under constraints | Choose who works on what while deadlines, stress, meetings, and shared recovery facilities compete for the same capacity. |
| AI product judgment | In Episode 22, AI accelerates production but creates a review queue; the bottleneck moves from generation to verification and ownership. |
| Metrics literacy | Required, Optional, and AI-review objectives make delivery, quality, and performance trade-offs visible. |
| Responsible AI thinking | AI is modeled as a neutral tool. The systemic problem is the organization’s efficiency expectation and review capacity—not a cartoon villain or “bad AI.” |
| Operational excellence | Meetings, remote control, dynamic workday timing, recovery rules, and end-of-day state make process quality part of the product experience. |
| User empathy | Stress is a system signal. Employees have different strengths and needs; the design avoids framing people as incompetent for systemic overload. |

### One-line interview framing

> “I built a playable simulation where AI productivity gains are coupled to review capacity, cross-functional dependencies, and employee well-being—so a hiring team can see how I reason about AI products under real operating constraints.”

## Play the prototype

No dependencies or network connection are required.

1. Open [`cool-cai-remake/index.html`](cool-cai-remake/index.html) in a modern browser, or run [`Play_Cool_CAI_Prototype.cmd`](Play_Cool_CAI_Prototype.cmd).
2. Create a profile and choose **Denise** or **Steven**. The choice is stored locally and locked to that profile.
3. Select one of the three test episodes.

For a detailed mechanics list, see [`cool-cai-remake/README_zh-CN.md`](cool-cai-remake/README_zh-CN.md).

## What is playable now

### Episode 1 — Back in the Building

The onboarding slice. Four departmental queues begin immediately, tasks arrive every 22–28 seconds, and the player must complete work across all departments while attending a required 60-second alignment meeting.

### Episode 11 — No Spare Capacity

A resource-allocation slice. Two projects depend on the same Engineering specialist, recovery space is shared, and assigning work outside a character’s strength creates measurable performance costs.

### Episode 22 — Mandatory Adoption

An AI-operations slice. All four departments must adopt AI. Faster task completion generates review work, exposing the difference between generation throughput and safe, accountable delivery.

## Core systems

- **600-second workday:** 1 game second represents 1 working minute, with a dynamic office window shifting from morning light to evening city lights.
- **Four functional queues:** Orange = Product & Design, Green = Data & Strategy, Blue = Engineering, Purple = Growth & Operations.
- **Three objective types:** Required milestones, Optional performance goals, and Overtime commitments are visually distinct from department colors.
- **Character fit:** Employees have strong, neutral, and weak departments. Assignment quality affects speed and stress rather than reducing a person to a fixed “good/bad” label.
- **Meetings as real opportunity cost:** Up to three meetings per day, each no longer than 120 seconds and ending by the 560-second mark. During a meeting, stress growth is reduced while the office remains remotely controllable.
- **Project Manager pressure:** The PM is accountable for flow, but cannot create capacity or remove targets. Pressure represents the cost of unresolved system constraints.
- **Two parallel protagonists:** Denise and Steven have equivalent authority and mechanics. Denise enables a restrained Paris/Mahavir story thread; Steven has a parallel professional route.
- **Multi-day progression:** Daily results, unfinished work, objectives, and story beats carry forward according to the prototype rules. Leaving an episode restarts it from Day 1.

## Design thesis

Cool C.A.I. is not a game about defeating an evil manager or proving that employees are inefficient. It is about a recognizable operating system:

- AI can improve throughput without reducing total responsibility.
- Management can convert efficiency gains into higher targets.
- A Project Manager can be both harmed by the system and pressured to transmit that pressure downward.
- Teams compete for finite people, meeting time, review capacity, and recovery space.
- A successful launch does not automatically mean a healthy organization.

## Project structure

```text
cool-cai-remake/
├── index.html        # Prototype UI and screen structure
├── styles.css        # Layout, office visual language, responsive UI
├── levels.js         # Episode data, queues, objectives, meetings, character setup
├── game.js           # Simulation state, task flow, stress, meetings, scoring
├── assets/           # Prototype character art and supporting visuals
└── tests/            # Smoke tests for the playable slice
```

The prototype intentionally uses a lightweight browser architecture so that the mechanics can be inspected, tested, and iterated quickly before committing to a larger production stack.

## Product-design decisions worth discussing

1. **Why separate department colors from objective borders?** A department describes who emits the work; a border describes why the player should care. Keeping those dimensions independent prevents semantic overload in the UI.
2. **Why make AI create review work?** A realistic AI product cannot stop at generation speed. Verification, ownership, and failure containment are part of the feature, not post-launch polish.
3. **Why make meetings reduce stress but consume time?** This creates a real trade-off: meetings can stabilize a team, but they also remove productive capacity and may delay a dependency.
4. **Why give the PM pressure instead of unlimited control?** The PM fantasy is intentionally constrained. The player must prioritize and negotiate within a system they do not fully control.

## Roadmap

The current repository is a vertical slice, not a claim that all 30 planned episodes are complete.

- **Current:** Episodes 1, 11, and 22; protagonist selection; 600-second day; four queues; meetings; dynamic window; stress and recovery; AI review loop.
- **Next:** Overtime applications and approval flow, General Affairs, 20-slot shared inventory, unified overtime departure, and Easy/Normal/Hard/Limbo balancing.
- **Later:** Executive Floor, cross-floor navigation, richer dependency graphs, AI confidence and rework events, medical recovery animation, full 30-episode progression, and an original production-ready asset set.

## Testing and feedback

The most useful playtest questions are:

- Can a new player distinguish department color from objective type within the first minute?
- Do task arrivals create meaningful prioritization rather than waiting or random clicking?
- Does Episode 22 communicate that review capacity—not AI generation—is the limiting factor?
- Does the meeting trade-off feel valuable without becoming a free stress-reduction exploit?
- Can players explain why a failure happened in system terms rather than blaming a character?

## Scope and rights note

This repository is a private mechanics prototype and should not be presented as an official sequel or distributed with third-party executable, music, fonts, or legacy assets. The long-term public version should replace inherited names, characters, art, audio, typography, and text with fully original or properly licensed assets. The abstract mechanics—task assignment, stress management, meetings, dependencies, and AI review workflows—are being used as design concepts for an original project.

## About the portfolio signal

This project is intentionally built to show more than implementation:

- a clear user and organizational problem;
- an explicit system model with measurable trade-offs;
- a playable prototype that validates assumptions;
- a distinction between current scope and future architecture;
- responsible AI framing grounded in human workflow and accountability;
- a test plan that turns player behavior into product evidence.

For an AI Product Manager role, the strongest signal is not “I added AI.” It is the ability to define where AI creates value, identify the new bottleneck it introduces, make that bottleneck legible to users, and design the surrounding operating system so the product can succeed responsibly.

## 中文简介

**Cool C.A.I.** 是一款可直接在浏览器运行的高压时间管理游戏原型：玩家担任企业协作平台的项目经理，在 Product、Data、Engineering、Growth 四个部门之间分配有限产能，处理会议、压力、依赖、绩效和 AI 生成后的审核工作。

它也是一份可玩的 AI 产品经理作品集：通过系统规则展示需求拆解、跨部门协作、指标设计、AI 人机协同、资源约束、风险控制和员工体验，而不是只展示一个“接入 AI”的功能。

当前样板关卡为真实编号 **Episode 1、Episode 11、Episode 22**，并非将它们改名为 Episode 1–3。完整设计方案见 [`design/Cool_CAI_Complete_Redesign_Plan_zh-CN.md`](design/Cool_CAI_Complete_Redesign_Plan_zh-CN.md)。

