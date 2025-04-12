from flask import Flask, render_template, request, redirect, url_for
import requests
import io
import PyPDF2
import traceback
import re
import random
import string
import hashlib

app = Flask(__name__)
app.debug = True

@app.route('/')
def index():
    try:
        return render_template('index.html')
    except Exception as e:
        error_message = f"Error rendering template: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return f"<h1>Error</h1><pre>{error_message}</pre>"

@app.route('/check', methods=['POST'])
def check_plagiarism():
    if request.method == 'POST':
        try:
            # Get GitHub URL
            github_url = request.form['github_url']
            
            # Convert GitHub URL to raw content URL
            if 'github.com' in github_url and '/blob/' in github_url:
                raw_url = github_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
            else:
                return f"<h1>Error</h1><p>Invalid GitHub URL format: {github_url}</p><p>Please use a URL to a specific file.</p>"
            
            # Get content from GitHub
            response = requests.get(raw_url)
            if response.status_code != 200:
                return f"<h1>Error</h1><p>Failed to fetch GitHub file. Status code: {response.status_code}</p><p>URL: {raw_url}</p>"
            
            # Check if the file is a PDF
            is_pdf_github = github_url.lower().endswith('.pdf')
            
            if is_pdf_github:
                # Handle PDF from GitHub
                content = extract_text_from_pdf(io.BytesIO(response.content))
            else:
                # Handle text file from GitHub
                content = response.text
            
            # Analyze the content for plagiarism indicators
            analysis = analyze_content_for_plagiarism(content, github_url)
            
            # Return result
            return render_template('index.html', analysis=analysis, github_url=github_url)
            
        except Exception as e:
            error_message = f"An error occurred: {str(e)}\n{traceback.format_exc()}"
            print(error_message)
            return f"<h1>Error</h1><pre>{error_message}</pre>"
    
    return redirect(url_for('index'))

def extract_text_from_pdf(pdf_file):
    """Extract text content from a PDF file"""
    text = ""
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        error_message = f"Error extracting text from PDF: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return error_message

def analyze_content_for_plagiarism(content, url):
    """Analyze the content for indicators of plagiarism"""
    # Initialize analysis result
    analysis = {
        'score': 0,
        'details': [],
        'recommendation': ''
    }
    
    # Get file extension from URL
    file_extension = url.split('.')[-1].lower() if '.' in url else ''
    
    # 1. Check for code consistency
    code_consistency = check_code_consistency(content, file_extension)
    analysis['details'].append(code_consistency)
    
    # 2. Check for comments and documentation
    comments_analysis = check_comments(content, file_extension)
    analysis['details'].append(comments_analysis)
    
    # 3. Check for unique identifiers
    identifiers_analysis = check_identifiers(content, file_extension)
    analysis['details'].append(identifiers_analysis)
    
    # 4. Check for code complexity
    complexity_analysis = check_code_complexity(content, file_extension)
    analysis['details'].append(complexity_analysis)
    
    # 5. Check for common plagiarism patterns
    patterns_analysis = check_plagiarism_patterns(content)
    analysis['details'].append(patterns_analysis)
    
    # Calculate overall score based on individual analyses
    total_weight = 0
    weighted_score = 0
    
    for detail in analysis['details']:
        weighted_score += detail['score'] * detail['weight']
        total_weight += detail['weight']
    
    if total_weight > 0:
        analysis['score'] = round(weighted_score / total_weight)
    
    # Generate recommendation based on score
    if analysis['score'] > 70:
        analysis['recommendation'] = "High probability of plagiarism. The content shows multiple indicators of copied work. Further investigation is recommended."
    elif analysis['score'] > 40:
        analysis['recommendation'] = "Moderate probability of plagiarism. Some sections may be copied or heavily inspired by other sources. Consider reviewing the highlighted areas."
    else:
        analysis['recommendation'] = "Low probability of plagiarism. The content appears to be mostly original, though some common patterns may exist as is normal in programming."
    
    return analysis

