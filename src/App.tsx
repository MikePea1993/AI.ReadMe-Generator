import React, { useState, useCallback, useRef } from "react";
import {
  Bot,
  Clipboard,
  Check,
  LoaderCircle,
  Stars,
  Eye,
  Code,
  Settings,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  AlignCenter,
  AlignLeft,
  RefreshCw,
  Zap,
  Award,
  Bold,
  Italic,
  Link,
  Type,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "./App.css";

const App = () => {
  const [projectPlan, setProjectPlan] = useState("");
  const [readmeContent, setReadmeContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const [viewMode, setViewMode] = useState("preview");
  const [showOptions, setShowOptions] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editChanges, setEditChanges] = useState({
    removedSections: [],
    centeredSections: [],
    textEdits: {},
    inlineFormats: {}, // New: stores inline formatting for each section
    sectionAlignments: {},
    badgeUpdates: {},
    animationUpdates: {},
  });

  const [options, setOptions] = useState({
    includeBadges: true,
    animatedText: false,
    separateBadges: false,
    includeTableOfContents: false,
    includeDemoSection: false,
    includeScreenshots: false,
    includeApiDocs: false,
    includeDeployment: false,
    includeContributing: true,
    includeLicense: true,
    includeAcknowledgments: false,
    includeChangelog: false,
    badgeStyle: "flat",
    emojiStyle: "subtle",
    centerContent: false,
    iconBadges: false,
    animationColor: "36BCF7",
    animationSpeed: "50",
    animationFont: "Fira Code",
  });

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const placeholderText = `e.g.,

Project Name: CoolProject

Tech Stack: React, TypeScript, Firebase

Description: A web app that helps users track their daily habits and goals. It will have user authentication, a dashboard to view habits, and the ability to add, edit, and delete habits.

Features:
- User sign-up and login
- Dashboard with habit visualization
- CRUD operations for habits
- Daily reminders (future feature)

License: MIT
`;

  const generateReadme = useCallback(async () => {
    if (!apiKey) {
      setError(
        "API key is not configured. Please set VITE_GEMINI_API_KEY in your .env.local file."
      );
      return;
    }
    if (!projectPlan.trim()) {
      setError("Project plan cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError("");
    setReadmeContent("");

    let sectionsPrompt = "";
    let badgeInstructions = "";
    let styleInstructions = "";

    if (options.includeBadges) {
      const badgeStyleMap = {
        flat: "flat",
        "flat-square": "flat-square",
        "for-the-badge": "for-the-badge",
        plastic: "plastic",
      };

      const iconInstruction = options.iconBadges
        ? "Use icon badges with tech stack logos from shields.io. Format: ![Tech Name](https://img.shields.io/badge/Tech_Name-color?style=" +
          badgeStyleMap[options.badgeStyle] +
          "&logo=logoname&logoColor=white). Use appropriate logos like 'react', 'typescript', 'javascript', 'nodejs', 'python', 'html5', 'css3', 'mongodb', 'postgresql', etc."
        : "Use shields.io format with style=" +
          badgeStyleMap[options.badgeStyle];

      if (options.separateBadges) {
        badgeInstructions = `3. Create a "Badges" section with relevant badges using ${iconInstruction}. Put each badge on a separate line. Include badges for: License, Tech stack technologies, Version (1.0.0), Build status (passing).`;
      } else {
        badgeInstructions = `3. Add relevant badges after the description using ${iconInstruction}. Place all badges on the same line. Include badges for: License, Tech stack technologies, Version (1.0.0), Build status (passing).`;
      }
    }

    if (options.animatedText) {
      styleInstructions += `Use animated text for the main title with this format: <h1 align="center"><img src="https://readme-typing-svg.herokuapp.com?font=${encodeURIComponent(
        options.animationFont
      )}&pause=1000&color=${
        options.animationColor
      }&center=true&vCenter=true&width=435&speed=${
        options.animationSpeed
      }&lines=[PROJECT_NAME]" alt="Typing SVG" /></h1>\n`;
    }

    if (options.centerContent) {
      styleInstructions +=
        'Wrap main sections (title, description, badges, key content) in <div align="center"> tags for center alignment. Use <p align="center"> for paragraphs that should be centered.\n';
    }

    const emojiMap = {
      none: "",
      subtle: "Add subtle emojis (1-2 per section header, like 🚀 ✨ 📦 🛠️)",
      heavy:
        "Add multiple relevant emojis throughout headers and bullet points",
    };

    const sections = [
      '4. A "## Features" section with a bulleted list of key features.',
      '5. An "## Installation" section with step-by-step instructions.',
      '6. A "## Usage" section explaining how to use the application.',
      '7. A "## Tech Stack" section listing the technologies used.',
    ];

    if (options.includeTableOfContents) {
      sections.splice(
        0,
        0,
        '4. A "## Table of Contents" section with links to other sections.'
      );
    }

    if (options.includeDemoSection) {
      sections.push(
        "## Demo section with placeholder for live demo link and GIF/video."
      );
    }

    if (options.includeScreenshots) {
      sections.push("## Screenshots section with placeholder image markdown.");
    }

    if (options.includeApiDocs) {
      sections.push("## API Documentation section with endpoint examples.");
    }

    if (options.includeDeployment) {
      sections.push("## Deployment section with deployment instructions.");
    }

    if (options.includeContributing) {
      sections.push("## Contributing section with standard guidelines.");
    }

    if (options.includeLicense) {
      sections.push("## License section mentioning the license type.");
    }

    if (options.includeAcknowledgments) {
      sections.push("## Acknowledgments section for credits and thanks.");
    }

    if (options.includeChangelog) {
      sections.push("## Changelog section with version history.");
    }

    sectionsPrompt = sections
      .map((section, index) => `${index + 1}. ${section}`)
      .join("\n");

    const prompt = `
            Based on the following project plan, generate a complete, professional README.md file in Markdown format.

            The README should include:
            1. A main title for the project (use # heading).
            2. A concise, one-sentence description of the project.
            ${badgeInstructions}
            ${sectionsPrompt}

            Style Guidelines:
            ${styleInstructions}
            ${emojiMap[options.emojiStyle]}
            - Use proper markdown syntax: # for main title, ## for section headers
            - Use ![alt](url) for images and badges
            - Use \`code\` for inline code and \`\`\`language for code blocks
            - Use proper list formatting with - or *
            - Make it professional but engaging

            Here is the project plan:
            ---
            ${projectPlan}
            ---

            IMPORTANT: Generate ONLY raw markdown content. Do NOT wrap the output in code blocks or markdown fences. Do NOT include \`\`\`markdown at the beginning or \`\`\` at the end. Start directly with the # heading.
        `;

    try {
      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = `API request failed with status: ${response.status}`;

        try {
          const parsedError = JSON.parse(errorData);
          if (parsedError.error) {
            if (response.status === 503) {
              errorMessage =
                "🔄 Gemini servers are currently overloaded. Please try again in a few moments.";
            } else if (response.status === 429) {
              errorMessage =
                "⏱️ Rate limit reached. Please wait a moment before trying again.";
            } else if (response.status === 400) {
              errorMessage =
                "❌ Invalid request. Please check your project plan and try again.";
            } else if (response.status === 401 || response.status === 403) {
              errorMessage =
                "🔑 API key issue. Please check your VITE_GEMINI_API_KEY configuration.";
            } else {
              errorMessage = `❌ ${
                parsedError.error.message || "Unknown error occurred"
              }`;
            }
          }
        } catch {
          // If we can't parse the error, use the generic message
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        let cleanedText = text.trim();

        if (cleanedText.startsWith("```markdown")) {
          cleanedText = cleanedText.replace(/^```markdown\s*/, "");
        }
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```\s*/, "");
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.replace(/\s*```$/, "");
        }

        setReadmeContent(cleanedText);
      } else {
        throw new Error(
          "❌ Invalid response structure from AI. Please try again."
        );
      }
    } catch (e) {
      console.error(e);
      const errorMessage =
        e instanceof Error ? e.message : "❌ An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [projectPlan, apiKey, options]);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(readmeContent)
      .then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const handleOptionChange = (key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const parseMarkdownSections = (content) => {
    if (!content) return [];

    const sections = [];
    const lines = content.split("\n");
    let currentSection = null;

    lines.forEach((line, index) => {
      if (line.startsWith("#")) {
        if (currentSection) {
          sections.push(currentSection);
        }

        currentSection = {
          id: `section-${sections.length}`,
          title: line.replace(/^#+\s*/, ""),
          fullTitle: line,
          content: line,
          startLine: index,
          type: line.startsWith("##") ? "section" : "title",
        };
      } else if (currentSection) {
        currentSection.content += "\n" + line;
      } else {
        if (sections.length === 0) {
          sections.push({
            id: "intro",
            title: "Introduction",
            fullTitle: "",
            content: line,
            startLine: index,
            type: "intro",
          });
        } else if (sections[sections.length - 1].type === "intro") {
          sections[sections.length - 1].content += "\n" + line;
        }
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const handleSectionEdit = (sectionId, action, value = null) => {
    const section = parseMarkdownSections(readmeContent).find(
      (s) => s.id === sectionId
    );
    if (!section) return;

    setEditChanges((prev) => {
      const newChanges = { ...prev };

      switch (action) {
        case "remove":
          if (!newChanges.removedSections.includes(section.title)) {
            newChanges.removedSections.push(section.title);
          }
          break;

        case "restore":
          newChanges.removedSections = newChanges.removedSections.filter(
            (s) => s !== section.title
          );
          break;

        case "center":
          if (!newChanges.centeredSections.includes(section.title)) {
            newChanges.centeredSections.push(section.title);
          } else {
            newChanges.centeredSections = newChanges.centeredSections.filter(
              (s) => s !== section.title
            );
          }
          break;

        case "align-left":
          newChanges.centeredSections = newChanges.centeredSections.filter(
            (s) => s !== section.title
          );
          break;

        case "edit-text":
          newChanges.textEdits[section.title] = value;
          break;

        case "inline-format":
          if (!newChanges.inlineFormats[section.title]) {
            newChanges.inlineFormats[section.title] = [];
          }
          newChanges.inlineFormats[section.title].push(value);
          break;

        case "add-badges":
          newChanges.badgeUpdates[section.title] = value;
          break;

        case "add-animation":
          newChanges.animationUpdates[section.title] = value;
          break;
      }

      return newChanges;
    });
  };

  const updateWithChanges = useCallback(async () => {
    if (!apiKey || !projectPlan.trim()) return;

    setIsUpdating(true);
    setError("");

    let changeInstructions = "";

    if (editChanges.removedSections.length > 0) {
      changeInstructions += `\nREMOVE these sections: ${editChanges.removedSections.join(
        ", "
      )}`;
    }

    if (editChanges.centeredSections.length > 0) {
      changeInstructions += `\nCENTER these sections with <div align="center"> tags: ${editChanges.centeredSections.join(
        ", "
      )}`;
    }

    if (Object.keys(editChanges.textEdits).length > 0) {
      changeInstructions += `\nTEXT EDITS:`;
      Object.entries(editChanges.textEdits).forEach(([section, newText]) => {
        changeInstructions += `\n- Replace content in "${section}" section with: "${newText}"`;
      });
    }

    if (Object.keys(editChanges.badgeUpdates).length > 0) {
      changeInstructions += `\nBADGE UPDATES:`;
      Object.entries(editChanges.badgeUpdates).forEach(
        ([section, badgeConfig]) => {
          if (badgeConfig.addBadges) {
            changeInstructions += `\n- Add relevant badges to "${section}" section using ${badgeConfig.badgeStyle} style from shields.io. Include tech stack and status badges.`;
          }
        }
      );
    }

    if (Object.keys(editChanges.animationUpdates).length > 0) {
      changeInstructions += `\nANIMATION UPDATES:`;
      Object.entries(editChanges.animationUpdates).forEach(
        ([section, animConfig]) => {
          if (animConfig.addAnimation) {
            changeInstructions += `\n- Add animated typing text to "${section}" section header using: <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=${
              animConfig.animationColor
            }&center=true&vCenter=true&width=435&lines=${section.replace(
              /\s+/g,
              "+"
            )}" alt="Typing SVG" />`;
          }
        }
      );
    }

    const updatePrompt = `
      You previously generated a README for this project. Now I need you to update it with specific changes while keeping everything else the same.

      ORIGINAL PROJECT PLAN:
      ${projectPlan}

      CURRENT README CONTENT:
      ${readmeContent}

      CHANGES TO MAKE:
      ${
        changeInstructions ||
        "No specific changes requested - just regenerate with current options"
      }

      IMPORTANT INSTRUCTIONS:
      - Keep all existing content and structure UNLESS specifically mentioned in the changes above
      - Apply the changes exactly as requested
      - Maintain the same style, badges, and formatting from the original
      - Generate ONLY raw markdown content (no code fences)
      - Keep the same professional quality and completeness
    `;

    try {
      const chatHistory = [{ role: "user", parts: [{ text: updatePrompt }] }];
      const payload = { contents: chatHistory };
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = `API request failed with status: ${response.status}`;

        try {
          const parsedError = JSON.parse(errorData);
          if (parsedError.error) {
            if (response.status === 503) {
              errorMessage =
                "🔄 Gemini servers are currently overloaded. Please try again in a few moments.";
            } else if (response.status === 429) {
              errorMessage =
                "⏱️ Rate limit reached. Please wait a moment before trying again.";
            } else {
              errorMessage = `❌ ${
                parsedError.error.message || "Unknown error occurred"
              }`;
            }
          }
        } catch {
          // If we can't parse the error, use the generic message
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        let cleanedText = text.trim();

        if (cleanedText.startsWith("```markdown")) {
          cleanedText = cleanedText.replace(/^```markdown\s*/, "");
        }
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```\s*/, "");
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.replace(/\s*```$/, "");
        }

        setReadmeContent(cleanedText);

        setEditChanges({
          removedSections: [],
          centeredSections: [],
          textEdits: {},
          sectionAlignments: {},
          badgeUpdates: {},
          animationUpdates: {},
          inlineFormats: {},
        });

        setEditMode(false);
      } else {
        throw new Error(
          "❌ Invalid response structure from AI. Please try again."
        );
      }
    } catch (e) {
      console.error(e);
      const errorMessage =
        e instanceof Error ? e.message : "❌ An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [projectPlan, apiKey, readmeContent, editChanges]);

  return (
    <div className="app-container">
      <div className="max-width-container">
        <header className="header">
          <div className="title-container">
            <Bot className="title-icon" />
            <h1 className="title">AI README.md Generator</h1>
          </div>
          <p className="subtitle">
            Create professional README files from your project plans in seconds.
          </p>
        </header>

        <main className="main-grid">
          <div className="panel">
            <h2 className="panel-title">Your Project Plan</h2>

            <div className="options-toggle">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="toggle-options-btn"
              >
                <Settings size={16} />
                Customize README
                {showOptions ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>

            {showOptions && (
              <div className="options-panel">
                <div className="options-section">
                  <h4>Content Sections</h4>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.includeBadges}
                      onChange={(e) =>
                        handleOptionChange("includeBadges", e.target.checked)
                      }
                    />
                    Include Badges
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.includeTableOfContents}
                      onChange={(e) =>
                        handleOptionChange(
                          "includeTableOfContents",
                          e.target.checked
                        )
                      }
                    />
                    Table of Contents
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.includeDemoSection}
                      onChange={(e) =>
                        handleOptionChange(
                          "includeDemoSection",
                          e.target.checked
                        )
                      }
                    />
                    Demo Section
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.includeScreenshots}
                      onChange={(e) =>
                        handleOptionChange(
                          "includeScreenshots",
                          e.target.checked
                        )
                      }
                    />
                    Screenshots Section
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.includeApiDocs}
                      onChange={(e) =>
                        handleOptionChange("includeApiDocs", e.target.checked)
                      }
                    />
                    API Documentation
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.includeDeployment}
                      onChange={(e) =>
                        handleOptionChange(
                          "includeDeployment",
                          e.target.checked
                        )
                      }
                    />
                    Deployment Guide
                  </label>
                </div>

                <div className="options-section">
                  <h4>Style Options</h4>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.animatedText}
                      onChange={(e) =>
                        handleOptionChange("animatedText", e.target.checked)
                      }
                    />
                    Animated Title
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.centerContent}
                      onChange={(e) =>
                        handleOptionChange("centerContent", e.target.checked)
                      }
                    />
                    Center Content
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.iconBadges}
                      onChange={(e) =>
                        handleOptionChange("iconBadges", e.target.checked)
                      }
                      disabled={!options.includeBadges}
                    />
                    Icon Badges (Tech Stack)
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={options.separateBadges}
                      onChange={(e) =>
                        handleOptionChange("separateBadges", e.target.checked)
                      }
                      disabled={!options.includeBadges}
                    />
                    Separate Badge Lines
                  </label>

                  <div className="select-group">
                    <label>Badge Style:</label>
                    <select
                      value={options.badgeStyle}
                      onChange={(e) =>
                        handleOptionChange("badgeStyle", e.target.value)
                      }
                      disabled={!options.includeBadges}
                      className="style-select"
                    >
                      <option value="flat">Flat</option>
                      <option value="flat-square">Flat Square</option>
                      <option value="for-the-badge">For The Badge</option>
                      <option value="plastic">Plastic</option>
                    </select>
                  </div>

                  <div className="select-group">
                    <label>Emoji Style:</label>
                    <select
                      value={options.emojiStyle}
                      onChange={(e) =>
                        handleOptionChange("emojiStyle", e.target.value)
                      }
                      className="style-select"
                    >
                      <option value="none">None</option>
                      <option value="subtle">Subtle</option>
                      <option value="heavy">Heavy</option>
                    </select>
                  </div>
                </div>

                {options.animatedText && (
                  <div className="options-section">
                    <h4>Animation Settings</h4>
                    <div className="select-group">
                      <label>Animation Color:</label>
                      <div className="color-picker-group">
                        <input
                          type="color"
                          value={`#${options.animationColor}`}
                          onChange={(e) =>
                            handleOptionChange(
                              "animationColor",
                              e.target.value.replace("#", "")
                            )
                          }
                          className="color-picker"
                        />
                        <div className="color-input-group">
                          <span className="color-hash">#</span>
                          <input
                            type="text"
                            value={options.animationColor}
                            onChange={(e) =>
                              handleOptionChange(
                                "animationColor",
                                e.target.value.replace("#", "")
                              )
                            }
                            placeholder="36BCF7"
                            className="color-input"
                            maxLength="6"
                          />
                        </div>
                        <div className="color-presets">
                          {[
                            { name: "Cyan", color: "36BCF7" },
                            { name: "Blue", color: "007ACC" },
                            { name: "Green", color: "00D26A" },
                            { name: "Purple", color: "8B5CF6" },
                            { name: "Red", color: "FF6B6B" },
                            { name: "Orange", color: "FF8C42" },
                          ].map((preset) => (
                            <button
                              key={preset.color}
                              className="color-preset"
                              style={{ backgroundColor: `#${preset.color}` }}
                              onClick={() =>
                                handleOptionChange(
                                  "animationColor",
                                  preset.color
                                )
                              }
                              title={preset.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="select-group">
                      <label>Animation Font:</label>
                      <select
                        value={options.animationFont}
                        onChange={(e) =>
                          handleOptionChange("animationFont", e.target.value)
                        }
                        className="style-select"
                      >
                        <option value="Fira Code">Fira Code</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Ubuntu">Ubuntu</option>
                        <option value="JetBrains Mono">JetBrains Mono</option>
                        <option value="Source Code Pro">Source Code Pro</option>
                        <option value="Inter">Inter</option>
                        <option value="Poppins">Poppins</option>
                      </select>
                    </div>

                    <div className="select-group">
                      <label>Animation Speed:</label>
                      <select
                        value={options.animationSpeed}
                        onChange={(e) =>
                          handleOptionChange("animationSpeed", e.target.value)
                        }
                        className="style-select"
                      >
                        <option value="30">Very Fast</option>
                        <option value="50">Fast</option>
                        <option value="70">Normal</option>
                        <option value="100">Slow</option>
                        <option value="150">Very Slow</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <textarea
              value={projectPlan}
              onChange={(e) => setProjectPlan(e.target.value)}
              placeholder={placeholderText}
              className="textarea"
              aria-label="Project Plan Input"
            />
            <button
              onClick={generateReadme}
              disabled={isLoading}
              className="generate-button"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="spinner-icon" />
                  Generating...
                </>
              ) : (
                <>
                  <Stars className="button-icon" />
                  Generate README
                </>
              )}
            </button>
            {error && <p className="error-message">{error}</p>}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode("preview")}
                  className={
                    viewMode === "preview"
                      ? "toggle-button active"
                      : "toggle-button"
                  }
                >
                  <Eye size={16} /> Preview
                </button>
                <button
                  onClick={() => setViewMode("raw")}
                  className={
                    viewMode === "raw"
                      ? "toggle-button active"
                      : "toggle-button"
                  }
                >
                  <Code size={16} /> Raw
                </button>
                {readmeContent && viewMode === "preview" && (
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={
                      editMode
                        ? "toggle-button active edit-mode"
                        : "toggle-button"
                    }
                  >
                    <Edit3 size={16} /> {editMode ? "Exit Edit" : "Edit"}
                  </button>
                )}
              </div>

              <div className="header-actions">
                {editMode && readmeContent && (
                  <button
                    onClick={updateWithChanges}
                    disabled={isUpdating}
                    className="update-button"
                  >
                    {isUpdating ? (
                      <>
                        <LoaderCircle className="spinner-icon" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        Update README
                      </>
                    )}
                  </button>
                )}

                {readmeContent && !editMode && (
                  <button onClick={copyToClipboard} className="copy-button">
                    {hasCopied ? (
                      <Check className="copy-icon-success" />
                    ) : (
                      <Clipboard className="button-icon" />
                    )}
                    {hasCopied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            </div>
            <div className="preview-area-container">
              {!readmeContent ? (
                <div className="placeholder-text">
                  {isLoading
                    ? "AI is crafting your README..."
                    : "Your generated README will appear here."}
                </div>
              ) : viewMode === "preview" ? (
                <div className="preview-area prose">
                  {editMode && (
                    <div className="edit-mode-notice">
                      <div className="notice-content">
                        <Edit3 size={16} />
                        <span>
                          Edit Mode Active: Hover over sections to see editing
                          controls, select text to apply formatting
                        </span>
                      </div>
                    </div>
                  )}
                  {editMode ? (
                    <EditablePreview
                      content={readmeContent}
                      onSectionEdit={handleSectionEdit}
                      editChanges={editChanges}
                    />
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {readmeContent}
                    </ReactMarkdown>
                  )}
                </div>
              ) : (
                <pre className="raw-code-area">
                  <code>{readmeContent}</code>
                </pre>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const EditablePreview = ({ content, onSectionEdit, editChanges }) => {
  const [editingSection, setEditingSection] = useState(null);
  const [editText, setEditText] = useState("");
  const [selectedText, setSelectedText] = useState({
    start: 0,
    end: 0,
    text: "",
  });
  const [sectionSettings, setSectionSettings] = useState({
    centered: false,
    badges: { enabled: false, style: "for-the-badge" },
    animation: { enabled: false, color: "36BCF7" },
  });

  const textareaRef = useRef(null);

  const sections = React.useMemo(() => {
    if (!content) return [];

    const lines = content.split("\n");
    const sectionList = [];
    let currentSection = null;

    lines.forEach((line, index) => {
      if (line.startsWith("#")) {
        if (currentSection) {
          sectionList.push(currentSection);
        }

        currentSection = {
          id: `section-${sectionList.length}`,
          title: line.replace(/^#+\s*/, ""),
          fullTitle: line,
          content: line,
          startLine: index,
          type: line.startsWith("##") ? "section" : "title",
        };
      } else if (currentSection) {
        currentSection.content += "\n" + line;
      } else {
        if (sectionList.length === 0) {
          sectionList.push({
            id: "intro",
            title: "Introduction",
            fullTitle: "",
            content: line,
            startLine: index,
            type: "intro",
          });
        } else if (sectionList[sectionList.length - 1].type === "intro") {
          sectionList[sectionList.length - 1].content += "\n" + line;
        }
      }
    });

    if (currentSection) {
      sectionList.push(currentSection);
    }

    return sectionList;
  }, [content]);

  // Handle text selection in textarea
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);

      if (selectedText.length > 0) {
        setSelectedText({ start, end, text: selectedText });
      }
    }
  };

  // Apply formatting to selected text
  const applyInlineFormatting = (type, options = {}) => {
    if (!selectedText.text || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const { start, end, text } = selectedText;
    let formattedText = text;

    switch (type) {
      case "bold":
        formattedText = `**${text}**`;
        break;
      case "italic":
        formattedText = `*${text}*`;
        break;
      case "center":
        formattedText = `<div align="center">${text}</div>`;
        break;
      case "animate":
        const animationColor = options.color || "36BCF7";
        const encodedText = encodeURIComponent(text.replace(/\s+/g, "+"));
        formattedText = `<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=${animationColor}&center=true&vCenter=true&width=435&lines=${encodedText}" alt="Typing Animation" />`;
        break;
      case "badge":
        const badgeStyle = options.style || "for-the-badge";
        formattedText = `![${text}](https://img.shields.io/badge/${text.replace(
          /\s+/g,
          "_"
        )}-blue?style=${badgeStyle})`;
        break;
      case "link":
        const url = options.url || "#";
        formattedText = `[${text}](${url})`;
        break;
    }

    // Replace the selected text with formatted text
    const newValue =
      editText.substring(0, start) + formattedText + editText.substring(end);
    setEditText(newValue);

    // Update cursor position
    setTimeout(() => {
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);

    // Clear selection
    setSelectedText({ start: 0, end: 0, text: "" });
  };

  const handleEditClick = (section) => {
    setEditingSection(section.id);
    setEditText(section.content);
    setSelectedText({ start: 0, end: 0, text: "" });

    // Initialize section settings based on current state
    setSectionSettings({
      centered: editChanges.centeredSections.includes(section.title),
      badges: editChanges.badgeUpdates[section.title] || {
        enabled: false,
        style: "for-the-badge",
      },
      animation: editChanges.animationUpdates[section.title] || {
        enabled: false,
        color: "36BCF7",
      },
    });
  };

  const handleSaveEdit = (section) => {
    // Save text changes
    onSectionEdit(section.id, "edit-text", editText);

    // Save centering
    if (
      sectionSettings.centered !==
      editChanges.centeredSections.includes(section.title)
    ) {
      onSectionEdit(
        section.id,
        sectionSettings.centered ? "center" : "align-left"
      );
    }

    // Save badge settings
    if (sectionSettings.badges.enabled) {
      onSectionEdit(section.id, "add-badges", {
        addBadges: true,
        badgeStyle: sectionSettings.badges.style,
      });
    }

    // Save animation settings
    if (sectionSettings.animation.enabled) {
      onSectionEdit(section.id, "add-animation", {
        addAnimation: true,
        animationColor: sectionSettings.animation.color,
      });
    }

    setEditingSection(null);
    setEditText("");
    setSelectedText({ start: 0, end: 0, text: "" });
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditText("");
    setSelectedText({ start: 0, end: 0, text: "" });
  };

  return (
    <div className="editable-preview">
      {sections.map((section) => {
        const isRemoved = editChanges.removedSections.includes(section.title);
        const isCentered = editChanges.centeredSections.includes(section.title);
        const isEditing = editingSection === section.id;
        const hasTextEdit = editChanges.textEdits[section.title];

        if (isRemoved) {
          return (
            <div key={section.id} className="section-wrapper removed-section">
              <div className="section-controls removed-controls">
                <div className="removed-content">
                  <span className="removed-label">
                    🗑️ Section "{section.title}" Removed
                  </span>
                  <button
                    className="control-button restore"
                    onClick={() => onSectionEdit(section.id, "restore")}
                    title="Restore Section"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={section.id}
            className={`section-wrapper ${
              isCentered ? "centered-section" : ""
            }`}
          >
            <div className="section-controls">
              <div className="control-group">
                <button
                  className="control-button delete"
                  onClick={() => onSectionEdit(section.id, "remove")}
                  title="Remove Section"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  className="control-button edit"
                  onClick={() => handleEditClick(section)}
                  title="Edit Section"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>

            <div className="section-content">
              {isEditing ? (
                <div className="edit-mode-section">
                  <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onSelect={handleTextSelection}
                    onMouseUp={handleTextSelection}
                    onKeyUp={handleTextSelection}
                    className="section-textarea"
                    rows={Math.max(3, editText.split("\n").length)}
                  />

                  {/* Text Selection Formatting Toolbar */}
                  {selectedText.text && (
                    <div className="text-selection-toolbar">
                      <div className="selection-info">
                        Selected: "
                        {selectedText.text.length > 30
                          ? selectedText.text.substring(0, 30) + "..."
                          : selectedText.text}
                        "
                      </div>
                      <div className="formatting-buttons">
                        <button
                          onClick={() => applyInlineFormatting("bold")}
                          className="format-btn"
                          title="Make Bold"
                        >
                          <Bold size={14} />
                        </button>
                        <button
                          onClick={() => applyInlineFormatting("italic")}
                          className="format-btn"
                          title="Make Italic"
                        >
                          <Italic size={14} />
                        </button>
                        <button
                          onClick={() => applyInlineFormatting("center")}
                          className="format-btn"
                          title="Center Text"
                        >
                          <AlignCenter size={14} />
                        </button>
                        <button
                          onClick={() =>
                            applyInlineFormatting("animate", {
                              color: sectionSettings.animation.color,
                            })
                          }
                          className="format-btn"
                          title="Animate Text"
                        >
                          <Zap size={14} />
                        </button>
                        <button
                          onClick={() =>
                            applyInlineFormatting("badge", {
                              style: sectionSettings.badges.style,
                            })
                          }
                          className="format-btn"
                          title="Convert to Badge"
                        >
                          <Award size={14} />
                        </button>
                        <button
                          onClick={() => {
                            const url = prompt("Enter URL:", "#");
                            if (url) applyInlineFormatting("link", { url });
                          }}
                          className="format-btn"
                          title="Make Link"
                        >
                          <Link size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section-specific editing controls */}
                  <div className="section-edit-controls">
                    <div className="edit-options-row">
                      <label className="edit-option">
                        <input
                          type="checkbox"
                          checked={sectionSettings.centered}
                          onChange={(e) =>
                            setSectionSettings((prev) => ({
                              ...prev,
                              centered: e.target.checked,
                            }))
                          }
                        />
                        <AlignCenter size={14} /> Center Section
                      </label>

                      <label className="edit-option">
                        <input
                          type="checkbox"
                          checked={sectionSettings.badges.enabled}
                          onChange={(e) =>
                            setSectionSettings((prev) => ({
                              ...prev,
                              badges: {
                                ...prev.badges,
                                enabled: e.target.checked,
                              },
                            }))
                          }
                        />
                        <Award size={14} /> Add Badges
                      </label>

                      <label className="edit-option">
                        <input
                          type="checkbox"
                          checked={sectionSettings.animation.enabled}
                          onChange={(e) =>
                            setSectionSettings((prev) => ({
                              ...prev,
                              animation: {
                                ...prev.animation,
                                enabled: e.target.checked,
                              },
                            }))
                          }
                        />
                        <Zap size={14} /> Animate Text
                      </label>
                    </div>

                    {/* Badge style selector */}
                    {sectionSettings.badges.enabled && (
                      <div className="edit-option-details">
                        <label>Badge Style:</label>
                        <select
                          value={sectionSettings.badges.style}
                          onChange={(e) =>
                            setSectionSettings((prev) => ({
                              ...prev,
                              badges: { ...prev.badges, style: e.target.value },
                            }))
                          }
                          className="mini-select"
                        >
                          <option value="flat">Flat</option>
                          <option value="flat-square">Flat Square</option>
                          <option value="for-the-badge">For The Badge</option>
                          <option value="plastic">Plastic</option>
                        </select>
                      </div>
                    )}

                    {/* Animation color picker */}
                    {sectionSettings.animation.enabled && (
                      <div className="edit-option-details">
                        <label>Animation Color:</label>
                        <div className="mini-color-group">
                          <input
                            type="color"
                            value={`#${sectionSettings.animation.color}`}
                            onChange={(e) =>
                              setSectionSettings((prev) => ({
                                ...prev,
                                animation: {
                                  ...prev.animation,
                                  color: e.target.value.replace("#", ""),
                                },
                              }))
                            }
                            className="mini-color-picker"
                          />
                          <input
                            type="text"
                            value={sectionSettings.animation.color}
                            onChange={(e) =>
                              setSectionSettings((prev) => ({
                                ...prev,
                                animation: {
                                  ...prev.animation,
                                  color: e.target.value.replace("#", ""),
                                },
                              }))
                            }
                            className="mini-color-input"
                            maxLength="6"
                            placeholder="36BCF7"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="edit-controls">
                    <button
                      className="save-button"
                      onClick={() => handleSaveEdit(section)}
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      className="cancel-button"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`rendered-section ${
                    hasTextEdit ? "has-edits" : ""
                  } ${isCentered ? "center-aligned" : ""}`}
                >
                  {hasTextEdit && (
                    <div className="edit-indicator">✏️ Modified</div>
                  )}
                  {isCentered ? (
                    <div className="center-wrapper">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {hasTextEdit
                          ? editChanges.textEdits[section.title]
                          : section.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {hasTextEdit
                        ? editChanges.textEdits[section.title]
                        : section.content}
                    </ReactMarkdown>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default App;
