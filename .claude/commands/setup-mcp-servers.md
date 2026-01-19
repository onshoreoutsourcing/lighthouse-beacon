# Setup MCP Servers

## Purpose

Configure Model Context Protocol (MCP) servers for enhanced Claude Code capabilities including Azure DevOps integration, web search, documentation context, security scanning, and code memory.

## Prerequisites

- Claude Code CLI installed and configured
- Node.js/NPM installed (for npx-based servers)
- Python/uvx installed (for Python-based servers)
- Active internet connection for server installation

## Step 1: Check Current MCP Configuration

Display current MCP server configuration:

```bash
# Check existing MCP servers
claude mcp list

# Show MCP configuration file location and contents
cat ~/.config/Claude/mcp.json 2>/dev/null || cat ~/Library/Application\ Support/Claude/mcp.json 2>/dev/null || echo "MCP config not found"
```

## Step 2: Azure DevOps MCP Server

**Purpose**: Integrate with Azure DevOps for work item management, repository operations, wiki access, and pipeline execution.

**Ask user**: "Do you want to install Azure DevOps MCP? If yes, what is your Azure DevOps organization URL?"

**Installation**:
```bash
# User provides: https://dev.azure.com/{organization}
claude mcp add azure-devops -- npx -y @azure-devops/mcp https://dev.azure.com/{organization}
```

**Capabilities**:
- Work item creation and tracking
- Repository and branch management
- Pull request operations
- Wiki content management
- Pipeline execution and monitoring
- Test plan management

**Authentication**: Uses Azure AD - you'll be prompted to authenticate via browser on first use.

## Step 3: Exa Web Search MCP Server

**Purpose**: Enhanced web search capabilities with AI-powered search results and content extraction.

**Ask user**: "Do you want to install Exa web search MCP?"

**Installation**:
```bash
# Lighthouse project API key included
claude mcp add exa -e EXA_API_KEY=c5675d32-69ff-497f-a239-6168b2fade10 -- npx -y exa-mcp-server
```

**Capabilities**:
- AI-powered web search
- Content extraction from URLs
- Related content discovery
- Technical documentation search

**Note**: This uses the Lighthouse project's Exa API key. For other projects, obtain a key from https://exa.ai

## Step 4: Context7 Documentation MCP Server

**Purpose**: Access to comprehensive technical documentation and API references via HTTP transport.

**Ask user**: "Do you want to install Context7 documentation MCP?"

**Installation**:
```bash
# Lighthouse project API key included
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ctx7sk-577b979a-3e5f-4c38-9cff-3ed7eb372d8f"
```

**Capabilities**:
- Technical documentation search
- API reference lookup
- Framework and library documentation
- Code examples and patterns

**Note**: This uses the Lighthouse project's Context7 API key. For other projects, obtain a key from https://context7.com

## Step 5: Semgrep Security MCP Server

**Purpose**: Static code analysis and security vulnerability detection.

**Ask user**: "Do you want to install Semgrep security scanning MCP?"

**Installation**:
```bash
claude mcp add semgrep uvx semgrep-mcp
```

**Capabilities**:
- Security vulnerability detection
- Code quality analysis
- Pattern-based code scanning
- OWASP Top 10 detection
- Custom rule support

**Requirements**: Python 3.8+ with uvx installed

## Step 6: Serena Memory MCP Server

**Purpose**: Project-specific memory and context management for better code understanding.

**Ask user**: "Do you want to install Serena memory MCP for this project?"

**Installation**:
```bash
# Install for current project directory
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
```

**Capabilities**:
- Project-specific memory persistence
- Code context understanding
- Symbol-level code navigation
- Cross-file reference tracking
- Intelligent code search

**Requirements**: Python 3.8+ with uvx installed

**Note**: This server is project-specific and uses the current working directory.

## Step 7: Browser MCP Server (Manual Configuration)

**Purpose**: Web browser automation and testing capabilities.

**Ask user**: "Do you want to install Browser MCP for automated testing?"

**Installation** (requires manual mcp.json edit):

1. Locate MCP configuration file:
   - macOS: `~/Library/Application Support/Claude/mcp.json`
   - Linux: `~/.config/Claude/mcp.json`
   - Windows: `%APPDATA%\Claude\mcp.json`

2. Add the following to the `mcpServers` object:

```json
"browsermcp": {
  "command": "npx",
  "args": ["@browsermcp/mcp@latest"]
}
```

3. Full example mcp.json structure:
```json
{
  "mcpServers": {
    "browsermcp": {
      "command": "npx",
      "args": ["@browsermcp/mcp@latest"]
    }
  }
}
```

**Capabilities**:
- Browser automation for testing
- Web page interaction
- Screenshot capture
- Form filling and validation
- End-to-end test execution

## Step 8: Verify Installation

After installing desired servers, verify they're working:

```bash
# List all configured servers
claude mcp list

# Test connection to each server (will attempt to start servers)
# Check logs for any connection errors
```

## Step 9: Restart Claude Code

**IMPORTANT**: After adding MCP servers, restart Claude Code for changes to take effect:

```bash
# Kill any running Claude Code processes
pkill -f "claude"

# Restart Claude Code CLI
claude
```

## Configuration Summary

Create a summary of installed servers:

```markdown
## Installed MCP Servers

- [ ] Azure DevOps: {organization-url} (Work items, repos, pipelines)
- [ ] Exa Search: Enabled (Web search capabilities)
- [ ] Context7: Enabled (Documentation access)
- [ ] Semgrep: Enabled (Security scanning)
- [ ] Serena: Enabled for {project-path} (Memory and context)
- [ ] Browser MCP: Enabled (Browser automation)

## Authentication Status
- Azure DevOps: {Pending/Authenticated}

## Next Steps
- Test each MCP server with basic queries
- Configure project-specific Azure DevOps settings if applicable
- Review MCP server documentation for advanced features
```

## Troubleshooting

**If MCP server fails to start:**
1. Check Node.js/Python installation: `node --version`, `python --version`
2. Verify network connectivity for package downloads
3. Check Claude Code logs: `~/.claude/logs/`
4. Ensure API keys are correctly formatted (no extra quotes or spaces)

**If Azure DevOps authentication fails:**
1. Ensure you have access to the organization
2. Check that your Azure AD account has proper permissions
3. Try manual authentication: `az login`

**If Serena fails to start:**
1. Verify uvx is installed: `uvx --version`
2. Check project path is correct: `pwd`
3. Ensure git repository is initialized

## Important Notes

- **API Keys**: The Exa and Context7 API keys provided are for the Lighthouse project. Replace with your own keys for other projects.
- **Project-Specific**: Serena MCP is tied to the current project directory - reinstall for each new project.
- **Transport Types**: Most servers use stdio transport, but Context7 uses HTTP transport (different configuration syntax).
- **Performance**: Having multiple MCP servers active can increase response time. Only install servers you'll actively use.

## Success Criteria

- [ ] All desired MCP servers installed successfully
- [ ] MCP configuration verified with `claude mcp list`
- [ ] Claude Code restarted
- [ ] Test queries confirm server connectivity
- [ ] Azure DevOps authentication completed (if installed)
- [ ] Configuration summary documented
