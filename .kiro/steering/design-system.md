---
inclusion: always
---

# Figma Design System Integration Rules

This document defines how Figma designs should be integrated into this codebase.

## Project Context

This is a documentation-focused repository for AWS AI Development Lifecycle (AIDLC) rules and guidelines. The project structure is primarily markdown-based documentation.

## Design System Structure

### 1. Token Definitions
- **Location**: Not currently defined
- **Format**: To be established when UI components are added
- **Recommendation**: Use CSS custom properties or design tokens in JSON format

### 2. Component Library
- **Location**: No UI components currently exist
- **Architecture**: To be determined based on future requirements
- **Recommendation**: If UI is added, consider a component-based architecture with clear separation of concerns

### 3. Frameworks & Libraries
- **Current State**: Documentation-only project
- **Future Considerations**: 
  - If UI is needed, consider React or Vue for component-based architecture
  - Markdown-based documentation system is primary focus

### 4. Asset Management
- **Current State**: No asset management system in place
- **Recommendation**: Store assets in `/assets` or `/public` directory when needed

### 5. Icon System
- **Current State**: No icon system defined
- **Recommendation**: Use SVG icons with a consistent naming convention when needed

### 6. Styling Approach
- **Current State**: No styling system in place
- **Recommendation**: If UI is added, consider Tailwind CSS or CSS Modules for maintainability

### 7. Project Structure
```
.
├── .amazonq/              # Amazon Q AI rules and details
│   ├── aws-aidlc-rule-details/
│   └── rules/
├── .kiro/                 # Kiro IDE configuration
│   ├── settings/
│   └── steering/          # Steering files (this file)
└── aidlc-docs/           # AIDLC documentation
    └── inception/
```

## Figma Integration Guidelines

When integrating Figma designs into this project:

1. **Code Generation**: Treat Figma MCP output as a starting point, not final code
2. **Component Reuse**: Establish reusable components before duplicating functionality
3. **Design Tokens**: Define a token system before implementing multiple components
4. **Visual Parity**: Strive for 1:1 visual match with Figma designs
5. **Documentation**: Document all design decisions and component usage

## Code Connect Mapping

When mapping Figma components to code:
- Use descriptive component names that match Figma layer names
- Store components in a logical directory structure
- Maintain consistent naming conventions across Figma and code

## Future Enhancements

As the project evolves:
- Define a comprehensive design token system
- Establish component library structure
- Set up asset management pipeline
- Create icon system and guidelines