def check_code_consistency(content, file_ext):
    """Check for consistency in coding style, which can indicate multiple authors or copied code"""
    result = {
        'name': 'Code Style Consistency',
        'score': 0,
        'weight': 2.5,
        'description': '',
        'evidence': ''
    }
    
    # Check for mixed indentation (spaces vs tabs)
    space_indents = len(re.findall(r'^\s+[^\t]', content, re.MULTILINE))
    tab_indents = len(re.findall(r'^\t+', content, re.MULTILINE))
    
    # Check for mixed naming conventions (camelCase vs snake_case)
    camel_case = len(re.findall(r'\b[a-z]+[A-Z][a-zA-Z]*\b', content))
    snake_case = len(re.findall(r'\b[a-z]+_[a-z]+\b', content))
    
    # Check for inconsistent brace styles
    same_line_braces = len(re.findall(r'[^ ]\) {', content))
    new_line_braces = len(re.findall(r'\)\n\s*{', content))
    
    inconsistency_score = 0
    evidence_parts = []
    
    # Evaluate indentation consistency
    if space_indents > 0 and tab_indents > 0:
        inconsistency_score += 30
        evidence_parts.append(f"Mixed indentation (spaces: {space_indents}, tabs: {tab_indents})")
    
    # Evaluate naming convention consistency
    if camel_case > 0 and snake_case > 0:
        ratio = min(camel_case, snake_case) / max(camel_case, snake_case) if max(camel_case, snake_case) > 0 else 0
        if ratio > 0.2:  # If there's a significant mix
            inconsistency_score += 25
            evidence_parts.append(f"Mixed naming conventions (camelCase: {camel_case}, snake_case: {snake_case})")
    
    # Evaluate brace style consistency
    if same_line_braces > 0 and new_line_braces > 0:
        ratio = min(same_line_braces, new_line_braces) / max(same_line_braces, new_line_braces) if max(same_line_braces, new_line_braces) > 0 else 0
        if ratio > 0.2:  # If there's a significant mix
            inconsistency_score += 20
            evidence_parts.append(f"Inconsistent brace styles")
    
    result['score'] = min(inconsistency_score, 100)
    
    if result['score'] > 60:
        result['description'] = "High inconsistency in coding style, suggesting multiple authors or copied code from different sources."
    elif result['score'] > 30:
        result['description'] = "Some inconsistencies in coding style detected, which may indicate portions of code from different sources."
    else:
        result['description'] = "Consistent coding style throughout the file, suggesting single authorship."
    
    if evidence_parts:
        result['evidence'] = "; ".join(evidence_parts)
    
    return result

def check_comments(content, file_ext):
    """Check for comments quality and consistency"""
    result = {
        'name': 'Comments Analysis',
        'score': 0,
        'weight': 1.5,
        'description': '',
        'evidence': ''
    }
    
    # Extract comments based on file type
    comments = []
    if file_ext in ['py']:
        # Python comments
        comments = re.findall(r'#.*?$|""".*?"""|\'\'\'.*?\'\'\'', content, re.MULTILINE | re.DOTALL)
    elif file_ext in ['js', 'java', 'c', 'cpp', 'cs']:
        # C-style comments
        comments = re.findall(r'//.*?$|/\*.*?\*/', content, re.MULTILINE | re.DOTALL)
    
    total_lines = len(content.splitlines())
    comment_lines = len(comments)
    
    # Calculate comment density
    comment_density = comment_lines / total_lines if total_lines > 0 else 0
    
    # Check for copied comments (common in plagiarized code)
    copied_comment_indicators = [
        'copied from', 'source:', 'reference:', 'based on', 'adapted from',
        'inspired by', 'taken from', 'credit to', 'thanks to'
    ]
    
    copied_comments = 0
    for comment in comments:
        if any(indicator in comment.lower() for indicator in copied_comment_indicators):
            copied_comments += 1
    
    plagiarism_score = 0
    evidence_parts = []
    
    # Very low comment density can indicate copied code without understanding
    if comment_density < 0.05 and total_lines > 50:
        plagiarism_score += 30
        evidence_parts.append(f"Very low comment density ({comment_density:.2f})")
    
    # Direct references to copying
    if copied_comments > 0:
        plagiarism_score += min(copied_comments * 20, 70)
        evidence_parts.append(f"Found {copied_comments} comments indicating copied code")
    
    result['score'] = min(plagiarism_score, 100)
    
    if result['score'] > 60:
        result['description'] = "Comments suggest high probability of copied code."
    elif result['score'] > 30:
        result['description'] = "Comments indicate some portions may be copied or adapted from other sources."
    else:
        result['description'] = "Comments appear consistent with original authorship."
    
    if evidence_parts:
        result['evidence'] = "; ".join(evidence_parts)
    
    return result

