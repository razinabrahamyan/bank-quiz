import json
import os

def add_ids_to_questions():
    """Add unique IDs to all questions in questions.json"""
    
    questions_file = 'public/questions.json'
    
    if not os.path.exists(questions_file):
        print(f"File {questions_file} not found!")
        return
    
    try:
        # Load existing questions
        with open(questions_file, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        print(f"Loaded {len(questions)} questions")
        
        # Add IDs to each question
        for i, question in enumerate(questions):
            question['id'] = i + 1  # Start from 1
        
        # Save back to file
        with open(questions_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully added IDs to {len(questions)} questions")
        print(f"Updated file: {questions_file}")
        
    except Exception as e:
        print(f"Error processing file: {e}")

if __name__ == "__main__":
    add_ids_to_questions()
