(function () {
  "use strict";

  const portraits = {
    Mahavir: "assets/reimagined/mahavir.png",
    Pearl: "assets/reimagined/pearl.png",
    Luke: "assets/reimagined/luke.png",
    Tara: "assets/reimagined/tara.png",
    Winston: "assets/reimagined/winston.png",
    Nadine: "assets/reimagined/nadine.png",
    Ashley: "assets/reimagined/ashley.png"
  };

  const employee = (name, strong, weak, note) => ({
    name,
    portrait: portraits[name],
    strong,
    weak,
    note
  });

  window.COOL_CAI_DEPARTMENTS = {
    orange: {
      short: "Product",
      name: "Product & Design",
      taskNames: ["Define user flow", "Clarify acceptance criteria", "Revise launch scope", "Resolve prototype feedback"]
    },
    green: {
      short: "Data",
      name: "Data & Strategy",
      taskNames: ["Set success metrics", "Validate cohort query", "Check experiment sample", "Reconcile dashboard definition"]
    },
    blue: {
      short: "Engineering",
      name: "Engineering",
      taskNames: ["Build integration", "Verify release branch", "Fix permission edge case", "Review service dependency"]
    },
    purple: {
      short: "Growth",
      name: "Growth & Operations",
      taskNames: ["Prepare rollout brief", "Update enablement copy", "Coordinate launch channel", "Confirm support handoff"]
    }
  };

  window.COOL_CAI_LEVELS = [
    {
      id: 1,
      chapter: "RE-ENTRY",
      title: "Back in the Building",
      subtitle: "Four queues, one employee, and a meeting that cannot be skipped.",
      days: 2,
      startingCash: 10,
      spawn: { first: 22, min: 22, max: 28, batchMin: 1, batchMax: 1, seedAllDepartments: true },
      taskSizes: { small: 1 },
      employees: [
        employee("Mahavir", [], [], "Neutral across all four departments. Low output stress, slow delivery.")
      ],
      recoverySlots: 1,
      meetings: [
        {
          id: "reentry-alignment",
          title: "Project Re-entry Alignment",
          duration: 60,
          required: true,
          description: "Confirm ownership and the first-day delivery plan. Choose whether Mahavir attends.",
          selectable: ["Mahavir"]
        }
      ],
      requiredCopy: [
        "Complete 8 work items",
        "Complete at least 1 task for every department",
        "Finish the 60-minute alignment meeting"
      ],
      optionalCopy: ["Mahavir rests for 30 minutes", "Finish without any overdue work"],
      story: {
        Denise: "Mahavir mentions Paris as if it were an ordinary airport connection. Denise lets the silence stand, then asks for tomorrow's dependency list.",
        Steven: "Mahavir mentions that he once lived in Paris. Steven asks whether the timezone experience will help with the new partner team."
      }
    },
    {
      id: 11,
      chapter: "GROWTH",
      title: "No Spare Capacity",
      subtitle: "Two projects plan around the same specialist as if he were available twice.",
      days: 4,
      startingCash: 32,
      spawn: { first: 18, min: 30, max: 40, batchMin: 1, batchMax: 3, seedAllDepartments: true },
      taskSizes: { medium: 3, large: 1 },
      employees: [
        employee("Pearl", ["green"], ["purple"], "Strong in Data & Strategy. Other people resting can make utilization feel unsafe."),
        employee("Luke", ["purple"], ["green"], "Strong in Growth & Operations. Data work creates heavy context-switch stress."),
        employee("Tara", ["orange"], ["blue", "green"], "Strong in Product & Design. Engineering and Data are weak assignments."),
        employee("Winston", ["blue"], ["orange"], "The only Engineering specialist. Project Atlas and Project Beacon both depend on him.")
      ],
      recoverySlots: 2,
      meetings: [
        {
          id: "capacity-review",
          title: "Capacity Review",
          duration: 75,
          required: false,
          description: "Review simultaneous commitments. Bringing Winston pauses both projects' key specialist.",
          selectable: ["Pearl", "Luke", "Tara", "Winston"]
        }
      ],
      requiredCopy: [
        "Winston completes 6 Atlas Engineering nodes",
        "Winston completes 6 Beacon Engineering nodes",
        "Tara, Pearl and Luke each deliver 7 strong-department tasks"
      ],
      optionalCopy: ["Assign no Product work to Winston", "No employee waits over 45 minutes for recovery space"],
      story: {
        Denise: "The resourcing sheet still shows Winston at 200% allocation. Denise highlights the number. Nobody disputes it; nobody removes a commitment.",
        Steven: "Steven highlights Winston's 200% allocation. The room agrees that the number is impossible, then schedules a follow-up instead of removing work."
      }
    },
    {
      id: 22,
      chapter: "AI DIVIDEND",
      title: "Mandatory Adoption",
      subtitle: "The efficiency target arrived before the review capacity did.",
      days: 5,
      startingCash: 52,
      spawn: { first: 14, min: 25, max: 34, batchMin: 2, batchMax: 3, seedAllDepartments: true },
      taskSizes: { medium: 3, large: 1 },
      employees: [
        employee("Ashley", ["orange"], ["blue"], "Product & Design reviewer. Engineering review is a weak assignment."),
        employee("Nadine", ["green"], ["purple"], "Data & Strategy reviewer. Growth review is a weak assignment."),
        employee("Winston", ["blue"], ["orange"], "Engineering reviewer. Product review is a weak assignment."),
        employee("Luke", ["purple"], ["green"], "Growth & Operations reviewer. Data review is a weak assignment."),
        employee("Pearl", ["green"], ["purple"], "Cross-team oversight and fallback capacity.")
      ],
      recoverySlots: 2,
      aiRequired: true,
      meetings: [
        {
          id: "adoption-briefing",
          title: "Mandatory Adoption Briefing",
          duration: 90,
          required: true,
          description: "Management requires all four departments to confirm adoption. The review workload is not discussed.",
          selectable: ["Ashley", "Nadine", "Winston", "Luke", "Pearl"]
        }
      ],
      requiredCopy: [
        "Deploy AI in all four departments",
        "Each department's specialist completes 8 AI review tasks",
        "Finish the mandatory adoption briefing"
      ],
      optionalCopy: ["No AI review goes to a weak-department employee", "Finish without an overdue review task"],
      story: {
        Denise: "The dashboard records four successful adoptions. Denise asks where review time is recorded. The answer is another dashboard.",
        Steven: "The dashboard records four successful adoptions. Steven asks who owns review capacity. The room responds with a link to the policy page."
      }
    }
  ];
})();