def check_identifiers(content, file_ext):
    """Check for unique and meaningful identifiers"""
    result = {
        'name': 'Identifier Analysis',
        'score': 0,
        'weight': 2.0,
        'description': '',
        'evidence': ''
    }
    
    # Extract identifiers based on file type
    identifiers = []
    if file_ext in ['py', 'js', 'java', 'c', 'cpp', 'cs']:
        # Match variable and function names
        identifiers = re.findall(r'\b(?:var|let|const|function|def|class|int|float|double|string|char|bool|void)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b', content)
        # Add more identifiers that might be missed
        identifiers.extend(re.findall(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=', content))
    
    # Check for generic/meaningless variable names
    generic_names = ['temp', 'tmp', 'var', 'foo', 'bar', 'baz', 'x', 'y', 'z', 'i', 'j', 'k', 'a', 'b', 'c']
    generic_count = sum(1 for id in identifiers if id.lower() in generic_names)
    
    # Check for unique identifiers
    unique_identifiers = set(identifiers)
    uniqueness_ratio = len(unique_identifiers) / len(identifiers) if identifiers else 1
    
    plagiarism_score = 0
    evidence_parts = []
    
    # High percentage of generic names can indicate copied code without understanding
    if identifiers and len(identifiers) > 5:
        generic_ratio = generic_count / len(identifiers)
        if generic_ratio > 0.5:
            plagiarism_score += min(generic_ratio * 100, 60)
            evidence_parts.append(f"High ratio of generic variable names ({generic_ratio:.2f})")
    
    # Low uniqueness can indicate copy-paste code
    if uniqueness_ratio < 0.7 and len(identifiers) > 10:
        plagiarism_score += (1 - uniqueness_ratio) * 50
        evidence_parts.append(f"Low identifier uniqueness ratio ({uniqueness_ratio:.2f})")
    
    result['score'] = min(plagiarism_score, 100)
    
    if result['score'] > 60:
        result['description'] = "Identifier patterns suggest high probability of copied code."
    elif result['score'] > 30:
        result['description'] = "Some identifier patterns indicate possible code reuse without proper customization."
    else:
        result['description'] = "Identifier usage appears consistent with original authorship."
    
    if evidence_parts:
        result['evidence'] = "; ".join(evidence_parts)
    
    return result

def check_code_complexity(content, file_ext):
    """Check for code complexity patterns that might indicate plagiarism"""
    result = {
        'name': 'Code Complexity',
        'score': 0,
        'weight': 1.5,
        'description': '',
        'evidence': ''
    }
    
    # Count lines of code (excluding blank lines and comments)
    code_lines = 0
    comment_pattern = r'^\s*(#|//|/\*|\*)'
    for line in content.splitlines():
        if line.strip() and not re.match(comment_pattern, line.strip()):
            code_lines += 1
    
    # Check for complex one-liners (often copy-pasted)
    complex_one_liners = re.findall(r'[^;\n]{100,}', content)
    
    # Check for nested loops and conditionals
    nested_structures = re.findall(r'(if|for|while).*?\{.*?(if|for|while).*?\{', content, re.DOTALL)
    
    plagiarism_score = 0
    evidence_parts = []
    
    # Extremely complex one-liners are often copied
    if complex_one_liners:
        one_liner_score = min(len(complex_one_liners) * 15, 50)
        plagiarism_score += one_liner_score
        evidence_parts.append(f"Found {len(complex_one_liners)} complex one-liners")
    
    # Very high complexity without proper documentation can indicate copied code
    if nested_structures and len(nested_structures) > 5:
        complexity_score = min(len(nested_structures) * 5, 40)
        plagiarism_score += complexity_score
        evidence_parts.append(f"High code complexity with {len(nested_structures)} nested structures")
    
    result['score'] = min(plagiarism_score, 100)
    
    if result['score'] > 60:
        result['description'] = "Code complexity patterns suggest high probability of copied code without full understanding."
    elif result['score'] > 30:
        result['description'] = "Some complexity patterns indicate possible code reuse."
    else:
        result['description'] = "Code complexity appears consistent with original authorship."
    
    if evidence_parts:
        result['evidence'] = "; ".join(evidence_parts)
    
    return result

def check_plagiarism_patterns(content):
    """Check for common patterns that indicate plagiarism"""
    result = {
        'name': 'Plagiarism Patterns',
        'score': 0,
        'weight': 3.0,
        'description': '',
        'evidence': ''
    }
    
    # Check for attribution comments or links
    attribution_patterns = [
        r'source:.*?http', r'from:.*?http', r'credit:.*?http',
        r'adapted from', r'based on', r'copied from',
        r'stackoverflow\.com', r'github\.com'
    ]
    
    attributions = []
    for pattern in attribution_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        attributions.extend(matches)
    
    # Check for code snippets that are commonly copied
    common_snippets = [
        r'public\s+static\s+void\s+main\s*\(\s*String\s*\[\]\s*args',  # Java main
        r'if\s+__name__\s*==\s*[\'"]__main__[\'"]',  # Python main
        r'function\s+getElementBy(Id|ClassName|TagName)',  # Common JS DOM functions
        r'import\s+numpy\s+as\s+np.*?import\s+matplotlib\.pyplot\s+as\s+plt',  # Common data science imports
        r'SELECT.*?FROM.*?WHERE',  # SQL queries
    ]
    
    snippet_matches = []
    for pattern in common_snippets:
        if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
            snippet_matches.append(pattern)
    
    # Check for unusual character encodings or hidden characters (sometimes used to mask plagiarism)
    unusual_chars = re.findall(r'[^\x00-\x7F]', content)
    
    plagiarism_score = 0
    evidence_parts = []
    
    # Direct attributions are strong indicators
    if attributions:
        attribution_score = min(len(attributions) * 25, 75)
        plagiarism_score += attribution_score
        evidence_parts.append(f"Found {len(attributions)} attribution references")
        if attributions:
            evidence_parts.append(f"Example: {attributions[0][:50]}...")
    
    # Common snippets aren't necessarily plagiarism but increase probability
    if snippet_matches:
        snippet_score = min(len(snippet_matches) * 10, 30)
        plagiarism_score += snippet_score
        evidence_parts.append(f"Found {len(snippet_matches)} commonly copied code patterns")
    
    # Unusual characters can indicate attempts to mask plagiarism
    if unusual_chars and len(unusual_chars) > 5:
        char_score = min(len(unusual_chars) * 2, 20)
        plagiarism_score += char_score
        evidence_parts.append(f"Found {len(unusual_chars)} unusual characters")
    
    result['score'] = min(plagiarism_score, 100)
    
    if result['score'] > 60:
        result['description'] = "Strong indicators of plagiarism detected in the code."
    elif result['score'] > 30:
        result['description'] = "Some patterns suggest portions of the code may be copied from other sources."
    else:
        result['description'] = "Few or no common plagiarism patterns detected."
    
    if evidence_parts:
        result['evidence'] = "; ".join(evidence_parts)
    
    return result

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
