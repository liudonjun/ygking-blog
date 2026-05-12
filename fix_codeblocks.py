#!/usr/bin/env python3
"""Batch fix markdown code blocks without language annotations."""

import os
import re
import sys

DOCS_DIR = sys.argv[1] if len(sys.argv) > 1 else '/Users/joon/Desktop/code/dcos/ygking-blog/docs'

def detect_language(code):
    code_lower = code.lower().strip()
    if not code_lower:
        return 'text'

    # Dart
    if re.search(r"import\s+['\"]package:flutter", code):
        return 'dart'
    if re.search(r"import\s+['\"]dart:", code):
        return 'dart'

    # XML
    if re.search(r'<(uses-permission|manifest|application|activity|intent-filter|meta-data)', code):
        return 'xml'
    if re.search(r'<\?xml', code):
        return 'xml'
    if re.search(r'<resources', code):
        return 'xml'

    # YAML
    if re.search(r'^(dependencies|dev_dependencies|flutter|environment|name|description|version):', code, re.MULTILINE):
        return 'yaml'

    # Groovy
    if re.search(r'\b(implementation|api|compileSdk|minSdk|targetSdk|classpath|apply\s+plugin|buildscript)\b', code):
        return 'groovy'
    if re.search(r'(plugins\s*\{|dependencies\s*\{|android\s*\{)', code):
        return 'groovy'

    # Kotlin
    if re.search(r'\b(override\s+fun|lateinit\s+var|suspend\s+fun|companion\s+object|data\s+class)\b', code):
        return 'kotlin'
    if re.search(r'^\s*fun\s+\w+\s*\(', code, re.MULTILINE):
        return 'kotlin'

    # Bash
    if re.search(r'^\$\s', code, re.MULTILINE):
        return 'bash'
    if re.search(r'\b(sudo|npm|pnpm|yarn|git)\s+', code):
        return 'bash'
    if re.search(r'\b(apt-get|brew|curl|wget|chmod)\b', code):
        return 'bash'

    # Tree structure
    if re.search(r'[├└│]', code):
        return 'text'

    # JSON
    if code_lower.startswith('{') or code_lower.startswith('['):
        if re.search(r'"[\w]+"\s*:', code):
            return 'json'

    # TypeScript
    if re.search(r'\b(interface\s+\w+|type\s+\w+\s*=)', code):
        return 'typescript'
    if re.search(r'import\s+\{.*\}\s+from\s+[\'"]', code):
        return 'typescript'

    # JavaScript
    if re.search(r'\b(const|let|var|function|require\(|module\.exports|console\.log)\b', code):
        return 'javascript'

    # Python
    if re.search(r'\b(def |elif |except |import os|from \w+ import )\b', code):
        return 'python'

    return 'text'


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Find lines that are unannotated opening ``` markers
    # We use a state machine: track if we're inside a code block
    in_code_block = False
    open_indices = []  # Line indices of unannotated opening ```
    code_contents = []  # Corresponding code content for each block

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('```'):
            if not in_code_block:
                # This is an opening marker
                # Check if it has a language tag: ``` followed by non-whitespace
                after_backticks = stripped[3:].strip()
                if not after_backticks:
                    # Unannotated opening
                    open_indices.append(i)
                    code_contents.append('')
                    in_code_block = True
                else:
                    # Has language tag
                    in_code_block = True
            else:
                # This is a closing marker
                # Collect code content for the last open block
                if open_indices and code_contents[-1] == '':
                    # Fill in the code content
                    start_line = open_indices[-1] + 1
                    code_contents[-1] = ''.join(lines[start_line:i])
                in_code_block = False
        else:
            if in_code_block and open_indices:
                # Accumulate code content if not yet set
                pass  # We'll collect it when we hit the closing ```

    if not open_indices:
        return 0

    # Now apply fixes from end to start
    for idx in reversed(range(len(open_indices))):
        line_idx = open_indices[idx]
        code = code_contents[idx] if idx < len(code_contents) else ''
        language = detect_language(code)
        lines[line_idx] = lines[line_idx].rstrip('\n').rstrip() + language + '\n'

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    return len(open_indices)


def main():
    total_files = 0
    total_blocks = 0

    for root, dirs, files in os.walk(DOCS_DIR):
        if '.vitepress' in root:
            continue
        for fname in files:
            if not fname.endswith('.md'):
                continue
            filepath = os.path.join(root, fname)
            fixed = process_file(filepath)
            if fixed > 0:
                total_files += 1
                total_blocks += fixed
                rel = os.path.relpath(filepath, DOCS_DIR)
                print("  Fixed %3d blocks in %s" % (fixed, rel))

    print("")
    print("Summary: Fixed %d code blocks across %d files" % (total_blocks, total_files))


if __name__ == '__main__':
    main()
