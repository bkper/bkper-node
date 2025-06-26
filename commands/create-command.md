---
description: Create a new Claude Code slash command
allowed-tools: [Write]
---

I'll help you create a new Claude Code slash command. Please provide the details:

**Command Name**: $ARGUMENTS (first argument, or I'll ask)
**Description**: (second argument, or I'll ask)
**Command Content**: (I'll ask for the command template/content)

Let me create the command file for you:

1. First, I'll determine the command name and description from your arguments
2. Then I'll ask for the command content if not provided
3. Finally, I'll create the `.md` file in `.claude/commands/`

The new command will be available as `/[command-name]` after creation.

If you didn't provide arguments, please tell me:
- What should the command be named?
- What should it do? (brief description)
- What content/template should it contain?

I'll then create the command file with proper YAML frontmatter structure.