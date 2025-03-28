document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const darkModeToggle = document.getElementById('darkModeToggle');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
    const apiKeyInput = document.getElementById('apiKey');
    const outputContainer = document.getElementById('outputContainer');
    const outputElement = document.getElementById('output');
    const loadingElement = document.getElementById('loading');
    const copyModal = document.getElementById('copyModal');
    const closeModalBtn = document.getElementById('closeModal');
    const aboutLink = document.getElementById('aboutLink');
    const aboutModal = document.getElementById('aboutModal');
    const closeAboutModalBtn = document.getElementById('closeAboutModal');
    const strictnessRatingInput = document.getElementById('strictnessRating');
    
    // Check for dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Load saved API key if available
    if (localStorage.getItem('geminiApiKey')) {
        apiKeyInput.value = localStorage.getItem('geminiApiKey');
    }
    
    // Event Listeners
    darkModeToggle.addEventListener('click', toggleDarkMode);
    generateBtn.addEventListener('click', generateFeedback);
    copyBtn.addEventListener('click', copyFeedbackToClipboard);
    toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
    closeModalBtn.addEventListener('click', () => copyModal.style.display = 'none');
    aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.style.display = 'flex';
    });
    closeAboutModalBtn.addEventListener('click', () => aboutModal.style.display = 'none');
    
    // API Key input change - save to localStorage
    apiKeyInput.addEventListener('change', () => {
        localStorage.setItem('geminiApiKey', apiKeyInput.value);
    });
    
    // Functions
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    function toggleApiKeyVisibility() {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleApiKeyBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            apiKeyInput.type = 'password';
            toggleApiKeyBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }
    
    async function generateFeedback() {
        // Get input values
        const assignmentType = document.getElementById('assignmentType').value.trim();
        const gradeLevel = document.getElementById('gradeLevel').value.trim();
        const discipline = document.getElementById('discipline').value.trim();
        const knowledgeLevel = document.getElementById('knowledgeLevel').value;
        const strictnessRating = strictnessRatingInput.value.trim();
        const questionText = document.getElementById('questionText').value.trim();
        const expectedAnswer = document.getElementById('expectedAnswer').value.trim();
        const rubricElements = document.getElementById('rubricElements').value.trim();
        const studentSubmission = document.getElementById('studentSubmission').value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        // Validate inputs
        if (!assignmentType || !gradeLevel || !discipline || !questionText || !studentSubmission) {
            alert('Please fill in the required fields: Assignment Type, Grade Level, Discipline, Question(s), and Student Submission.');
            return;
        }
        
        if (!strictnessRating || strictnessRating < 1 || strictnessRating > 5) {
            alert('Please enter a valid strictness rating between 1 and 5.');
            return;
        }
        
        if (!apiKey) {
            alert('Please enter your Gemini API Key.');
            return;
        }
        
        // Show loading
        loadingElement.style.display = 'block';
        outputElement.innerHTML = '';
        copyBtn.disabled = true;
        
        try {
            const response = await callGeminiAPI({
                assignmentType,
                gradeLevel,
                discipline,
                knowledgeLevel,
                strictnessRating,
                questionText,
                expectedAnswer,
                rubricElements,
                studentSubmission,
                apiKey
            });
            
            // Display result
            outputElement.innerHTML = response;
            copyBtn.disabled = false;
        } catch (error) {
            outputElement.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        } finally {
            loadingElement.style.display = 'none';
        }
    }
    
    // Map knowledge level values to descriptive text
    function getKnowledgeLevelDescription(level) {
        const levelDescriptions = {
            'beginner': 'Students are just being introduced to the subject matter and should demonstrate basic understanding of fundamental concepts.',
            'intermediate': 'Students have some background in the subject and should demonstrate application of concepts and deeper understanding.',
            'advanced': 'Students have significant experience with the subject and should demonstrate synthesis of ideas and critical analysis.',
            'expert': 'Students have extensive knowledge of the field and should demonstrate mastery, original insights, and field-specific expertise.'
        };
        
        return levelDescriptions[level] || level;
    }
    
    async function callGeminiAPI({ assignmentType, gradeLevel, discipline, knowledgeLevel, strictnessRating, questionText, expectedAnswer, rubricElements, studentSubmission, apiKey }) {
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent';
        
        const knowledgeLevelDescription = getKnowledgeLevelDescription(knowledgeLevel);
        
        const prompt = `
        Generate a comprehensive, professional assessment of a student submission with detailed feedback, adhering to the following specifications:

ASSIGNMENT DETAILS:
- Assignment Type: ${assignmentType}
- Grade Level: ${gradeLevel}
- Academic Discipline: ${discipline}
- Knowledge Level: ${knowledgeLevelDescription}
- Strictness Rating: ${strictnessRating}/5 (where 1 is most lenient and 5 is most strict)

ASSIGNMENT QUESTION:
${questionText}

${expectedAnswer ? `EXPECTED ANSWER OR KEY POINTS:
${expectedAnswer}` : ''}

${rubricElements ? `RUBRIC ELEMENTS:
${rubricElements}` : 'STANDARD RUBRIC ELEMENTS:\n- Content Accuracy\n- Critical Thinking\n- Organization\n- Clarity of Expression\n- Grammar and Mechanics'}

STUDENT SUBMISSION:
${studentSubmission}

FEEDBACK REQUIREMENTS:

1. OVERALL ASSESSMENT
- Begin with a positive, constructive opening statement about the submission's strengths
- Provide a brief summary of the overall quality and effectiveness of the response
- Include a provisional grade or score (use appropriate scale for the discipline and level)
- Use encouraging, growth-minded language while maintaining academic rigor

2. RUBRIC-BASED EVALUATION
- Provide a detailed assessment for each rubric element
- For each element include:
  * A numeric score with clear rationale
  * Specific examples from student work demonstrating strengths/weaknesses
  * Clear connection between feedback and criteria
  * Balance of positive observations and constructive criticism
- If no rubric was provided, evaluate based on standard elements appropriate for the discipline

3. CONTENT ACCURACY AND COMPLETENESS
- Analyze the factual accuracy of the submission
- Identify any misconceptions or factual errors
- Note any significant omissions based on the expected answer
- Acknowledge creative or insightful approaches that may diverge from expected answers but demonstrate learning
- Strictness level ${strictnessRating}/5 should guide how closely the submission must match expected answers

4. IMPROVEMENT SUGGESTIONS
- Offer 3-5 specific, actionable recommendations for improvement
- Prioritize the most impactful changes the student could make
- Include examples or mini-demonstrations where appropriate
- Frame suggestions in terms of skill development rather than deficits
- Suggest resources or approaches that would help address identified weaknesses

5. STRENGTHS RECOGNITION
- Highlight 2-3 specific strengths demonstrated in the submission
- Connect these strengths to academic and/or professional skills
- Use specific examples from the student work
- Acknowledge effort, insight, and growth where evident

6. SUMMARY AND NEXT STEPS
- Provide a concise summary of the major feedback points
- End with a positive, forward-looking statement
- Suggest 1-2 specific next steps or focus areas for the student's continued learning

FORMATTING GUIDANCE:
- Use clear headings to organize feedback sections
- Bold key points and recommendations
- Write in a professional, supportive tone appropriate for educational contexts
- Balance criticism with encouragement
- Ensure feedback is specific, actionable, and tied directly to the submission
- Adapt language to the appropriate academic level (${gradeLevel})
- Format the feedback so it's ready to be copied directly into an LMS or email

The final feedback should be comprehensive, constructive, and helpful for student growth while maintaining appropriate academic standards for the specified grade level and discipline. Apply the strictness rating (${strictnessRating}/5) to determine how rigorous the assessment should be.
        `;
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 1.0,
                maxOutputTokens: 20000,
            }
        };
        
        try {
            const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API request failed');
            }
            
            const data = await response.json();
            
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No response generated. Please try again.');
            }
            
            // Extract the text content from the response
            let textContent = '';
            
            data.candidates[0].content.parts.forEach(part => {
                if (part.text) {
                    textContent += part.text;
                }
            });
            
            return textContent;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    function copyFeedbackToClipboard() {
        const textToCopy = outputElement.textContent;
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                copyModal.style.display = 'flex';
            })
            .catch((error) => {
                console.error('Failed to copy text:', error);
                alert('Failed to copy text to clipboard. Please try again or copy manually.');
            });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === copyModal) {
            copyModal.style.display = 'none';
        }
        if (event.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });
});