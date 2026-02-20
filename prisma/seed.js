const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const CHECKIN_QUESTIONS = {
    7: [
        { question: "How clear is your role and what's expected of you?", key: "role_clarity" },
        { question: "How welcomed do you feel by your team?", key: "team_welcome" },
        { question: "Do you have access to all the tools and systems you need?", key: "tool_access" },
        { question: "Are there any immediate blockers preventing you from doing your work?", key: "blockers" },
    ],
    30: [
        { question: "How balanced is your workload?", key: "workload" },
        { question: "How supported do you feel by your manager?", key: "manager_support" },
        { question: "How is your learning and skill development progressing?", key: "learning" },
        { question: "How well do you feel you fit into the company culture?", key: "culture_fit" },
    ],
    60: [
        { question: "How confident are you in your skills for this role?", key: "skills" },
        { question: "How well are you collaborating with other teams?", key: "cross_team" },
        { question: "How aligned does this role feel with your career goals?", key: "career" },
        { question: "What's one thing that would improve your experience?", key: "improvement" },
    ],
    90: [
        { question: "Overall, how satisfied are you with your onboarding experience?", key: "satisfaction" },
        { question: "How confident do you feel performing your role independently?", key: "confidence" },
        { question: "How likely are you to recommend this company as a great place to work?", key: "recommend" },
        { question: "What suggestions do you have for improving onboarding for future hires?", key: "suggestions" },
    ],
};

