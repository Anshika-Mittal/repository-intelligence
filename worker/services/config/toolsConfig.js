const getFileContent = require("../tools/getFileContent");
const getRepoStructure = require("../tools/getRepoStructure");
const searchCode = require("../tools/searchCode");
const toolsConfig = {
  tools: [
    {
      toolSpec: {
        name: "get_repo_structure",
        description:
          "Get the directory and file structure of a GitHub repository.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              owner: {
                type: "string",
                description: "GitHub repository owner."
              },
              repo: {
                type: "string",
                description: "GitHub repository name."
              },
              branch: {
                type: "string",
                description:
                  "Optional branch name. Defaults to the repository's default branch."
              }
            },
            required: ["owner", "repo"]
          }
        }
      }
    },
    {
      toolSpec: {
        name: "search_code",
        description:
          "Search for a keyword or pattern in a GitHub repository's code.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              owner: { type: "string" },
              repo: { type: "string" },
              query: {
                type: "string",
                description: "The code keyword or pattern to search for."
              }
            },
            required: ["owner", "repo", "query"]
          }
        }
      }
    },
    {
      toolSpec: {
        name: "get_file_content",
        description:
          "Retrieve the contents of a specific file from a GitHub repository.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              owner: { type: "string" },
              repo: { type: "string" },
              path: {
                type: "string",
                description: "File path relative to the repository root."
              },
              branch: { type: "string" }
            },
            required: ["owner", "repo", "path"]
          }
        }
      }
    }
  ],
  toolChoice: {
    auto: {}
  }
};

const tool_functions = {
    "get_file_content": getFileContent,
    "search_code": getRepoStructure,
    "get_repo_structure": searchCode
}

function tool_run(tool_name, tool_input){
    func = tool_functions[tool_name];
    if (func === undefined){
        return {"error": `Unknown tool ${tool_name}`};
    }
    return func(tool_input);
}

module.exports = {toolsConfig, tool_run, tool_functions};
