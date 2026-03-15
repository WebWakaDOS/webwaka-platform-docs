# WebWaka OS v4 - New Window Setup Guide

This guide explains how to quickly spin up a new Manus instance to join the WebWaka OS v4 parallel implementation factory.

## The "One-Click" Setup Process

To turn any fresh Manus window into a 100% production-ready worker node, follow these two simple steps:

### Step 1: Prepare Your GitHub PAT
You will need a GitHub Personal Access Token (PAT) with repository access to the `WebWakaDOS` organization. Have this ready.

### Step 2: Paste the Bootstrap Prompt
Copy the entire contents of the `WEBWAKA-MANUS-BOOTSTRAP.md` file and paste it into the new Manus window.

That's it! The agent will automatically:
1. Ask for your PAT (if needed)
2. Clone all necessary documentation and status repositories
3. Check the global queue (`queue.json`)
4. Claim the next available epic
5. Begin implementation with 100% thoroughness

## How the Factory Works

The WebWaka OS v4 implementation is divided into 26 parallelizable epics. To complete them efficiently without sacrificing thoroughness, we use a multi-agent factory model.

### The Global Queue
The central source of truth is the `queue.json` file in the `webwaka-platform-status` repository. This file tracks the status of all 26 epics:
- `PENDING`: Ready to be claimed
- `IN_PROGRESS`: Currently being worked on by a specific node
- `DONE`: 100% complete and verified

### The Locking Mechanism
When a worker node claims an epic, it immediately updates the `queue.json` file and pushes it to GitHub. This "locks" the epic, preventing other worker nodes from duplicating the work.

### The Execution Loop
Once an epic is claimed, the worker node will:
1. Read the relevant Blueprint and Roadmap sections
2. Create a detailed implementation plan
3. Write the code (enforcing the 7 Core Invariants)
4. Run the 5-Layer QA Protocol
5. Push the code to the specific vertical repository
6. Mark the epic as `DONE` in the global queue
7. **Automatically loop back to claim the next `PENDING` epic**

## Monitoring Progress

You can monitor the overall progress of the factory by checking the `queue.json` file in the `webwaka-platform-status` repository.

## Troubleshooting

**Q: The agent stopped after completing an epic.**
A: Simply prompt the agent with: "Continue to the next PENDING epic in the queue."

**Q: Two agents claimed the same epic.**
A: This shouldn't happen due to the locking mechanism, but if it does, manually update the `queue.json` to assign one agent to a different epic, and instruct that agent to sync the latest queue.

**Q: The agent is taking shortcuts.**
A: Remind the agent: "Thoroughness > speed. Enforce the 7 Core Invariants and 5-Layer QA Protocol. No shortcuts."