async function main() {
    console.log("🌱 Seeding database...\n");

    // Clean existing data
    await prisma.checkInResponse.deleteMany();
    await prisma.checkIn.deleteMany();
    await prisma.taskProgress.deleteMany();
    await prisma.onboarding.deleteMany();
    await prisma.templateTask.deleteMany();
    await prisma.template.deleteMany();
    await prisma.user.deleteMany();
    await prisma.checkInQuestion.deleteMany();
    await prisma.buddyTouchpoint.deleteMany();
    await prisma.buddyTip.deleteMany();

    // Create users
    const passwordHash = await bcrypt.hash("demo1234", 12);

    const hrAdmin = await prisma.user.create({
        data: {
            email: "hr@demo.com",
            name: "Sarah Chen",
            passwordHash,
            role: "HR_ADMIN",
            department: "Human Resources",
        },
    });

    const manager = await prisma.user.create({
        data: {
            email: "manager@demo.com",
            name: "Alex Rivera",
            passwordHash,
            role: "MANAGER",
            department: "Engineering",
        },
    });

    const buddy = await prisma.user.create({
        data: {
            email: "buddy@demo.com",
            name: "Jordan Kim",
            passwordHash,
            role: "MANAGER",
            department: "Engineering",
        },
    });

    const newHire = await prisma.user.create({
        data: {
            email: "newhire@demo.com",
            name: "Taylor Morgan",
            passwordHash,
            role: "NEW_HIRE",
            department: "Engineering",
        },
    });

    console.log("✅ Created 4 users");

    // Create Engineering Onboarding Template
    const template = await prisma.template.create({
        data: {
            name: "Engineering Onboarding",
            department: "Engineering",
            roleTarget: "Software Engineer",
            createdById: hrAdmin.id,
        },
    });

    // Week 1: Getting Started (Days 1-5)
    const week1Tasks = [
        { day: 1, title: "Set up laptop and dev environment", type: "DO_SUBMIT", description: "Install required software, configure IDE, clone repositories. Ask your buddy if you get stuck!", requiresApproval: false },
        { day: 1, title: "Complete HR paperwork and payroll setup", type: "ACKNOWLEDGE", description: "Tax forms, direct deposit, emergency contacts, and benefits enrollment.", requiresApproval: false },
        { day: 1, title: "30-minute meet & greet with your manager", type: "MEETING", description: "Introductory meeting to discuss your role, expectations, and first-week goals.", requiresApproval: false },
        { day: 1, title: "Read the company culture handbook", type: "READ", description: "Understand our values, communication norms, and what makes us tick.", requiresApproval: false },
        { day: 2, title: "Get access to all core tools (Slack, GitHub, Jira)", type: "DO_SUBMIT", description: "Verify you can log into every tool on the checklist. Flag missing access immediately.", requiresApproval: true },
        { day: 2, title: "Meet your onboarding buddy for coffee/chat", type: "MEETING", description: "Your buddy is here to help you navigate the first weeks. No question is too small.", requiresApproval: false },
        { day: 3, title: "Read the engineering team wiki", type: "READ", description: "Architecture overview, coding standards, deployment process, and incident response.", requiresApproval: false },
        { day: 3, title: "Set up local development and run the app", type: "DO_SUBMIT", description: "Clone the main repo, install dependencies, and get the app running locally.", requiresApproval: false },
        { day: 4, title: "Attend team standup (observe)", type: "MEETING", description: "Join the daily standup to see how the team communicates and tracks work.", requiresApproval: false },
        { day: 5, title: "End-of-week check-in with manager", type: "MEETING", description: "Review your first week, ask questions, and set goals for week 2.", requiresApproval: false },
    ];

    // Week 2: Deeper Dive (Days 8-12)
    const week2Tasks = [
        { day: 8, title: "Review codebase architecture documentation", type: "READ", description: "Understand the system design, key services, and data flow.", requiresApproval: false },
        { day: 9, title: "Pair programming session with a team member", type: "MEETING", description: "Work on a small task together to learn the codebase hands-on.", requiresApproval: false },
        { day: 10, title: "Complete your first small pull request", type: "DO_SUBMIT", description: "Pick a starter issue, implement the fix, and submit a PR for review.", requiresApproval: true },
        { day: 11, title: "Shadow a cross-team meeting", type: "MEETING", description: "Attend a meeting with another team to understand how teams collaborate.", requiresApproval: false },
        { day: 12, title: "Read security and compliance policies", type: "READ", description: "Data handling, access controls, and security best practices.", requiresApproval: false },
    ];

    // Week 3-4: Building Confidence (Days 15-26)
    const week3_4Tasks = [
        { day: 15, title: "Take ownership of your first feature ticket", type: "DO_SUBMIT", description: "Pick a small feature from the backlog and own it end-to-end.", requiresApproval: false },
        { day: 18, title: "Attend a lunch & learn or tech talk", type: "MEETING", description: "Join a knowledge-sharing session to learn from experienced engineers.", requiresApproval: false },
        { day: 20, title: "Read the incident response runbook", type: "READ", description: "Understand how we handle production incidents and on-call procedures.", requiresApproval: false },
        { day: 22, title: "Complete a code review for a teammate", type: "DO_SUBMIT", description: "Review someone else's PR — great way to learn patterns and build relationships.", requiresApproval: false },
        { day: 25, title: "1:1 with skip-level manager (optional)", type: "MEETING", description: "Meet your manager's manager for broader context on team goals.", requiresApproval: false },
    ];

    // Month 2: Growing (Days 30-55)
    const month2Tasks = [
        { day: 30, title: "First month reflection & goal setting", type: "DO_SUBMIT", description: "Write a brief reflection on your first month and set goals for month 2.", requiresApproval: false },
        { day: 32, title: "Shadow a cross-team planning session", type: "MEETING", description: "See how product, design, and engineering collaborate on planning.", requiresApproval: false },
        { day: 35, title: "Complete role-specific training module", type: "READ", description: "Finish any remaining technical training for your specific role.", requiresApproval: false },
        { day: 40, title: "Present your first feature to the team", type: "DO_SUBMIT", description: "Demo the feature you built to the team. Practice technical communication.", requiresApproval: false },
        { day: 45, title: "Contribute to documentation or wiki", type: "DO_SUBMIT", description: "Update or add documentation based on what you've learned.", requiresApproval: false },
        { day: 50, title: "Participate in sprint planning", type: "MEETING", description: "Actively contribute to story estimation and sprint goal discussions.", requiresApproval: false },
    ];

    // Month 3: Independence (Days 60-90)
    const month3Tasks = [
        { day: 60, title: "Skills gap review with manager", type: "MEETING", description: "Identify areas where you want to grow and create a development plan.", requiresApproval: false },
        { day: 60, title: "Confirm access to all core tools and systems", type: "DO_SUBMIT", description: "Final check that you have everything you need for full independence.", requiresApproval: true },
        { day: 65, title: "Career goals brainstorm", type: "DO_SUBMIT", description: "Draft your 6-month career goals and discuss with your manager.", requiresApproval: false },
        { day: 70, title: "Lead a team standup or meeting", type: "MEETING", description: "Take the lead to build facilitation skills and team presence.", requiresApproval: false },
        { day: 75, title: "Mentor a newer team member (if applicable)", type: "MEETING", description: "Share what you've learned with someone who joined after you.", requiresApproval: false },
        { day: 80, title: "Complete a medium-complexity feature independently", type: "DO_SUBMIT", description: "End-to-end ownership: design, implement, test, deploy, monitor.", requiresApproval: true },
        { day: 85, title: "Write your 90-day self-assessment", type: "DO_SUBMIT", description: "Reflect on your growth, accomplishments, and future goals.", requiresApproval: false },
        { day: 90, title: "90-day graduation meeting with manager", type: "MEETING", description: "Celebrate your progress! Review goals, get feedback, and plan what's next.", requiresApproval: false },
    ];

    const allTasks = [
        ...week1Tasks.map((t, i) => ({ ...t, week: 1, sort: i })),
        ...week2Tasks.map((t, i) => ({ ...t, week: 2, sort: i })),
        ...week3_4Tasks.map((t, i) => ({ ...t, week: Math.ceil(t.day / 7), sort: i })),
        ...month2Tasks.map((t, i) => ({ ...t, week: Math.ceil(t.day / 7), sort: i })),
        ...month3Tasks.map((t, i) => ({ ...t, week: Math.ceil(t.day / 7), sort: i })),
    ];

    for (const task of allTasks) {
        await prisma.templateTask.create({
            data: {
                templateId: template.id,
                dayNumber: task.day,
                weekNumber: task.week,
                title: task.title,
                description: task.description,
                taskType: task.type,
                requiresApproval: task.requiresApproval,
                sortOrder: task.sort,
            },
        });
    }

    console.log(`✅ Created template with ${allTasks.length} tasks`);

    // Create a demo onboarding (started 14 days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);

    const onboarding = await prisma.onboarding.create({
        data: {
            newHireId: newHire.id,
            managerId: manager.id,
            buddyId: buddy.id,
            templateId: template.id,
            startDate,
            status: "ACTIVE",
        },
    });

    // Create task progress for all tasks
    const templateTasks = await prisma.templateTask.findMany({
        where: { templateId: template.id },
        orderBy: { dayNumber: "asc" },
    });

    for (const task of templateTasks) {
        const daysSinceStart = 14;
        let status = "PENDING";
        let completedAt = null;
        let approvedAt = null;

        if (task.dayNumber <= daysSinceStart - 3) {
            status = task.requiresApproval ? "APPROVED" : "DONE";
            completedAt = new Date(startDate.getTime() + task.dayNumber * 24 * 60 * 60 * 1000);
            if (task.requiresApproval) approvedAt = new Date(completedAt.getTime() + 24 * 60 * 60 * 1000);
        } else if (task.dayNumber <= daysSinceStart) {
            status = "IN_PROGRESS";
        }

        await prisma.taskProgress.create({
            data: {
                onboardingId: onboarding.id,
                templateTaskId: task.id,
                status,
                completedAt,
                approvedAt,
            },
        });
    }

    console.log("✅ Created demo onboarding with progress");

    // Create check-ins (Day 7 submitted, rest pending)
    const day7CheckIn = await prisma.checkIn.create({
        data: {
            onboardingId: onboarding.id,
            scheduledDay: 7,
            status: "SUBMITTED",
            submittedAt: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    // Add responses for day 7
    for (const q of CHECKIN_QUESTIONS[7]) {
        await prisma.checkInResponse.create({
            data: {
                checkInId: day7CheckIn.id,
                question: q.question,
                rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
                answer: "Everything is going well so far!",
                visibility: "MANAGER_HR",
            },
        });
    }

    // Create pending check-ins for days 30, 60, 90
    for (const day of [30, 60, 90]) {
        await prisma.checkIn.create({
            data: {
                onboardingId: onboarding.id,
                scheduledDay: day,
                status: "PENDING",
            },
        });
    }

    console.log("✅ Created check-ins with sample responses");

    // Seed check-in questions into the database
    for (const [day, questions] of Object.entries(CHECKIN_QUESTIONS)) {
        for (let i = 0; i < questions.length; i++) {
            await prisma.checkInQuestion.create({
                data: {
                    scheduledDay: parseInt(day),
                    question: questions[i].question,
                    sortOrder: i,
                },
            });
        }
    }
    console.log("✅ Seeded check-in questions for days 7, 30, 60, 90");

    // Seed buddy touchpoints
    const touchpoints = [
        { day: 1, label: "Welcome message", description: "Say hello and introduce yourself!" },
        { day: 3, label: "Quick coffee chat", description: "15-min informal chat to check in" },
        { day: 7, label: "End of first week debrief", description: "How was your first week? Any confusion?" },
        { day: 14, label: "Two-week check-in", description: "Settling in? Need help navigating anything?" },
        { day: 30, label: "One month celebration", description: "You made it a month! Grab lunch together." },
        { day: 60, label: "Two month sync", description: "How are you feeling about the role?" },
    ];
    for (let i = 0; i < touchpoints.length; i++) {
        await prisma.buddyTouchpoint.create({
            data: { ...touchpoints[i], sortOrder: i },
        });
    }
    console.log("✅ Seeded buddy touchpoints");

    // Seed buddy tips
    const tips = [
        "Answer questions about the company, team, and culture",
        "Help you find resources and navigate internal processes",
        "Be a friendly face during your first weeks",
        "Share tips and unwritten rules",
    ];
    for (let i = 0; i < tips.length; i++) {
        await prisma.buddyTip.create({
            data: { tip: tips[i], sortOrder: i },
        });
    }
    console.log("✅ Seeded buddy tips");

    console.log("\n🎉 Seed complete! Demo accounts:");
    console.log("  HR Admin:  hr@demo.com / demo1234");
    console.log("  Manager:   manager@demo.com / demo1234");
    console.log("  New Hire:  newhire@demo.com / demo1234");
    console.log("  Buddy:     buddy@demo.com / demo1234");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
